import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// Prijzen worden gecached in DB - alleen opnieuw fetchen als ouder dan 24 uur
const PRICE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 uur

// Fetch single card pricing met timeout
async function fetchCardPricing(cardId, apiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s per kaart
  
  try {
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards/${cardId}`,
      {
        headers: { 'X-Api-Key': apiKey },
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (data.data?.tcgplayer?.prices) {
        const exchangeRate = 0.92;
        const apiCard = data.data;
        const convertedPrices = {};
        
        Object.keys(apiCard.tcgplayer.prices).forEach(variantKey => {
          const variant = apiCard.tcgplayer.prices[variantKey];
          if (variant) {
            convertedPrices[variantKey] = {
              market: variant.market ? variant.market * exchangeRate : null,
              mid: variant.mid ? variant.mid * exchangeRate : null,
              low: variant.low ? variant.low * exchangeRate : null,
              high: variant.high ? variant.high * exchangeRate : null
            };
          }
        });
        
        return {
          url: apiCard.tcgplayer?.url || null,
          prices: convertedPrices,
          lastUpdated: new Date().toISOString()
        };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Process cards in chunks with concurrency limit
async function fetchPricingWithLimit(cardIds, apiKey, concurrency = 5) {
  const results = new Map();
  
  for (let i = 0; i < cardIds.length; i += concurrency) {
    const chunk = cardIds.slice(i, i + concurrency);
    const promises = chunk.map(async (cardId) => {
      const pricing = await fetchCardPricing(cardId, apiKey);
      if (pricing) results.set(cardId, pricing);
    });
    
    await Promise.all(promises);
    
    // Kleine pauze tussen chunks om rate limits te voorkomen
    if (i + concurrency < cardIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

export async function GET(request, { params }) {
  const startTime = Date.now();
  
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }
    
    const pokemonApiKey = process.env.POKEMON_TCG_API_KEY;
    const prisma = getPrisma();
    
    // FASE 1: Database lookup
    console.log(`🔍 Looking up user: ${username}`);
    
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log(`✅ User found: ${user.username} (${Date.now() - startTime}ms)`);
    
    // FASE 2: Kaarten ophalen uit database (inclusief cached pricing)
    const purchaseCards = await prisma.purchaseCard.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      orderBy: [
        { setId: 'asc' },
        { cardNumber: 'asc' }
      ]
    });
    
    console.log(`📦 Found ${purchaseCards.length} cards (${Date.now() - startTime}ms)`);
    
    // Helper: parse JSON veilig
    const parseJson = (data) => {
      if (!data) return null;
      if (typeof data === 'object') return data;
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    };
    
    // Als geen kaarten, return direct
    if (purchaseCards.length === 0) {
      return NextResponse.json({
        user: {
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl
        },
        cards: [],
        _meta: { totalCards: 0, pricedCards: 0, cachedCards: 0, loadTimeMs: Date.now() - startTime }
      });
    }
    
    // FASE 3: Bepaal welke kaarten verse prijzen nodig hebben
    const now = Date.now();
    const cardsNeedingPrices = [];
    const cachedPriceMap = new Map();
    
    purchaseCards.forEach(card => {
      const lastUpdated = card.tcgplayerUpdated ? new Date(card.tcgplayerUpdated).getTime() : 0;
      const isFresh = (now - lastUpdated) < PRICE_CACHE_TTL_MS;
      
      if (isFresh && card.tcgplayerPrices) {
        // Use cached pricing
        const cachedPrices = parseJson(card.tcgplayerPrices);
        if (cachedPrices) {
          cachedPriceMap.set(card.cardId, {
            url: card.tcgplayerUrl,
            prices: cachedPrices,
            lastUpdated: card.tcgplayerUpdated?.toISOString() || null
          });
        } else {
          cardsNeedingPrices.push(card);
        }
      } else {
        cardsNeedingPrices.push(card);
      }
    });
    
    const cachedCount = cachedPriceMap.size;
    console.log(`💾 ${cachedCount} cached, ${cardsNeedingPrices.length} need refresh`);
    
    // FASE 4: Fetch prijzen voor kaarten die dat nodig hebben
    // Individuele queries zijn VEEL sneller dan batch OR queries!
    let freshPricingMap = new Map();
    
    if (pokemonApiKey && cardsNeedingPrices.length > 0) {
      const cardIdsToFetch = cardsNeedingPrices.map(c => c.cardId);
      console.log(`🔄 Fetching ${cardIdsToFetch.length} prices (5 concurrent)...`);
      
      freshPricingMap = await fetchPricingWithLimit(cardIdsToFetch, pokemonApiKey, 5);
      
      console.log(`✅ Fetched ${freshPricingMap.size}/${cardIdsToFetch.length} prices (${Date.now() - startTime}ms)`);
      
      // FASE 5: Update database met nieuwe prijzen (fire-and-forget)
      if (freshPricingMap.size > 0) {
        const updatePromises = [];
        
        freshPricingMap.forEach((pricing, cardId) => {
          const card = cardsNeedingPrices.find(c => c.cardId === cardId);
          if (card) {
            updatePromises.push(
              prisma.purchaseCard.update({
                where: { id: card.id },
                data: {
                  tcgplayerPrices: JSON.stringify(pricing.prices),
                  tcgplayerUrl: pricing.url,
                  tcgplayerUpdated: new Date()
                }
              }).catch(err => console.warn(`DB update failed for ${cardId}:`, err.message))
            );
          }
        });
        
        // Fire-and-forget
        Promise.all(updatePromises).then(() => {
          console.log(`💾 Cached ${updatePromises.length} prices to DB`);
        });
      }
    }
    
    // FASE 6: Combineer alle kaarten met pricing
    const cardsWithPricing = purchaseCards.map(card => {
      const images = parseJson(card.images) || { small: null, large: null };
      
      // Probeer: 1) verse API data, 2) cached data
      const tcgplayer = freshPricingMap.get(card.cardId) || cachedPriceMap.get(card.cardId) || null;
      
      return {
        id: card.id,
        userId: card.userId,
        setId: card.setId,
        setName: card.setName,
        cardId: card.cardId,
        cardName: card.cardName,
        cardNumber: card.cardNumber,
        images,
        addedAt: card.addedAt,
        isActive: card.isActive,
        tcgplayer
      };
    });
    
    const pricedCount = cardsWithPricing.filter(c => c.tcgplayer).length;
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ DONE: ${pricedCount}/${cardsWithPricing.length} priced (${cachedCount} cached, ${freshPricingMap.size} fresh) (${totalTime}ms)`);
    
    return NextResponse.json({
      user: {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl
      },
      cards: cardsWithPricing,
      _meta: {
        totalCards: cardsWithPricing.length,
        pricedCards: pricedCount,
        cachedCards: cachedCount,
        freshFetched: freshPricingMap.size,
        loadTimeMs: totalTime
      }
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

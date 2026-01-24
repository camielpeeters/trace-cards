import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// Prijzen worden gecached in DB - alleen opnieuw fetchen als ouder dan 24 uur
const PRICE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 uur

// Fetch single card pricing met timeout
async function fetchCardPricing(cardId, apiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  
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

// Background price fetching (fire-and-forget)
async function fetchAndCachePricesInBackground(cards, apiKey, prisma) {
  console.log(`🔄 Background: fetching ${cards.length} prices...`);
  
  for (const card of cards) {
    try {
      const pricing = await fetchCardPricing(card.cardId, apiKey);
      if (pricing) {
        await prisma.purchaseCard.update({
          where: { id: card.id },
          data: {
            tcgplayerPrices: JSON.stringify(pricing.prices),
            tcgplayerUrl: pricing.url,
            tcgplayerUpdated: new Date()
          }
        });
        console.log(`💾 Background cached: ${card.cardId}`);
      }
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      console.warn(`Background fetch failed for ${card.cardId}:`, err.message);
    }
  }
  
  console.log(`✅ Background fetch complete`);
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
    const totalCards = purchaseCards.length;
    const cacheRatio = cachedCount / totalCards;
    
    console.log(`💾 ${cachedCount}/${totalCards} cached (${Math.round(cacheRatio * 100)}%), ${cardsNeedingPrices.length} need refresh`);
    
    // FASE 4: Besluit: direct returnen of wachten op fetch?
    // Als >70% gecached is, return direct en fetch de rest op achtergrond
    // Anders, wacht op fetch (eerste bezoek)
    
    let freshPricingMap = new Map();
    
    if (pokemonApiKey && cardsNeedingPrices.length > 0) {
      if (cacheRatio >= 0.7) {
        // VEEL gecached → return direct, fetch op achtergrond
        console.log(`⚡ Fast path: returning cached data, fetching ${cardsNeedingPrices.length} in background`);
        
        // Fire-and-forget background fetch (niet await!)
        fetchAndCachePricesInBackground(cardsNeedingPrices, pokemonApiKey, prisma);
        
      } else {
        // WEINIG gecached → wacht op fetch (eerste bezoek)
        console.log(`🔄 Slow path: fetching ${cardsNeedingPrices.length} prices synchronously...`);
        
        // Fetch met concurrency limit
        for (let i = 0; i < cardsNeedingPrices.length; i += 5) {
          const chunk = cardsNeedingPrices.slice(i, i + 5);
          const promises = chunk.map(async (card) => {
            const pricing = await fetchCardPricing(card.cardId, pokemonApiKey);
            if (pricing) {
              freshPricingMap.set(card.cardId, pricing);
              // Update DB (fire-and-forget)
              prisma.purchaseCard.update({
                where: { id: card.id },
                data: {
                  tcgplayerPrices: JSON.stringify(pricing.prices),
                  tcgplayerUrl: pricing.url,
                  tcgplayerUpdated: new Date()
                }
              }).catch(() => {});
            }
          });
          await Promise.all(promises);
        }
        
        console.log(`✅ Fetched ${freshPricingMap.size}/${cardsNeedingPrices.length} prices (${Date.now() - startTime}ms)`);
      }
    }
    
    // FASE 5: Combineer alle kaarten met pricing
    const cardsWithPricing = purchaseCards.map(card => {
      const images = parseJson(card.images) || { small: null, large: null };
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
    
    console.log(`✅ DONE: ${pricedCount}/${cardsWithPricing.length} priced (${totalTime}ms)`);
    
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
        backgroundFetching: cacheRatio >= 0.7 && cardsNeedingPrices.length > 0 ? cardsNeedingPrices.length : 0,
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

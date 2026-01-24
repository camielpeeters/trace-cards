import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// Prijzen worden gecached in DB - alleen opnieuw fetchen als ouder dan 24 uur
const PRICE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 uur

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
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // FASE 2: Kaarten ophalen uit database (inclusief cached pricing)
    const shopCards = await prisma.shopCard.findMany({
      where: {
        userId: user.id,
        isActive: true,
        stock: { gt: 0 }
      },
      orderBy: [
        { setId: 'asc' },
        { cardNumber: 'asc' }
      ]
    });
    
    console.log(`🛒 Found ${shopCards.length} shop cards (${Date.now() - startTime}ms)`);
    
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
    if (shopCards.length === 0) {
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
    const cardsWithCachedPrices = [];
    
    shopCards.forEach(card => {
      const lastUpdated = card.tcgplayerUpdated ? new Date(card.tcgplayerUpdated).getTime() : 0;
      const isFresh = (now - lastUpdated) < PRICE_CACHE_TTL_MS;
      
      if (isFresh && card.tcgplayerPrices) {
        cardsWithCachedPrices.push(card);
      } else {
        cardsNeedingPrices.push(card);
      }
    });
    
    console.log(`💾 ${cardsWithCachedPrices.length} cached, ${cardsNeedingPrices.length} need refresh`);
    
    // FASE 4: Fetch prijzen voor kaarten die dat nodig hebben
    const pricingMap = new Map();
    
    if (pokemonApiKey && cardsNeedingPrices.length > 0) {
      const BATCH_SIZE = 15;
      const cardIds = cardsNeedingPrices.map(c => c.cardId);
      const batches = [];
      
      for (let i = 0; i < cardIds.length; i += BATCH_SIZE) {
        batches.push(cardIds.slice(i, i + BATCH_SIZE));
      }
      
      // SEQUENTIEEL met delay om rate limits te voorkomen
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const query = batch.map(id => `id:${id}`).join(' OR ');
        const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}`;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          const response = await fetch(url, {
            headers: { 'X-Api-Key': pokemonApiKey },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            const cards = data.data || [];
            
            cards.forEach(apiCard => {
              if (apiCard?.tcgplayer?.prices) {
                const exchangeRate = 0.92;
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
                
                pricingMap.set(apiCard.id, {
                  url: apiCard.tcgplayer?.url || null,
                  prices: convertedPrices,
                  lastUpdated: new Date().toISOString()
                });
              }
            });
          }
        } catch (error) {
          console.warn(`⚠️ Shop batch ${batchIndex + 1} error:`, error.message);
        }
        
        // Delay tussen batches
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // FASE 5: Update database met nieuwe prijzen (fire-and-forget)
      if (pricingMap.size > 0) {
        const updatePromises = [];
        
        pricingMap.forEach((pricing, cardId) => {
          const card = cardsNeedingPrices.find(c => c.cardId === cardId);
          if (card) {
            updatePromises.push(
              prisma.shopCard.update({
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
          console.log(`💾 Cached ${updatePromises.length} shop prices to DB`);
        });
      }
    }
    
    // FASE 6: Combineer alle kaarten met pricing
    const cardsWithPricing = shopCards.map(card => {
      const images = parseJson(card.images) || { small: null, large: null };
      
      let tcgplayer = pricingMap.get(card.cardId);
      
      if (!tcgplayer && card.tcgplayerPrices) {
        const cachedPrices = parseJson(card.tcgplayerPrices);
        if (cachedPrices) {
          tcgplayer = {
            url: card.tcgplayerUrl,
            prices: cachedPrices,
            lastUpdated: card.tcgplayerUpdated?.toISOString() || null
          };
        }
      }
      
      return {
        id: card.id,
        userId: card.userId,
        setId: card.setId,
        setName: card.setName,
        cardId: card.cardId,
        cardName: card.cardName,
        cardNumber: card.cardNumber,
        images,
        price: card.price,
        stock: card.stock,
        addedAt: card.addedAt,
        isActive: card.isActive,
        tcgplayer: tcgplayer || null
      };
    });
    
    const pricedCount = cardsWithPricing.filter(c => c.tcgplayer).length;
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ Shop DONE: ${pricedCount}/${cardsWithPricing.length} priced (${totalTime}ms)`);
    
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
        cachedCards: cardsWithCachedPrices.length,
        freshFetched: pricingMap.size,
        loadTimeMs: totalTime
      }
    });
    
  } catch (error) {
    console.error('❌ Shop cards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

const PRICE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 uur

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

async function fetchAndCachePricesInBackground(cards, apiKey, prisma) {
  for (const card of cards) {
    try {
      const pricing = await fetchCardPricing(card.cardId, apiKey);
      if (pricing) {
        await prisma.shopCard.update({
          where: { id: card.id },
          data: {
            tcgplayerPrices: JSON.stringify(pricing.prices),
            tcgplayerUrl: pricing.url,
            tcgplayerUpdated: new Date()
          }
        });
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      // Ignore errors in background
    }
  }
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
    
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
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
    
    const parseJson = (data) => {
      if (!data) return null;
      if (typeof data === 'object') return data;
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    };
    
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
    
    const now = Date.now();
    const cardsNeedingPrices = [];
    const cachedPriceMap = new Map();
    
    shopCards.forEach(card => {
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
    const totalCards = shopCards.length;
    const cacheRatio = totalCards > 0 ? cachedCount / totalCards : 1;
    
    let freshPricingMap = new Map();
    
    if (pokemonApiKey && cardsNeedingPrices.length > 0) {
      if (cacheRatio >= 0.7) {
        // Return fast, fetch in background
        fetchAndCachePricesInBackground(cardsNeedingPrices, pokemonApiKey, prisma);
      } else {
        // Fetch synchronously
        for (let i = 0; i < cardsNeedingPrices.length; i += 5) {
          const chunk = cardsNeedingPrices.slice(i, i + 5);
          const promises = chunk.map(async (card) => {
            const pricing = await fetchCardPricing(card.cardId, pokemonApiKey);
            if (pricing) {
              freshPricingMap.set(card.cardId, pricing);
              prisma.shopCard.update({
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
      }
    }
    
    const cardsWithPricing = shopCards.map(card => {
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
        price: card.price,
        stock: card.stock,
        addedAt: card.addedAt,
        isActive: card.isActive,
        tcgplayer
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
        cachedCards: cachedCount,
        freshFetched: freshPricingMap.size,
        loadTimeMs: totalTime
      }
    });
    
  } catch (error) {
    console.error('❌ Shop cards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

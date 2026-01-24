import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// Pokemon TCG API ondersteunt batch queries - VEEL efficiënter
// In plaats van 45 losse calls, doen we 3-4 batch calls

export async function GET(request, { params }) {
  const startTime = Date.now();
  
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }
    
    const pokemonApiKey = process.env.POKEMON_TCG_API_KEY;
    const prisma = getPrisma();
    
    // FASE 1: Database lookup (< 500ms)
    console.log(`🔍 Looking up user: ${username}`);
    
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log(`✅ User found: ${user.username} (${Date.now() - startTime}ms)`);
    
    // FASE 2: Kaarten ophalen uit database (< 500ms)
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
    
    console.log(`📦 Found ${purchaseCards.length} cards for user ${user.id} (${Date.now() - startTime}ms)`);
    
    // Debug: log eerste kaart als die bestaat
    if (purchaseCards.length > 0) {
      console.log(`📋 First card: ${purchaseCards[0].cardName} (${purchaseCards[0].cardId})`);
    }
    
    // Helper: parse images veilig (kan string of object zijn)
    const parseImages = (images) => {
      if (!images) return { small: null, large: null };
      if (typeof images === 'object') return images;
      try {
        return JSON.parse(images);
      } catch {
        return { small: null, large: null };
      }
    };
    
    // Als geen API key of geen kaarten, return direct
    if (!pokemonApiKey || purchaseCards.length === 0) {
      const cards = purchaseCards.map(card => ({
        ...card,
        images: parseImages(card.images),
        tcgplayer: null
      }));
      
      console.log(`⚠️ Returning ${cards.length} cards without pricing (no API key or empty)`);
      
      return NextResponse.json({
        user: {
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl
        },
        cards
      });
    }
    
    // FASE 3: BATCH pricing ophalen (max 3-4 API calls totaal!)
    // Pokemon TCG API ondersteunt: ?q=id:card1 OR id:card2 OR id:card3
    // Max ~15 IDs per query (URL length limit)
    
    const BATCH_SIZE = 12; // 12 cards per API call
    const pricingMap = new Map();
    
    // Maak batches van card IDs
    const cardIds = purchaseCards.map(c => c.cardId);
    const batches = [];
    for (let i = 0; i < cardIds.length; i += BATCH_SIZE) {
      batches.push(cardIds.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`🔄 Fetching pricing in ${batches.length} batch(es)...`);
    
    // Process batches SEQUENTIEEL (voorkomt rate limiting)
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      // Bouw query: id:card1 OR id:card2 OR id:card3
      const query = batch.map(id => `id:${id}`).join(' OR ');
      const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout per batch
        
        const response = await fetch(url, {
          headers: { 'X-Api-Key': pokemonApiKey },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const cards = data.data || [];
          
          // Map pricing data per card ID
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
          
          console.log(`✅ Batch ${batchIndex + 1}/${batches.length}: ${cards.length} cards priced (${Date.now() - startTime}ms)`);
        } else {
          console.warn(`⚠️ Batch ${batchIndex + 1} failed: ${response.status} (${Date.now() - startTime}ms)`);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`⏱️ Batch ${batchIndex + 1} timeout (${Date.now() - startTime}ms)`);
        } else {
          console.error(`❌ Batch ${batchIndex + 1} error: ${error.message}`);
        }
      }
      
      // Kleine delay tussen batches om rate limiting te voorkomen
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // FASE 4: Combineer kaarten met pricing data
    const cardsWithPricing = purchaseCards.map(card => ({
      ...card,
      images: parseImages(card.images),
      tcgplayer: pricingMap.get(card.cardId) || null
    }));
    
    const pricedCount = cardsWithPricing.filter(c => c.tcgplayer).length;
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ DONE: ${pricedCount}/${cardsWithPricing.length} cards with pricing (${totalTime}ms total)`);
    
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

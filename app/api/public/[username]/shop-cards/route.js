import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// Pokemon TCG API ondersteunt batch queries - VEEL efficiënter

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
    
    // FASE 2: Kaarten ophalen uit database
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
    if (!pokemonApiKey || shopCards.length === 0) {
      const cards = shopCards.map(card => ({
        ...card,
        images: parseImages(card.images),
        tcgplayer: null
      }));
      
      return NextResponse.json({
        user: {
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl
        },
        cards
      });
    }
    
    // FASE 3: BATCH pricing ophalen
    const BATCH_SIZE = 12;
    const pricingMap = new Map();
    
    const cardIds = shopCards.map(c => c.cardId);
    const batches = [];
    for (let i = 0; i < cardIds.length; i += BATCH_SIZE) {
      batches.push(cardIds.slice(i, i + BATCH_SIZE));
    }
    
    // Process batches SEQUENTIEEL
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const query = batch.map(id => `id:${id}`).join(' OR ');
      const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
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
      
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // FASE 4: Combineer kaarten met pricing
    const cardsWithPricing = shopCards.map(card => ({
      ...card,
      images: parseImages(card.images),
      tcgplayer: pricingMap.get(card.cardId) || null
    }));
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Shop cards loaded (${totalTime}ms)`);
    
    return NextResponse.json({
      user: {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl
      },
      cards: cardsWithPricing
    });
    
  } catch (error) {
    console.error('❌ Shop cards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

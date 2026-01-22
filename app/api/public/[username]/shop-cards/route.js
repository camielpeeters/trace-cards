import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';
import { getUSDtoEURRate } from '../../../../lib/pricing-sources/tcgplayer';

// Force dynamic rendering (uses Prisma and dynamic params)
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    
    // Check if API key is configured
    const pokemonApiKey = process.env.POKEMON_TCG_API_KEY;
    if (!pokemonApiKey) {
      console.error('❌ POKEMON_TCG_API_KEY not configured in environment variables');
    } else {
      console.log('✅ POKEMON_TCG_API_KEY is configured');
    }
    
    // Get Prisma client instance
    const prisma = getPrisma();
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get user's active shop cards
    const shopCards = await prisma.shopCard.findMany({
      where: {
        userId: user.id,
        isActive: true,
        stock: { gt: 0 } // Only show cards with stock > 0
      },
      orderBy: [
        { setId: 'asc' },
        { cardNumber: 'asc' }
      ]
    });
    
    // Fetch pricing data directly from Pokémon TCG API (with timeout protection)
    const cardsWithPricing = await Promise.all(
      shopCards.map(async (card) => {
        let tcgplayer = null;
        
        if (!pokemonApiKey) {
          console.log(`⚠️ No API key configured`);
          return {
            ...card,
            images: JSON.parse(card.images),
            tcgplayer: null
          };
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
        
        try {
          
          const apiResponse = await fetch(
            `https://api.pokemontcg.io/v2/cards/${card.cardId}`,
            {
              headers: { 'X-Api-Key': pokemonApiKey },
              signal: controller.signal
            }
          );
          clearTimeout(timeoutId);
          
          if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            const apiCard = apiData.data;
            
            if (apiCard?.tcgplayer?.prices) {
              const exchangeRate = 0.92; // USD to EUR
              
              const convertToEUR = (usdPrice) => {
                return usdPrice ? usdPrice * exchangeRate : null;
              };
              
              const convertedPrices = {};
              Object.keys(apiCard.tcgplayer.prices).forEach(variantKey => {
                const variant = apiCard.tcgplayer.prices[variantKey];
                if (variant) {
                  convertedPrices[variantKey] = {
                    market: convertToEUR(variant.market),
                    mid: convertToEUR(variant.mid),
                    low: convertToEUR(variant.low),
                    high: convertToEUR(variant.high)
                  };
                }
              });
              
              tcgplayer = {
                url: apiCard.tcgplayer.url || null,
                prices: convertedPrices,
                lastUpdated: new Date().toISOString()
              };
            }
          }
        } catch (error) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            console.log(`⏱️ Timeout fetching ${card.cardName}`);
          } else {
            console.error(`Error fetching ${card.cardName}:`, error.message);
          }
        }
        
        return {
          ...card,
          images: JSON.parse(card.images),
          tcgplayer: tcgplayer
        };
      })
    );
    
    return NextResponse.json({
      user: {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl
      },
      cards: cardsWithPricing
    });
    
  } catch (error) {
    console.error('Error fetching public shop cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

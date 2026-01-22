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
    
    // Fetch pricing data for each card with smart fallback
    const cardsWithPricing = await Promise.all(
      shopCards.map(async (card) => {
        let tcgplayer = null;
        let cardRecord = null;
        
        try {
          // Try DB first
          cardRecord = await prisma.card.findFirst({
            where: {
              OR: [
                { pokemonTcgId: card.cardId },
                { 
                  name: card.cardName,
                  setName: card.setName
                }
              ]
            },
            include: {
              pricing: true
            }
          });
          
          // Build pricing from DB if available
          if (cardRecord?.pricing?.tcgplayerPriceUSD) {
            const pricing = cardRecord.pricing;
            const exchangeRate = pricing.usdToEurRate || 0.92;
            
            const convertToEUR = (usdPrice) => {
              return usdPrice ? usdPrice * exchangeRate : null;
            };
            
            const holofoilUSD = pricing.tcgplayerPriceUSD;
            
            tcgplayer = {
              url: pricing.tcgplayerUrl || null,
              prices: {
                holofoil: {
                  market: convertToEUR(holofoilUSD),
                  mid: convertToEUR(holofoilUSD),
                  low: convertToEUR(holofoilUSD * 0.9),
                  high: convertToEUR(holofoilUSD * 1.1)
                }
              },
              eurPrice: holofoilUSD * exchangeRate,
              lastUpdated: pricing.tcgplayerUpdated?.toISOString() || null
            };
          } else if (pokemonApiKey) {
            // Fallback to API only if DB has no data AND API key is configured
            console.log(`⚠️ No DB pricing for ${card.cardName}, trying API...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
            
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
                  const exchangeRate = 0.92; // Default rate
                  
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
                  
                  console.log(`✅ API pricing for ${card.cardName}`);
                }
              }
            } catch (apiError) {
              clearTimeout(timeoutId);
              if (apiError.name === 'AbortError') {
                console.log(`⏱️ API timeout for ${card.cardName}`);
              } else {
                console.log(`❌ API error for ${card.cardName}:`, apiError.message);
              }
            }
          } else {
            console.log(`⚠️ No pricing data for ${card.cardName} (DB empty, no API key)`);
          }
        } catch (error) {
          console.error(`Error fetching pricing for ${card.cardName}:`, error);
        }
        
        return {
          ...card,
          images: JSON.parse(card.images),
          tcgplayer: tcgplayer,
          // Include pricing info for display
          pricing: cardRecord?.pricing ? {
            tcgplayerPriceUSD: cardRecord.pricing.tcgplayerPriceUSD,
            tcgplayerUrl: cardRecord.pricing.tcgplayerUrl,
            customPriceEUR: cardRecord.pricing.customPriceEUR,
            useCustomPrice: cardRecord.pricing.useCustomPrice,
            cardmarketUrl: cardRecord.pricing.cardmarketUrl,
            usdToEurRate: cardRecord.pricing.usdToEurRate
          } : null
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

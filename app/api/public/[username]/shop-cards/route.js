import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';
import { getUSDtoEURRate } from '../../../../lib/pricing-sources/tcgplayer';

// Force dynamic rendering (uses Prisma and dynamic params)
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    
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
    
    // Fetch pricing data for each card
    const cardsWithPricing = await Promise.all(
      shopCards.map(async (card) => {
        // Find corresponding Card record by pokemonTcgId (which matches cardId)
        // or by name and setName as fallback
        const cardRecord = await prisma.card.findFirst({
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
        
        // Build TCGPlayer price data structure - try Card record first, then fallback to Pokémon TCG API
        let tcgplayer = null;
        let exchangeRate = 0.92; // Default fallback rate
        
        // Try to get pricing from Card record
        if (cardRecord?.pricing?.tcgplayerPriceUSD) {
          const pricing = cardRecord.pricing;
          exchangeRate = pricing.usdToEurRate || 0.92;
          
          const convertToEUR = (usdPrice) => {
            return usdPrice ? usdPrice * exchangeRate : null;
          };
          
          const holofoilUSD = pricing.tcgplayerPriceUSD;
          const reverseHolofoilUSD = holofoilUSD * 1.1;
          const normalUSD = holofoilUSD * 0.9;
          
          tcgplayer = {
            url: pricing.tcgplayerUrl || null,
            prices: {
              holofoil: {
                market: convertToEUR(holofoilUSD),
                mid: convertToEUR(holofoilUSD),
                low: convertToEUR(holofoilUSD * 0.9),
                high: convertToEUR(holofoilUSD * 1.1)
              },
              reverseHolofoil: {
                market: convertToEUR(reverseHolofoilUSD),
                mid: convertToEUR(reverseHolofoilUSD),
                low: convertToEUR(holofoilUSD),
                high: convertToEUR(holofoilUSD * 1.2)
              },
              normal: {
                market: convertToEUR(normalUSD),
                mid: convertToEUR(normalUSD),
                low: convertToEUR(holofoilUSD * 0.8),
                high: convertToEUR(holofoilUSD)
              }
            },
            eurPrice: holofoilUSD * exchangeRate,
            lastUpdated: pricing.tcgplayerUpdated?.toISOString() || null
          };
        } else {
          // Fallback: Try to fetch from Pokémon TCG API if cardId matches format
          // Only try if we have the Pokémon TCG API format (e.g., "me1-1")
          try {
            const pokemonApiKey = process.env.POKEMON_TCG_API_KEY;
            if (!pokemonApiKey) {
              console.log(`⚠️ POKEMON_TCG_API_KEY not set in environment variables for ${card.cardName}`);
            } else if (card.cardId) {
              const apiUrl = `https://api.pokemontcg.io/v2/cards/${card.cardId}`;
              console.log(`🔄 Attempting to fetch pricing from Pokémon TCG API for ${card.cardId}`);
              
              const apiResponse = await fetch(apiUrl, {
                headers: { 'X-Api-Key': pokemonApiKey }
              });
              
              if (!apiResponse.ok) {
                console.log(`⚠️ Pokémon TCG API returned ${apiResponse.status} for ${card.cardId}`);
              } else {
                const apiData = await apiResponse.json();
                const apiCard = apiData.data;
                
                // Use tcgplayer data directly from Pokémon TCG API
                if (apiCard?.tcgplayer?.prices) {
                  // Get exchange rate
                  exchangeRate = await getUSDtoEURRate().catch(() => 0.92);
                  
                  const convertToEUR = (usdPrice) => {
                    return usdPrice ? usdPrice * exchangeRate : null;
                  };
                  
                  // Convert all price variants from USD to EUR
                  const convertedPrices = {};
                  Object.keys(apiCard.tcgplayer.prices).forEach(variantKey => {
                    const variant = apiCard.tcgplayer.prices[variantKey];
                    if (variant) {
                      convertedPrices[variantKey] = {
                        market: variant.market ? convertToEUR(variant.market) : null,
                        mid: variant.mid ? convertToEUR(variant.mid) : null,
                        low: variant.low ? convertToEUR(variant.low) : null,
                        high: variant.high ? convertToEUR(variant.high) : null
                      };
                    }
                  });
                  
                  tcgplayer = {
                    url: apiCard.tcgplayer.url || null,
                    prices: convertedPrices,
                    lastUpdated: new Date().toISOString()
                  };
                  
                  console.log(`✅ Fetched pricing from Pokémon TCG API for ${card.cardName} - ${Object.keys(convertedPrices).length} variants`);
                } else {
                  console.log(`⚠️ Pokémon TCG API returned card but no tcgplayer.prices for ${card.cardId}`);
                }
              }
            }
          } catch (error) {
            // Log error for debugging
            console.log(`❌ Error fetching pricing from Pokémon TCG API for ${card.cardName}: ${error.message}`);
          }
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

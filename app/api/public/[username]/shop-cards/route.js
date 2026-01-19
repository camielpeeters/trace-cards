import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';

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
        
        // Debug: Log if card record not found
        if (!cardRecord) {
          console.log(`⚠️ No Card record found for ${card.cardName} (${card.setName}) - cardId: ${card.cardId}`);
        } else if (!cardRecord.pricing) {
          console.log(`⚠️ Card record found but no pricing data for ${card.cardName} (${card.setName})`);
        }
        
        // Build TCGPlayer price data structure if available
        let tcgplayer = null;
        if (cardRecord?.pricing) {
          const pricing = cardRecord.pricing;
          if (pricing.tcgplayerPriceUSD) {
            // Convert USD to EUR if rate is available
            const priceEUR = pricing.usdToEurRate 
              ? pricing.tcgplayerPriceUSD * pricing.usdToEurRate 
              : null;
            
            // Convert USD prices to EUR for display (use default rate if not available)
            const defaultRate = 0.92; // Approximate USD to EUR rate as fallback
            const exchangeRate = pricing.usdToEurRate || defaultRate;
            
            const convertToEUR = (usdPrice) => {
              return usdPrice ? usdPrice * exchangeRate : null;
            };
            
            const holofoilUSD = pricing.tcgplayerPriceUSD;
            const reverseHolofoilUSD = holofoilUSD * 1.1;
            const normalUSD = holofoilUSD * 0.9;
            
            // Ensure we always return price values (even if approximate)
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
              // EUR conversion (for backwards compatibility)
              eurPrice: holofoilUSD * exchangeRate,
              lastUpdated: pricing.tcgplayerUpdated?.toISOString() || null
            };
            console.log(`✅ Added pricing for ${card.cardName}: €${(holofoilUSD * exchangeRate).toFixed(2)}`);
          } else {
            console.log(`⚠️ No tcgplayerPriceUSD found for ${card.cardName} (${card.setName})`);
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

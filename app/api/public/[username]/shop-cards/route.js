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
        
        // Build TCGPlayer price data structure if available
        let tcgplayer = null;
        if (cardRecord?.pricing) {
          const pricing = cardRecord.pricing;
          if (pricing.tcgplayerPriceUSD) {
            // Convert USD to EUR if rate is available
            const priceEUR = pricing.usdToEurRate 
              ? pricing.tcgplayerPriceUSD * pricing.usdToEurRate 
              : null;
            
            tcgplayer = {
              url: pricing.tcgplayerUrl || null,
              prices: {
                holofoil: {
                  market: pricing.tcgplayerPriceUSD,
                  mid: pricing.tcgplayerPriceUSD,
                  low: pricing.tcgplayerPriceUSD * 0.9,
                  high: pricing.tcgplayerPriceUSD * 1.1
                },
                reverseHolofoil: {
                  market: pricing.tcgplayerPriceUSD * 1.1,
                  mid: pricing.tcgplayerPriceUSD * 1.1,
                  low: pricing.tcgplayerPriceUSD,
                  high: pricing.tcgplayerPriceUSD * 1.2
                },
                normal: {
                  market: pricing.tcgplayerPriceUSD * 0.9,
                  mid: pricing.tcgplayerPriceUSD * 0.9,
                  low: pricing.tcgplayerPriceUSD * 0.8,
                  high: pricing.tcgplayerPriceUSD
                }
              },
              // EUR conversion
              eurPrice: priceEUR,
              lastUpdated: pricing.tcgplayerUpdated?.toISOString() || null
            };
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

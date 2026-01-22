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
    
    // Fetch pricing data for each card - SKIP API calls to prevent hanging
    const cardsWithPricing = await Promise.all(
      shopCards.map(async (card) => {
        let tcgplayer = null;
        let cardRecord = null;
        
        try {
          // Only use DB pricing - NO external API calls
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
          
          // Build pricing from DB only
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

import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';
import { getUSDtoEURRate } from '../../../../lib/pricing-sources/tcgplayer';

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
    
    const prisma = getPrisma();
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get user's active purchase cards
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
    
    // Batch fetch pricing data - process all batches in parallel for speed
    const BATCH_SIZE = 20;
    
    // Create batches
    const batches = [];
    for (let i = 0; i < purchaseCards.length; i += BATCH_SIZE) {
      batches.push(purchaseCards.slice(i, i + BATCH_SIZE));
    }
    
    // Process all batches in parallel
    const allBatchResults = await Promise.all(
      batches.map(batch => 
        Promise.all(
          batch.map(async (card) => {
            let tcgplayer = null;
            
            if (!pokemonApiKey) {
              return {
                ...card,
                images: JSON.parse(card.images),
                tcgplayer: null
              };
            }
            
            // RETRY LOGIC: 3 attempts met exponential backoff
            const MAX_RETRIES = 3;
            let lastError = null;
            
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout (was 5s)
            
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
                    
                    console.log(`✅ Pricing loaded: ${card.cardName} (#${card.cardNumber}) - ${Object.keys(convertedPrices).length} variants [attempt ${attempt}]`);
                    break; // Success, exit retry loop
                  } else {
                    console.warn(`⚠️ No pricing data for ${card.cardName} (#${card.cardNumber}, ${card.cardId}) - API returned no prices [attempt ${attempt}]`);
                    break; // No point retrying if API has no data
                  }
                } else {
                  const errorMsg = `${apiResponse.status} ${apiResponse.statusText}`;
                  console.error(`❌ API error for ${card.cardName} (#${card.cardNumber}): ${errorMsg} [attempt ${attempt}/${MAX_RETRIES}]`);
                  lastError = new Error(errorMsg);
                  
                  // Only retry on 5xx errors or 429 (rate limit)
                  if (attempt < MAX_RETRIES && (apiResponse.status >= 500 || apiResponse.status === 429)) {
                    const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                  }
                  break; // Don't retry 4xx errors
                }
              } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                  console.warn(`⏱️ Timeout fetching pricing for ${card.cardName} (#${card.cardNumber}, ${card.cardId}) [attempt ${attempt}/${MAX_RETRIES}]`);
                } else {
                  console.error(`❌ Error fetching pricing for ${card.cardName} (#${card.cardNumber}, ${card.cardId}): ${error.message} [attempt ${attempt}/${MAX_RETRIES}]`);
                }
                lastError = error;
                
                // Retry on timeout or network errors
                if (attempt < MAX_RETRIES) {
                  const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
                  console.log(`⏳ Retrying in ${delay}ms...`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                  continue;
                }
                // Always return card data even if pricing fails
                tcgplayer = null;
              }
            }
            
            if (!tcgplayer && lastError) {
              console.error(`❌ FINAL: Failed to load pricing for ${card.cardName} (#${card.cardNumber}) after ${MAX_RETRIES} attempts`);
            }
          
            return {
              ...card,
              images: JSON.parse(card.images),
              tcgplayer: tcgplayer
            };
          })
        )
      )
    );
    
    // Flatten all batch results
    const cardsWithPricing = allBatchResults.flat();
    
    console.log(`✅ Loaded ${cardsWithPricing.length} purchase cards with pricing`);
    
    return NextResponse.json({
      user: {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl
      },
      cards: cardsWithPricing
    });
    
  } catch (error) {
    console.error('Error fetching public cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

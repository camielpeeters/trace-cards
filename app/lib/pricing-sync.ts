// Main pricing sync service

import { getPrisma } from './prisma';
import { searchTCGPlayerCard, getTCGPlayerPrice, getUSDtoEURRate } from './pricing-sources/tcgplayer';
import { generateCardmarketUrl } from './cardmarket-links';

/**
 * Sync pricing data for a specific card
 */
export async function syncCardPricing(cardId: string) {
  const prisma = getPrisma();
  
  try {
    // Get card details
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { pricing: true }
    });
    
    if (!card) {
      throw new Error(`Card ${cardId} not found`);
    }
    
    console.log(`Syncing pricing for: ${card.name} (${card.setName})`);
    
    // 1. Search TCGPlayer
    const tcgResult = await searchTCGPlayerCard(card.name, card.setName);
    
    let tcgPrice = null;
    let tcgUrl = null;
    
    if (tcgResult) {
      // 2. Get price data
      const priceData = await getTCGPlayerPrice(tcgResult.productId);
      tcgPrice = priceData?.marketPrice || priceData?.midPrice || null;
      tcgUrl = tcgResult.url;
      
      console.log(`TCGPlayer price: $${tcgPrice}`);
    } else {
      console.log('No TCGPlayer result found');
    }
    
    // 3. Get exchange rate
    const usdToEur = await getUSDtoEURRate();
    
    // 4. Generate Cardmarket link
    const cardmarketUrl = generateCardmarketUrl(card.name, card.setName);
    
    // 5. Upsert pricing data
    const pricing = await prisma.cardPricing.upsert({
      where: { cardId: card.id },
      create: {
        cardId: card.id,
        tcgplayerPriceUSD: tcgPrice,
        tcgplayerUrl: tcgUrl || null,
        tcgplayerUpdated: new Date(),
        cardmarketUrl: cardmarketUrl,
        usdToEurRate: usdToEur,
        lastRateUpdate: new Date(),
        // Keep existing custom price if set
        useCustomPrice: card.pricing?.useCustomPrice || false,
        customPriceEUR: card.pricing?.customPriceEUR || null,
      },
      update: {
        tcgplayerPriceUSD: tcgPrice,
        tcgplayerUrl: tcgUrl || null,
        tcgplayerUpdated: new Date(),
        cardmarketUrl: cardmarketUrl,
        usdToEurRate: usdToEur,
        lastRateUpdate: new Date(),
        // Don't override custom price if admin has set one
        useCustomPrice: card.pricing?.useCustomPrice ?? undefined,
        customPriceEUR: card.pricing?.customPriceEUR ?? undefined,
      }
    });
    
    console.log(`✓ Pricing synced for ${card.name}`);
    return pricing;
    
  } catch (error: any) {
    console.error(`Error syncing pricing for card ${cardId}:`, error);
    throw error;
  }
}

/**
 * Get display price for a card
 */
export async function getCardDisplayPrice(cardId: string) {
  const prisma = getPrisma();
  
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { pricing: true }
  });
  
  if (!card || !card.pricing) {
    return null;
  }
  
  const pricing = card.pricing;
  
  // If custom price is set and enabled, use it
  if (pricing.useCustomPrice && pricing.customPriceEUR) {
    return {
      price: pricing.customPriceEUR,
      currency: 'EUR',
      source: 'custom' as const,
      tcgPriceUSD: pricing.tcgplayerPriceUSD,
      cardmarketUrl: pricing.cardmarketUrl,
    };
  }
  
  // Otherwise, convert TCGPlayer price to EUR
  if (pricing.tcgplayerPriceUSD && pricing.usdToEurRate) {
    const priceEUR = pricing.tcgplayerPriceUSD * pricing.usdToEurRate;
    
    return {
      price: priceEUR,
      currency: 'EUR',
      source: 'tcgplayer' as const,
      tcgPriceUSD: pricing.tcgplayerPriceUSD,
      cardmarketUrl: pricing.cardmarketUrl,
    };
  }
  
  // No price available
  return {
    price: null,
    currency: 'EUR',
    source: 'none' as const,
    cardmarketUrl: pricing.cardmarketUrl,
  };
}

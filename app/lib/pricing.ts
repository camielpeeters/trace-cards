// Pricing utilities and aggregation logic

export type PriceSource = 'CARDMARKET' | 'TCGPLAYER';

export interface CardPrice {
  source: PriceSource;
  averagePrice: number;
  lowPrice?: number;
  highPrice?: number;
  trendPrice?: number;
  currency: string;
  lastUpdated: Date;
}

export interface PriceDisplay {
  displayPrice: number;
  priceSource: 'market' | 'custom' | 'average';
  marketPrices: CardPrice[];
  customPrice?: number;
  showMarketPrice?: boolean;
}

/**
 * Calculate weighted average price from multiple sources
 * CardMarket gets more weight for EU market
 */
export function calculateAveragePrice(prices: CardPrice[]): number {
  if (prices.length === 0) return 0;
  
  // Weights: CardMarket 70%, TCGPlayer 30% (for EU market)
  const weights: Record<PriceSource, number> = {
    CARDMARKET: 0.7,
    TCGPLAYER: 0.3,
  };
  
  let totalWeighted = 0;
  let totalWeight = 0;
  
  for (const price of prices) {
    const weight = weights[price.source] || 0.5;
    const priceValue = price.trendPrice || price.averagePrice;
    
    totalWeighted += priceValue * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? totalWeighted / totalWeight : 0;
}

/**
 * Get price display logic for a card
 */
export function getPriceDisplay(
  marketPrices: CardPrice[],
  customPrice?: number | null,
  useCustomPrice?: boolean,
  showMarketPrice?: boolean
): PriceDisplay {
  const averageMarketPrice = calculateAveragePrice(marketPrices);
  
  // If custom price is set and enabled, use it
  if (customPrice && useCustomPrice) {
    return {
      displayPrice: customPrice,
      priceSource: 'custom',
      marketPrices,
      customPrice,
      showMarketPrice: showMarketPrice ?? true,
    };
  }
  
  // Otherwise use market price
  return {
    displayPrice: averageMarketPrice,
    priceSource: averageMarketPrice > 0 ? 'average' : 'market',
    marketPrices,
    customPrice,
    showMarketPrice: false,
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency,
  }).format(price);
}

/**
 * TCGPlayer price variant structure from Pokémon TCG API
 */
interface TCGPlayerPriceVariant {
  market?: number | null;
  mid?: number | null;
  low?: number | null;
  high?: number | null;
}

/**
 * TCGPlayer prices structure from Pokémon TCG API
 */
interface TCGPlayerPrices {
  normal?: TCGPlayerPriceVariant;
  holofoil?: TCGPlayerPriceVariant;
  reverseHolofoil?: TCGPlayerPriceVariant;
  '1stEditionNormal'?: TCGPlayerPriceVariant;
  '1stEditionHolofoil'?: TCGPlayerPriceVariant;
  [key: string]: TCGPlayerPriceVariant | undefined;
}

/**
 * Card structure with TCGPlayer prices from Pokémon TCG API
 */
export interface CardWithTCGPlayerPrices {
  tcgplayer?: {
    prices?: TCGPlayerPrices;
    url?: string;
    updatedAt?: string;
  };
}

/**
 * Get price for a single variant using fallback logic:
 * 1. Use market price if available
 * 2. Else fallback to mid
 * 3. Else fallback to low
 * Returns null if no valid price can be determined
 * Note: high is excluded as it represents extreme listing prices, not realistic market value
 */
function getVariantPrice(variant: TCGPlayerPriceVariant | null | undefined): number | null {
  if (!variant) return null;
  
  // Priority 1: Use market price if available
  if (variant.market != null && variant.market > 0) {
    return variant.market;
  }
  
  // Priority 2: Fallback to mid
  if (variant.mid != null && variant.mid > 0) {
    return variant.mid;
  }
  
  // Priority 3: Fallback to low
  if (variant.low != null && variant.low > 0) {
    return variant.low;
  }
  
  return null;
}

/**
 * Card price variant types
 */
export type PriceVariant = 'nonHolo' | 'reverseHolo' | 'holofoil';

/**
 * Get default variant for a card (prefer nonHolo > reverseHolo > holofoil)
 * Matches real-world card distribution where non-holo is most common
 */
export function getDefaultVariant(card: CardWithTCGPlayerPrices): PriceVariant | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;
  
  // Priority: nonHolo > reverseHolo > holofoil
  if (prices.normal) return 'nonHolo';
  if (prices.reverseHolofoil) return 'reverseHolo';
  if (prices.holofoil) return 'holofoil';
  
  return null;
}

/**
 * Get variant key for TCGPlayer prices object
 */
export function getVariantKey(variant: PriceVariant): keyof TCGPlayerPrices {
  switch (variant) {
    case 'holofoil': return 'holofoil';
    case 'reverseHolo': return 'reverseHolofoil';
    case 'nonHolo': return 'normal';
  }
}

/**
 * Get price variant data for a card
 */
export function getVariantData(card: CardWithTCGPlayerPrices, variant: PriceVariant): TCGPlayerPriceVariant | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;
  
  const variantKey = getVariantKey(variant);
  return prices[variantKey] || null;
}

/**
 * Check if a card has at least one price variant
 */
export function hasAnyPrice(card: CardWithTCGPlayerPrices): boolean {
  const prices = card.tcgplayer?.prices;
  if (!prices) return false;
  
  return !!(prices.normal || prices.holofoil || prices.reverseHolofoil);
}

/**
 * Get available variants for a card
 */
export function getAvailableVariants(card: CardWithTCGPlayerPrices): PriceVariant[] {
  const prices = card.tcgplayer?.prices;
  if (!prices) return [];
  
  const variants: PriceVariant[] = [];
  if (prices.holofoil) variants.push('holofoil');
  if (prices.reverseHolofoil) variants.push('reverseHolo');
  if (prices.normal) variants.push('nonHolo');
  
  return variants;
}

/**
 * Get mid price for a variant (used for sorting)
 */
export function getMidPrice(card: CardWithTCGPlayerPrices, variant: PriceVariant): number | null {
  const variantData = getVariantData(card, variant);
  if (!variantData) return null;
  
  if (variantData.mid != null && variantData.mid > 0) {
    return variantData.mid;
  }
  
  // Fallback to market or average
  return getVariantPrice(variantData);
}

/**
 * Calculate average market price from Pokémon TCG API TCGPlayer prices
 * 
 * Supports multiple variants (normal, holofoil, reverseHolofoil, etc.)
 * For each variant:
 * - Use market price if available
 * - Else fallback to mid
 * - Else fallback to average of low and high
 * 
 * Calculates the average across all variants, ignoring null or missing values.
 * Returns a single indicative price rounded to 2 decimals.
 * 
 * This value is NOT a selling price, only an indicative market value.
 * 
 * @param card - Card object from Pokémon TCG API with tcgplayer.prices
 * @returns Average market price rounded to 2 decimals, or null if no prices available
 */
export function averageMarketPrice(card: CardWithTCGPlayerPrices): number | null {
  const prices = card.tcgplayer?.prices;
  
  if (!prices) {
    return null;
  }
  
  // Supported variants (in order of preference/commonality)
  const variantKeys: string[] = [
    'normal',
    'holofoil',
    'reverseHolofoil',
    '1stEditionNormal',
    '1stEditionHolofoil'
  ];
  
  // Collect all variant prices
  const variantPrices: number[] = [];
  
  // First, try known variants
  for (const key of variantKeys) {
    const variant = prices[key];
    const price = getVariantPrice(variant);
    if (price != null) {
      variantPrices.push(price);
    }
  }
  
  // Also check for any other variant keys that might exist
  for (const key in prices) {
    if (!variantKeys.includes(key)) {
      const variant = prices[key];
      const price = getVariantPrice(variant);
      if (price != null) {
        variantPrices.push(price);
      }
    }
  }
  
  // If no valid prices found, return null
  if (variantPrices.length === 0) {
    return null;
  }
  
  // Calculate average across all variants
  const sum = variantPrices.reduce((acc, price) => acc + price, 0);
  const average = sum / variantPrices.length;
  
  // Round to 2 decimals
  return Math.round(average * 100) / 100;
}

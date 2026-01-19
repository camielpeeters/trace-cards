// Background price hydration utility
// Fetches card prices from Pokémon TCG API in the background without blocking UI

const PRICE_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if a card needs price hydration
 * Returns true if:
 * - Card has no tcgplayer.prices
 * - OR lastUpdated is older than 24 hours
 */
export function needsPriceHydration(card) {
  if (!card) return false;
  
  // Check if card has tcgplayer prices
  const hasPrices = card.tcgplayer?.prices && 
    Object.keys(card.tcgplayer.prices).length > 0;
  
  if (!hasPrices) {
    return true; // No prices, needs hydration
  }
  
  // Check if lastUpdated is older than 24 hours
  if (card.lastUpdated) {
    const lastUpdated = new Date(card.lastUpdated).getTime();
    const now = Date.now();
    const age = now - lastUpdated;
    
    if (age > PRICE_CACHE_EXPIRY) {
      return true; // Too old, needs refresh
    }
  } else {
    return true; // No lastUpdated timestamp, needs hydration
  }
  
  return false; // Card has fresh prices
}

/**
 * Fetch a single card from Pokémon TCG API by ID
 */
async function fetchCardFromAPI(cardId, apiKey) {
  if (!apiKey) {
    console.warn('⚠️ No API key available for price hydration');
    return null;
  }
  
  try {
    const url = `https://api.pokemontcg.io/v2/cards/${cardId}`;
    const response = await fetch(url, {
      headers: { 'X-Api-Key': apiKey }
    });
    
    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch card ${cardId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data.data; // Pokémon TCG API returns { data: card }
  } catch (error) {
    console.error(`❌ Error fetching card ${cardId}:`, error);
    return null;
  }
}

/**
 * Merge API response into existing cached card
 * Preserves all existing card data and adds/updates tcgplayer prices
 */
function mergeCardData(cachedCard, apiCard) {
  if (!apiCard) return cachedCard;
  
  // Merge the full API card data, preserving existing fields
  const merged = {
    ...cachedCard,
    ...apiCard,
    // Preserve our metadata
    lastUpdated: new Date().toISOString(),
    // Ensure we keep the card structure we need
    setId: cachedCard.setId || apiCard.set?.id,
    setName: cachedCard.setName || apiCard.set?.name,
    cardId: cachedCard.cardId || apiCard.id,
    cardName: cachedCard.cardName || apiCard.name,
    cardNumber: cachedCard.cardNumber || apiCard.number,
    images: cachedCard.images || apiCard.images,
    // Preserve tcgplayer data from API (this is what we want)
    tcgplayer: apiCard.tcgplayer || cachedCard.tcgplayer
  };
  
  return merged;
}

/**
 * Hydrate prices for a single card
 */
async function hydrateCardPrice(card, apiKey) {
  if (!needsPriceHydration(card)) {
    return card; // Already has fresh prices
  }
  
  const cardId = card.cardId || card.id;
  if (!cardId) {
    console.warn('⚠️ Card missing ID, cannot hydrate:', card);
    return card;
  }
  
  console.log(`🔄 Hydrating prices for card: ${cardId}`);
  
  const apiCard = await fetchCardFromAPI(cardId, apiKey);
  if (!apiCard) {
    // If fetch failed, just update timestamp to avoid retrying immediately
    return {
      ...card,
      lastUpdated: new Date().toISOString()
    };
  }
  
  return mergeCardData(card, apiCard);
}

/**
 * Background price hydration for multiple cards
 * Processes cards in batches to avoid overwhelming the API
 */
export async function hydrateCardPrices(cards, apiKey, options = {}) {
  const {
    batchSize = 5, // Process 5 cards at a time
    delayBetweenBatches = 1000, // 1 second delay between batches
    onProgress = null // Callback for progress updates
  } = options;
  
  if (!cards || cards.length === 0) {
    return cards;
  }
  
  // Filter cards that need hydration
  const cardsToHydrate = cards.filter(card => needsPriceHydration(card));
  
  if (cardsToHydrate.length === 0) {
    console.log('✅ All cards have fresh prices');
    return cards;
  }
  
  console.log(`🔄 Hydrating prices for ${cardsToHydrate.length} of ${cards.length} cards`);
  
  const hydratedCards = [...cards];
  const totalBatches = Math.ceil(cardsToHydrate.length / batchSize);
  
  for (let i = 0; i < cardsToHydrate.length; i += batchSize) {
    const batch = cardsToHydrate.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} cards)`);
    
    // Process batch in parallel
    const hydratedBatch = await Promise.all(
      batch.map(card => hydrateCardPrice(card, apiKey))
    );
    
    // Update hydrated cards array
    hydratedBatch.forEach((hydratedCard, index) => {
      const originalIndex = hydratedCards.findIndex(
        c => (c.cardId || c.id) === (batch[index].cardId || batch[index].id)
      );
      if (originalIndex !== -1) {
        hydratedCards[originalIndex] = hydratedCard;
      }
    });
    
    // Report progress
    if (onProgress) {
      onProgress({
        processed: Math.min(i + batchSize, cardsToHydrate.length),
        total: cardsToHydrate.length,
        batch: batchNumber,
        totalBatches
      });
    }
    
    // Delay between batches (except for the last batch)
    if (i + batchSize < cardsToHydrate.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  console.log(`✅ Price hydration complete for ${cardsToHydrate.length} cards`);
  return hydratedCards;
}

/**
 * Get API key from localStorage
 */
export function getAPIKey() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pokemonApiKey');
}

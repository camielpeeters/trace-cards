// LocalStorage helper functions voor Pokemon Card App

export const STORAGE_KEYS = {
  ADMIN_CREDENTIALS: 'adminCredentials',
  ACTIVE_SETS: 'activeSets',
  SET_CONFIG: 'setConfig',
  OFFERS: 'offers',
  SELECTED_CARDS: 'selectedCards',
  API_KEY: 'pokemonApiKey',
  ADMIN_SESSION: 'adminSession',
  PUBLIC_CARDS: 'publicCards',
  PUBLIC_SETS: 'publicSets',
  SETS_CACHE: 'setsCache',
  CACHE_TIMESTAMP: 'setsCacheTimestamp',
  
  // INKOOP (bezoekers verkopen aan jou)
  PURCHASE_CARDS: 'purchaseCards',
  PURCHASE_SETS: 'purchaseSets',
  PURCHASE_OFFERS: 'purchaseOffers',
  
  // VERKOOP (jij verkoopt aan bezoekers)
  SHOP_CARDS: 'shopCards',
  SHOP_SETS: 'shopSets',
  SHOP_ORDERS: 'shopOrders'
};

// Admin credentials helpers
export const initAdminCredentials = () => {
  if (!localStorage.getItem(STORAGE_KEYS.ADMIN_CREDENTIALS)) {
    const defaultCredentials = {
      username: 'admin',
      password: 'admin123' // In productie zou dit gehashed moeten worden
    };
    localStorage.setItem(STORAGE_KEYS.ADMIN_CREDENTIALS, JSON.stringify(defaultCredentials));
  }
};

export const getAdminCredentials = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_CREDENTIALS);
  return stored ? JSON.parse(stored) : null;
};

// Active sets helpers
export const getActiveSets = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SETS);
  return stored ? JSON.parse(stored) : [];
};

export const setActiveSets = (setIds) => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SETS, JSON.stringify(setIds));
};

export const toggleSetActive = (setId) => {
  const activeSets = getActiveSets();
  const index = activeSets.indexOf(setId);
  
  if (index > -1) {
    activeSets.splice(index, 1);
  } else {
    activeSets.push(setId);
  }
  
  setActiveSets(activeSets);
  return activeSets;
};

export const isSetActive = (setId) => {
  const activeSets = getActiveSets();
  return activeSets.includes(setId);
};

// Set configuration helpers (voor toekomstige uitbreidingen)
export const getSetConfig = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.SET_CONFIG);
  return stored ? JSON.parse(stored) : {};
};

export const updateSetConfig = (setId, config) => {
  const setConfig = getSetConfig();
  setConfig[setId] = { ...setConfig[setId], ...config };
  localStorage.setItem(STORAGE_KEYS.SET_CONFIG, JSON.stringify(setConfig));
  return setConfig;
};

// Offers helpers
export const getOffers = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.OFFERS);
  return stored ? JSON.parse(stored) : [];
};

export const addOffer = (offer) => {
  const offers = getOffers();
  const newOffer = {
    id: `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    status: 'pending',
    ...offer
  };
  offers.push(newOffer);
  localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
  return newOffer;
};

export const updateOfferStatus = (offerId, status) => {
  const offers = getOffers();
  const index = offers.findIndex(o => o.id === offerId);
  if (index > -1) {
    offers[index].status = status;
    localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
  }
  return offers;
};

// Admin session helpers
export const setAdminSession = (isActive) => {
  if (isActive) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  }
};

export const getAdminSession = () => {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
};

// Public cards helpers
export const getPublicCards = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.PUBLIC_CARDS);
  return stored ? JSON.parse(stored) : {};
};

export const getPublicSets = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.PUBLIC_SETS);
  return stored ? JSON.parse(stored) : {};
};

export const addCardToPublic = (card, setInfo) => {
  const publicCards = getPublicCards();
  const publicSets = getPublicSets();
  
  const cardKey = `${card.set.id}-${card.id}`;
  
  // Preserve FULL Pokémon TCG API card object including tcgplayer.prices
  // Merge with existing card if it exists to preserve metadata
  const existingCard = publicCards[cardKey] || {};
  
  // Voeg kaart toe
  publicCards[cardKey] = {
    // Preserve full API card object
    ...card,
    // Ensure we have the fields we need for display
    setId: card.set?.id || card.setId || existingCard.setId,
    setName: card.set?.name || card.setName || existingCard.setName,
    cardId: card.id || card.cardId || existingCard.cardId,
    cardName: card.name || card.cardName || existingCard.cardName,
    cardNumber: card.number || card.cardNumber || existingCard.cardNumber,
    images: card.images || existingCard.images,
    // Preserve tcgplayer prices if they exist
    tcgplayer: card.tcgplayer || existingCard.tcgplayer,
    // Metadata
    addedDate: existingCard.addedDate || new Date().toISOString(),
    lastUpdated: existingCard.lastUpdated || (card.tcgplayer?.prices ? new Date().toISOString() : null)
  };
  
  // Update set info
  if (!publicSets[card.set.id]) {
    publicSets[card.set.id] = {
      id: card.set.id,
      name: card.set.name,
      images: card.set.images || setInfo?.images,
      cardCount: 0
    };
  }
  publicSets[card.set.id].cardCount = 
    Object.values(publicCards).filter(c => c.setId === card.set.id).length;
  
  // Opslaan
  localStorage.setItem(STORAGE_KEYS.PUBLIC_CARDS, JSON.stringify(publicCards));
  localStorage.setItem(STORAGE_KEYS.PUBLIC_SETS, JSON.stringify(publicSets));
  
  return { publicCards, publicSets };
};

export const removeCardFromPublic = (cardId, setId) => {
  const publicCards = getPublicCards();
  const publicSets = getPublicSets();
  
  const cardKey = `${setId}-${cardId}`;
  delete publicCards[cardKey];
  
  // Update set count
  if (publicSets[setId]) {
    publicSets[setId].cardCount = 
      Object.values(publicCards).filter(c => c.setId === setId).length;
    
    // Verwijder set als geen kaarten meer
    if (publicSets[setId].cardCount === 0) {
      delete publicSets[setId];
    }
  }
  
  localStorage.setItem(STORAGE_KEYS.PUBLIC_CARDS, JSON.stringify(publicCards));
  localStorage.setItem(STORAGE_KEYS.PUBLIC_SETS, JSON.stringify(publicSets));
  
  return { publicCards, publicSets };
};

export const isCardPublic = (cardId, setId) => {
  const publicCards = getPublicCards();
  return !!publicCards[`${setId}-${cardId}`];
};

export const getPublicCardsBySet = (setId) => {
  const publicCards = getPublicCards();
  return Object.values(publicCards).filter(card => card.setId === setId);
};

// Kaart met prijs opslaan
export const addCardToPublicWithPrice = (card, setInfo, price = 5.00) => {
  const publicCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLIC_CARDS) || '{}');
  const publicSets = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLIC_SETS) || '{}');
  
  const cardKey = `${card.set.id}-${card.id}`;
  
  publicCards[cardKey] = {
    setId: card.set.id,
    setName: card.set.name,
    cardId: card.id,
    cardName: card.name,
    cardNumber: card.number,
    images: card.images,
    price: parseFloat(price), // NIEUW: Prijs toevoegen
    addedDate: new Date().toISOString()
  };
  
  // Update set info
  if (!publicSets[card.set.id]) {
    publicSets[card.set.id] = {
      id: card.set.id,
      name: card.set.name,
      images: card.set.images || setInfo?.images,
      cardCount: 0
    };
  }
  
  publicSets[card.set.id].cardCount = 
    Object.values(publicCards).filter(c => c.setId === card.set.id).length;
  
  localStorage.setItem(STORAGE_KEYS.PUBLIC_CARDS, JSON.stringify(publicCards));
  localStorage.setItem(STORAGE_KEYS.PUBLIC_SETS, JSON.stringify(publicSets));
  
  return { publicCards, publicSets };
};

// Update prijs van bestaande kaart
export const updateCardPrice = (setId, cardId, price) => {
  const publicCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLIC_CARDS) || '{}');
  const cardKey = `${setId}-${cardId}`;
  
  if (publicCards[cardKey]) {
    publicCards[cardKey].price = parseFloat(price);
    localStorage.setItem(STORAGE_KEYS.PUBLIC_CARDS, JSON.stringify(publicCards));
  }
};

// Haal prijs op
export const getCardPrice = (setId, cardId) => {
  const publicCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLIC_CARDS) || '{}');
  const cardKey = `${setId}-${cardId}`;
  return publicCards[cardKey]?.price || 5.00;
};

// Sets caching helpers
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 1 dag

export const isCacheValid = () => {
  if (typeof window === 'undefined') return false;
  
  const timestamp = localStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMP);
  if (!timestamp) return false;
  
  const now = Date.now();
  const cacheAge = now - parseInt(timestamp);
  return cacheAge < CACHE_EXPIRY;
};

export const getCachedSets = () => {
  if (typeof window === 'undefined') return null;
  if (!isCacheValid()) return null;
  
  const cached = localStorage.getItem(STORAGE_KEYS.SETS_CACHE);
  return cached ? JSON.parse(cached) : null;
};

export const cacheSets = (sets) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEYS.SETS_CACHE, JSON.stringify(sets));
  localStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
};

export const clearSetsCache = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.SETS_CACHE);
  localStorage.removeItem(STORAGE_KEYS.CACHE_TIMESTAMP);
};

// ========================================
// CARDS CACHING (per set)
// ========================================

// Cache keys voor kaarten
const CARDS_CACHE_PREFIX = 'cardsCache_';
const CARDS_CACHE_TIMESTAMP_PREFIX = 'cardsCacheTime_';

// Cache expiry: 7 dagen (kaarten veranderen zelden)
const CARDS_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

// Check of kaarten cache voor een set nog geldig is
export const isCardsCacheValid = (setId) => {
  if (typeof window === 'undefined') return false;
  
  const timestamp = localStorage.getItem(`${CARDS_CACHE_TIMESTAMP_PREFIX}${setId}`);
  if (!timestamp) return false;
  
  const now = Date.now();
  const cacheAge = now - parseInt(timestamp);
  return cacheAge < CARDS_CACHE_EXPIRY;
};

// Haal kaarten uit cache voor specifieke set
export const getCachedCards = (setId) => {
  if (typeof window === 'undefined') return null;
  
  if (!isCardsCacheValid(setId)) {
    console.log(`❌ Cache expired or missing for set: ${setId}`);
    return null;
  }
  
  const cached = localStorage.getItem(`${CARDS_CACHE_PREFIX}${setId}`);
  if (!cached) {
    console.log(`❌ No cache found for set: ${setId}`);
    return null;
  }
  
  console.log(`✅ Cache hit for set: ${setId}`);
  return JSON.parse(cached);
};

// Bewaar kaarten in cache voor specifieke set
export const cacheCards = (setId, cards) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(
      `${CARDS_CACHE_PREFIX}${setId}`, 
      JSON.stringify(cards)
    );
    localStorage.setItem(
      `${CARDS_CACHE_TIMESTAMP_PREFIX}${setId}`, 
      Date.now().toString()
    );
    console.log(`💾 Cached ${cards.length} cards for set: ${setId}`);
  } catch (error) {
    console.error('❌ Failed to cache cards:', error);
    // Waarschijnlijk localStorage vol - clear oude caches
    clearOldCardsCache();
  }
};

// Clear cache voor specifieke set
export const clearCardsCache = (setId) => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(`${CARDS_CACHE_PREFIX}${setId}`);
  localStorage.removeItem(`${CARDS_CACHE_TIMESTAMP_PREFIX}${setId}`);
  console.log(`🗑️ Cleared cache for set: ${setId}`);
};

// Clear ALLE kaarten caches
export const clearAllCardsCache = () => {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(localStorage);
  let clearedCount = 0;
  
  keys.forEach(key => {
    if (key.startsWith(CARDS_CACHE_PREFIX) || key.startsWith(CARDS_CACHE_TIMESTAMP_PREFIX)) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });
  
  console.log(`🗑️ Cleared ${clearedCount} card cache entries`);
};

// Clear oude cache entries (ouder dan expiry)
export const clearOldCardsCache = () => {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(localStorage);
  const now = Date.now();
  let clearedCount = 0;
  
  keys.forEach(key => {
    if (key.startsWith(CARDS_CACHE_TIMESTAMP_PREFIX)) {
      const timestamp = localStorage.getItem(key);
      const age = now - parseInt(timestamp);
      
      if (age > CARDS_CACHE_EXPIRY) {
        const setId = key.replace(CARDS_CACHE_TIMESTAMP_PREFIX, '');
        clearCardsCache(setId);
        clearedCount++;
      }
    }
  });
  
  if (clearedCount > 0) {
    console.log(`🗑️ Cleared ${clearedCount} old card caches`);
  }
};

// Haal cache stats op
export const getCardsCacheStats = () => {
  if (typeof window === 'undefined') return { cachedSets: 0, totalSizeKB: '0.00' };
  
  const keys = Object.keys(localStorage);
  let cachedSetsCount = 0;
  let totalSize = 0;
  
  keys.forEach(key => {
    if (key.startsWith(CARDS_CACHE_PREFIX)) {
      cachedSetsCount++;
      const value = localStorage.getItem(key);
      totalSize += value ? value.length : 0;
    }
  });
  
  return {
    cachedSets: cachedSetsCount,
    totalSizeKB: (totalSize / 1024).toFixed(2)
  };
};

// ========================================
// INKOOP FUNCTIES (bezoekers → jou)
// ========================================

export const getPurchaseCards = () => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEYS.PURCHASE_CARDS);
  return stored ? JSON.parse(stored) : {};
};

export const getPurchaseSets = () => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEYS.PURCHASE_SETS);
  return stored ? JSON.parse(stored) : {};
};

export const addCardToPurchase = (card, setInfo) => {
  if (typeof window === 'undefined') return { cards: {}, sets: {} };
  const cards = getPurchaseCards();
  const sets = getPurchaseSets();
  
  const cardKey = `${card.set.id}-${card.id}`;
  
  // Preserve FULL Pokémon TCG API card object including tcgplayer.prices
  // Merge with existing card if it exists to preserve metadata
  const existingCard = cards[cardKey] || {};
  
  cards[cardKey] = {
    // Preserve full API card object
    ...card,
    // Ensure we have the fields we need for display
    setId: card.set?.id || card.setId || existingCard.setId,
    setName: card.set?.name || card.setName || existingCard.setName,
    cardId: card.id || card.cardId || existingCard.cardId,
    cardName: card.name || card.cardName || existingCard.cardName,
    cardNumber: card.number || card.cardNumber || existingCard.cardNumber,
    images: card.images || existingCard.images,
    // Preserve tcgplayer prices if they exist
    tcgplayer: card.tcgplayer || existingCard.tcgplayer,
    // Metadata
    addedDate: existingCard.addedDate || new Date().toISOString(),
    lastUpdated: existingCard.lastUpdated || (card.tcgplayer?.prices ? new Date().toISOString() : null)
  };
  
  if (!sets[card.set.id]) {
    sets[card.set.id] = {
      id: card.set.id,
      name: card.set.name,
      images: card.set.images || setInfo?.images,
      releaseDate: card.set.releaseDate || setInfo?.releaseDate || null,
      cardCount: 0
    };
  }
  
  sets[card.set.id].cardCount = 
    Object.values(cards).filter(c => c.setId === card.set.id).length;
  
  localStorage.setItem(STORAGE_KEYS.PURCHASE_CARDS, JSON.stringify(cards));
  localStorage.setItem(STORAGE_KEYS.PURCHASE_SETS, JSON.stringify(sets));
  
  return { cards, sets };
};

export const removeCardFromPurchase = (setId, cardId) => {
  if (typeof window === 'undefined') return { cards: {}, sets: {} };
  const cards = getPurchaseCards();
  const sets = getPurchaseSets();
  
  const cardKey = `${setId}-${cardId}`;
  delete cards[cardKey];
  
  // Herbereken cardCount voor deze set op basis van alle kaarten
  // Check alle kaarten waarvan de cardKey begint met setId-
  const actualCount = Object.keys(cards).filter(key => {
    return key.startsWith(`${setId}-`);
  }).length;
  
  if (sets[setId]) {
    sets[setId].cardCount = actualCount;
    
    if (sets[setId].cardCount === 0) {
      delete sets[setId];
    }
  }
  
  localStorage.setItem(STORAGE_KEYS.PURCHASE_CARDS, JSON.stringify(cards));
  localStorage.setItem(STORAGE_KEYS.PURCHASE_SETS, JSON.stringify(sets));
  
  return { cards, sets };
};

export const isCardInPurchase = (cardId, setId) => {
  if (typeof window === 'undefined') return false;
  const cards = getPurchaseCards();
  return !!cards[`${setId}-${cardId}`];
};

export const addPurchaseOffer = (offer) => {
  if (typeof window === 'undefined') return null;
  const offers = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASE_OFFERS) || '[]');
  const newOffer = {
    id: `purchase-offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    status: 'pending',
    ...offer
  };
  offers.push(newOffer);
  localStorage.setItem(STORAGE_KEYS.PURCHASE_OFFERS, JSON.stringify(offers));
  return newOffer;
};

export const getPurchaseOffers = () => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASE_OFFERS) || '[]');
};

export const updatePurchaseOfferStatus = (offerId, status) => {
  if (typeof window === 'undefined') return [];
  const offers = getPurchaseOffers();
  const index = offers.findIndex(o => o.id === offerId);
  if (index > -1) {
    offers[index].status = status;
    localStorage.setItem(STORAGE_KEYS.PURCHASE_OFFERS, JSON.stringify(offers));
  }
  return offers;
};

// ========================================
// VERKOOP FUNCTIES (jij → bezoekers)
// ========================================

export const getShopCards = () => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEYS.SHOP_CARDS);
  return stored ? JSON.parse(stored) : {};
};

export const getShopSets = () => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEYS.SHOP_SETS);
  return stored ? JSON.parse(stored) : {};
};

export const addCardToShop = (card, setInfo, price) => {
  if (typeof window === 'undefined') return { cards: {}, sets: {} };
  const cards = getShopCards();
  const sets = getShopSets();
  
  const cardKey = `${card.set.id}-${card.id}`;
  
  // Preserve FULL Pokémon TCG API card object including tcgplayer.prices
  // Merge with existing card if it exists to preserve metadata
  const existingCard = cards[cardKey] || {};
  
  cards[cardKey] = {
    // Preserve full API card object
    ...card,
    // Ensure we have the fields we need for display
    setId: card.set?.id || card.setId || existingCard.setId,
    setName: card.set?.name || card.setName || existingCard.setName,
    cardId: card.id || card.cardId || existingCard.cardId,
    cardName: card.name || card.cardName || existingCard.cardName,
    cardNumber: card.number || card.cardNumber || existingCard.cardNumber,
    images: card.images || existingCard.images,
    // Preserve tcgplayer prices if they exist
    tcgplayer: card.tcgplayer || existingCard.tcgplayer,
    // Shop-specific fields
    price: parseFloat(price) || existingCard.price || 0,
    stock: existingCard.stock || 1,
    // Metadata
    addedDate: existingCard.addedDate || new Date().toISOString(),
    lastUpdated: existingCard.lastUpdated || (card.tcgplayer?.prices ? new Date().toISOString() : null)
  };
  
  if (!sets[card.set.id]) {
    sets[card.set.id] = {
      id: card.set.id,
      name: card.set.name,
      images: card.set.images || setInfo?.images,
      cardCount: 0
    };
  }
  
  sets[card.set.id].cardCount = 
    Object.values(cards).filter(c => c.setId === card.set.id).length;
  
  localStorage.setItem(STORAGE_KEYS.SHOP_CARDS, JSON.stringify(cards));
  localStorage.setItem(STORAGE_KEYS.SHOP_SETS, JSON.stringify(sets));
  
  return { cards, sets };
};

export const removeCardFromShop = (setId, cardId) => {
  if (typeof window === 'undefined') return { cards: {}, sets: {} };
  const cards = getShopCards();
  const sets = getShopSets();
  
  const cardKey = `${setId}-${cardId}`;
  delete cards[cardKey];
  
  // Herbereken cardCount voor deze set op basis van alle kaarten
  // Check alle kaarten waarvan de cardKey begint met setId-
  const actualCount = Object.keys(cards).filter(key => {
    return key.startsWith(`${setId}-`);
  }).length;
  
  if (sets[setId]) {
    sets[setId].cardCount = actualCount;
    
    if (sets[setId].cardCount === 0) {
      delete sets[setId];
    }
  }
  
  localStorage.setItem(STORAGE_KEYS.SHOP_CARDS, JSON.stringify(cards));
  localStorage.setItem(STORAGE_KEYS.SHOP_SETS, JSON.stringify(sets));
  
  return { cards, sets };
};

export const updateShopCardPrice = (setId, cardId, price) => {
  if (typeof window === 'undefined') return {};
  const cards = getShopCards();
  const cardKey = `${setId}-${cardId}`;
  
  if (cards[cardKey]) {
    cards[cardKey].price = parseFloat(price);
    localStorage.setItem(STORAGE_KEYS.SHOP_CARDS, JSON.stringify(cards));
  }
  return cards;
};

export const isCardInShop = (cardId, setId) => {
  if (typeof window === 'undefined') return false;
  const cards = getShopCards();
  return !!cards[`${setId}-${cardId}`];
};

export const addShopOrder = (order) => {
  if (typeof window === 'undefined') return null;
  const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_ORDERS) || '[]');
  const newOrder = {
    id: `shop-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    status: 'pending',
    ...order
  };
  orders.push(newOrder);
  localStorage.setItem(STORAGE_KEYS.SHOP_ORDERS, JSON.stringify(orders));
  return newOrder;
};

export const getShopOrders = () => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_ORDERS) || '[]');
};

export const updateShopOrderStatus = (orderId, status) => {
  if (typeof window === 'undefined') return [];
  const orders = getShopOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index > -1) {
    orders[index].status = status;
    localStorage.setItem(STORAGE_KEYS.SHOP_ORDERS, JSON.stringify(orders));
  }
  return orders;
};

// ========================================
// PRICE HYDRATION HELPERS
// ========================================

/**
 * Update purchase cards after price hydration
 */
export const updatePurchaseCards = (updatedCards) => {
  if (typeof window === 'undefined') return;
  const cards = getPurchaseCards();
  
  // Update each card that was hydrated
  updatedCards.forEach(card => {
    const cardKey = `${card.setId}-${card.cardId}`;
    if (cards[cardKey]) {
      cards[cardKey] = {
        ...cards[cardKey],
        ...card,
        // Preserve metadata
        addedDate: cards[cardKey].addedDate || card.addedDate,
        lastUpdated: card.lastUpdated || new Date().toISOString()
      };
    }
  });
  
  localStorage.setItem(STORAGE_KEYS.PURCHASE_CARDS, JSON.stringify(cards));
  return cards;
};

/**
 * Update shop cards after price hydration
 */
export const updateShopCards = (updatedCards) => {
  if (typeof window === 'undefined') return;
  const cards = getShopCards();
  
  // Update each card that was hydrated
  updatedCards.forEach(card => {
    const cardKey = `${card.setId}-${card.cardId}`;
    if (cards[cardKey]) {
      cards[cardKey] = {
        ...cards[cardKey],
        ...card,
        // Preserve shop-specific fields
        price: cards[cardKey].price || card.price || 0,
        stock: cards[cardKey].stock || card.stock || 1,
        // Preserve metadata
        addedDate: cards[cardKey].addedDate || card.addedDate,
        lastUpdated: card.lastUpdated || new Date().toISOString()
      };
    }
  });
  
  localStorage.setItem(STORAGE_KEYS.SHOP_CARDS, JSON.stringify(cards));
  return cards;
};

// Initialize default admin credentials on first load
if (typeof window !== 'undefined') {
  initAdminCredentials();
}

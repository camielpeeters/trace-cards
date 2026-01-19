'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, Search, Home, Sparkles, BarChart3, Mail, ChevronRight, Plus, X, ChevronDown, Bug, Users, ExternalLink, ShoppingBag, Check, XCircle, DollarSign, ShoppingCart, FileText, Calendar, RefreshCw, BarChart, Settings, Filter, Save, Grid, List } from 'lucide-react';
import { isAuthenticated, logout } from '../lib/auth';
import UserProfile from '../components/UserProfile';
import ThemeToggle from '../components/ThemeToggle';
import Link from 'next/link';
import { 
  getOffers, 
  getPublicCards, 
  getPublicSets, 
  addCardToPublic, 
  addCardToPublicWithPrice,
  removeCardFromPublic, 
  isCardPublic,
  getCachedSets,
  cacheSets,
  clearSetsCache,
  isCacheValid,
  getPurchaseCards,
  getPurchaseSets,
  addCardToPurchase,
  removeCardFromPurchase,
  isCardInPurchase,
  getPurchaseOffers,
  getShopCards,
  getShopSets,
  addCardToShop,
  removeCardFromShop,
  isCardInShop,
  getShopOrders,
  getCachedCards,
  cacheCards,
  clearCardsCache,
  clearAllCardsCache,
  clearOldCardsCache,
  getCardsCacheStats,
  STORAGE_KEYS
} from '../lib/storage';

export default function AdminDashboard() {
  const router = useRouter();
  const [allSets, setAllSets] = useState([]); // Alle sets (ongefilterd)
  const [currentSetCards, setCurrentSetCards] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [selectedSetInfo, setSelectedSetInfo] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [activeTab, setActiveTab] = useState('purchase'); // 'purchase', 'shop', 'orders', 'cache'
  const [activeSubTab, setActiveSubTab] = useState('browse'); // 'browse', 'cards' (within purchase/shop)
  const [yearFilter, setYearFilter] = useState('2026'); // Client-side filter
  const [customYearFrom, setCustomYearFrom] = useState('');
  const [customYearTo, setCustomYearTo] = useState('');
  const [mounted, setMounted] = useState(false);
  const [hasLoadedSets, setHasLoadedSets] = useState(false);
  const [publicCards, setPublicCards] = useState({});
  const [publicSets, setPublicSets] = useState({});
  const [purchaseCards, setPurchaseCards] = useState({});
  const [purchaseSets, setPurchaseSets] = useState({});
  const [shopCards, setShopCards] = useState({});
  const [shopSets, setShopSets] = useState({});
  const [showCacheBeheer, setShowCacheBeheer] = useState(false);
  const [showPricingTools, setShowPricingTools] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Bulk selectie state
  const [selectedCardsForBulk, setSelectedCardsForBulk] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [cardPrices, setCardPrices] = useState({}); // { cardKey: price }
  const [defaultPrice, setDefaultPrice] = useState(5.00);
  const [cardNumberInput, setCardNumberInput] = useState('');
  const [cardView, setCardView] = useState('grid'); // 'grid' or 'list'

  // Check authentication and load data
  useEffect(() => {
    setMounted(true);
    
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const savedApiKey = localStorage.getItem('pokemonApiKey') || '';
    
    setApiKey(savedApiKey);
    setOffers(getOffers());
    setPublicCards(getPublicCards());
    setPublicSets(getPublicSets());
    setPurchaseCards(getPurchaseCards());
    setPurchaseSets(getPurchaseSets());
    setShopCards(getShopCards());
    setShopSets(getShopSets());
    
    // Load current user
    loadCurrentUser();
  }, [router]);

  // Disable native text/image selection while modifier keys are held (keeps click working)
  useEffect(() => {
    const update = (e) => {
      const shift = typeof e.getModifierState === 'function' ? e.getModifierState('Shift') : e.shiftKey;
      const ctrl = typeof e.getModifierState === 'function' ? e.getModifierState('Control') : e.ctrlKey;
      const meta = typeof e.getModifierState === 'function' ? e.getModifierState('Meta') : e.metaKey;
      const shouldDisable = !!(shift || ctrl || meta);

      if (shouldDisable) document.body.classList.add('no-text-select');
      else document.body.classList.remove('no-text-select');
    };

    const onKeyDown = (e) => update(e);
    const onKeyUp = (e) => update(e);
    const onBlur = () => document.body.classList.remove('no-text-select');

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      document.body.classList.remove('no-text-select');
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Herlaad sets wanneer activeTab verandert om correcte counts te tonen
  useEffect(() => {
    if (mounted && (activeTab === 'purchase' || activeTab === 'shop')) {
      // Herbereken counts op basis van werkelijke kaarten in localStorage
      const purchaseCards = getPurchaseCards();
      const shopCards = getShopCards();
      const purchaseSets = getPurchaseSets();
      const shopSets = getShopSets();
      
      // Herbereken counts voor alle sets
      Object.keys(purchaseSets).forEach(setId => {
        const actualCount = Object.keys(purchaseCards).filter(key => key.startsWith(`${setId}-`)).length;
        purchaseSets[setId].cardCount = actualCount;
        if (actualCount === 0) {
          delete purchaseSets[setId];
        }
      });
      
      Object.keys(shopSets).forEach(setId => {
        const actualCount = Object.keys(shopCards).filter(key => key.startsWith(`${setId}-`)).length;
        shopSets[setId].cardCount = actualCount;
        if (actualCount === 0) {
          delete shopSets[setId];
        }
      });
      
      // Sla de bijgewerkte sets op
      localStorage.setItem(STORAGE_KEYS.PURCHASE_SETS, JSON.stringify(purchaseSets));
      localStorage.setItem(STORAGE_KEYS.SHOP_SETS, JSON.stringify(shopSets));
      
      setPurchaseSets(purchaseSets);
      setShopSets(shopSets);
    }
  }, [activeTab, mounted]);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  // Auto-load sets als we authenticated zijn
  useEffect(() => {
    if (mounted && apiKey && !hasLoadedSets) {
      console.log('🚀 Auto-loading ALL sets (will be cached)...');
      fetchSets();
    }
  }, [mounted, apiKey, hasLoadedSets]);

  const fetchSets = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Check cache eerst
      if (!forceRefresh) {
        const cachedSets = getCachedSets();
        if (cachedSets) {
          console.log('✅ Loaded from cache:', cachedSets.length, 'sets');
          setAllSets(cachedSets);
          setHasLoadedSets(true);
          setLoading(false);
          return;
        }
      }
      
      console.log('🔄 Fetching ALL sets from API (no date filter)...');
      
      // Laad ALLE sets - GEEN date query!
      const response = await fetch(
        `/api/sets?apiKey=${encodeURIComponent(apiKey)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const allSetsData = data.data || [];
      
      console.log(`✅ Loaded ${allSetsData.length} total sets`);
      
      // Cache ALLE sets
      cacheSets(allSetsData);
      
      setAllSets(allSetsData);
      setHasLoadedSets(true);
    } catch (error) {
      console.error('❌ Error fetching sets:', error);
      alert(`Fout bij het laden van sets: ${error.message}\n\nProbeer de pagina te verversen.`);
    } finally {
      setLoading(false);
    }
  };

  // CLIENT-SIDE filtering op jaar
  const getFilteredSets = () => {
    if (!yearFilter || yearFilter === 'all') return allSets;
    
    return allSets.filter(set => {
      if (!set.releaseDate) return false;
      
      const releaseYear = parseInt(set.releaseDate.split('-')[0]);
      
      // Check for custom year range (format: custom:YYYY-YYYY)
      if (yearFilter.startsWith('custom:')) {
        const [from, to] = yearFilter.replace('custom:', '').split('-').map(Number);
        if (!isNaN(from) && !isNaN(to)) {
          return releaseYear >= from && releaseYear <= to;
        }
      }
      
      switch(yearFilter) {
        case '2026':
          return releaseYear === 2026;
        case '2025':
          return releaseYear === 2025;
        case '2024':
          return releaseYear === 2024;
        case '2023':
          return releaseYear === 2023;
        case '2022':
          return releaseYear === 2022;
        case '2021-2017':
          return releaseYear >= 2017 && releaseYear <= 2021;
        case '2016-2010':
          return releaseYear >= 2010 && releaseYear <= 2016;
        case '1996-2007':
          return releaseYear >= 1996 && releaseYear <= 2007;
        case 'all':
        default:
          return true;
      }
    });
  };

  const selectSetForCardManagement = async (setId) => {
    try {
      console.log('🎯 Opening card management for set:', setId);
      setLoading(true);
      const setInfo = allSets.find(s => s.id === setId);
      
      if (!setInfo) {
        console.error('❌ Set not found:', setId);
        alert('Set niet gevonden');
        setLoading(false);
        return;
      }
      
      // TRY CACHE EERST
      const cachedCards = getCachedCards(setId);
      if (cachedCards) {
        console.log(`✅ Using cached cards (${cachedCards.length} cards)`);
        // Sorteer kaarten op nummer (natuurlijke nummer sortering)
        const sortedCards = [...cachedCards].sort((a, b) => {
          const numA = parseInt(a.number || '0', 10);
          const numB = parseInt(b.number || '0', 10);
          return numA - numB;
        });
        setCurrentSetCards(sortedCards);
        setSelectedSetId(setId);
        setSelectedSetInfo(setInfo);
        setActiveSubTab('cards');
        setLoading(false);
        return; // DONE! No API call needed
      }
      
      // CACHE MISS - Laad van API
      console.log('📋 Cache miss, loading from API for set:', setId, setInfo.name);
      
      const query = `set.id:${setId}`;
      let allCards = [];
      let currentPage = 1;
      let totalPages = 1;
      const pageSize = 250; // Max page size
      
      // Laad alle pagina's
      do {
        console.log(`📄 Loading page ${currentPage}...`);
        
        const response = await fetch(
          `/api/cards?q=${encodeURIComponent(query)}&apiKey=${encodeURIComponent(apiKey)}&page=${currentPage}&pageSize=${pageSize}`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const cards = data.data || [];
        allCards = [...allCards, ...cards];
        
        // Bepaal totaal aantal pagina's
        if (data.totalCount && data.pageSize) {
          totalPages = Math.ceil(data.totalCount / data.pageSize);
        } else if (cards.length < pageSize) {
          // Als we minder kaarten krijgen dan pageSize, zijn we klaar
          totalPages = currentPage;
        }
        
        console.log(`✅ Loaded page ${currentPage}/${totalPages}: ${cards.length} cards (${allCards.length} total)`);
        
        currentPage++;
        
        // Stop als we alle kaarten hebben of als er geen kaarten meer zijn
        if (cards.length === 0 || currentPage > totalPages) {
          break;
        }
        
        // Kleine delay tussen requests om rate limiting te voorkomen
        if (currentPage <= totalPages) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } while (currentPage <= totalPages);
      
      console.log(`✅ Loaded ${allCards.length} total cards from API`);
      
      // Sorteer kaarten op nummer (natuurlijke nummer sortering)
      const sortedCards = allCards.sort((a, b) => {
        const numA = parseInt(a.number || '0', 10);
        const numB = parseInt(b.number || '0', 10);
        return numA - numB;
      });
      
      // CACHE DE KAARTEN (gesorteerd)
      cacheCards(setId, sortedCards);
      
      setCurrentSetCards(sortedCards);
      setSelectedSetId(setId);
      setSelectedSetInfo(setInfo);
      setActiveSubTab('cards');
    } catch (error) {
      console.error('❌ Error loading cards:', error);
      
      // Betere error messages
      let errorMessage = error.message;
      if (errorMessage.includes('timeout')) {
        errorMessage = 'De Pokemon API reageert te langzaam. Probeer het later opnieuw of selecteer een andere set.';
      } else if (errorMessage.includes('504')) {
        errorMessage = 'De Pokemon API is tijdelijk niet beschikbaar (Gateway Timeout). Probeer het over een paar minuten opnieuw.';
      } else if (errorMessage.includes('503')) {
        errorMessage = 'De Pokemon API is tijdelijk niet beschikbaar. Probeer het later opnieuw.';
      }
      
      alert(`Fout bij laden van kaarten: ${errorMessage}\n\nProbeer opnieuw of ververs de cache.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCardToPublic = (card) => {
    const result = addCardToPublic(card, selectedSetInfo);
    setPublicCards(result.publicCards);
    setPublicSets(result.publicSets);
  };

  const handleRemoveCardFromPublic = (cardId, setId) => {
    const result = removeCardFromPublic(cardId, setId);
    setPublicCards(result.publicCards);
    setPublicSets(result.publicSets);
  };

  // Purchase card handlers
  const handleAddCardToPurchase = (card) => {
    const result = addCardToPurchase(card, selectedSetInfo);
    setPurchaseCards(result.cards);
    setPurchaseSets(result.sets);
  };

  const handleRemoveCardFromPurchase = (cardId, setId) => {
    const result = removeCardFromPurchase(setId, cardId);
    setPurchaseCards(result.cards);
    setPurchaseSets(result.sets);
    // Herlaad ook de sets state om ervoor te zorgen dat de count correct is
    setTimeout(() => {
      setPurchaseSets(getPurchaseSets());
    }, 0);
  };

  // Shop card handlers
  const handleAddCardToShop = (card, price) => {
    const result = addCardToShop(card, selectedSetInfo, price);
    setShopCards(result.cards);
    setShopSets(result.sets);
  };

  const handleRemoveCardFromShop = (cardId, setId) => {
    const result = removeCardFromShop(setId, cardId);
    setShopCards(result.cards);
    setShopSets(result.sets);
    // Herlaad ook de sets state om ervoor te zorgen dat de count correct is
    setTimeout(() => {
      setShopSets(getShopSets());
    }, 0);
  };

  // Functie om al toegevoegde kaarten uit selectie te verwijderen EN uit shop/inkoop te halen
  const deselectAddedCards = () => {
    const newSelected = new Set(selectedCardsForBulk);
    const updatedPrices = { ...cardPrices };
    let removedCount = 0;

    // Verzamel alle kaarten die verwijderd moeten worden EERST, voordat we ze verwijderen
    // Dit voorkomt dat we dezelfde kaart meerdere keren proberen te verwijderen
    const cardsToRemove = [];
    Array.from(selectedCardsForBulk).forEach(cardKey => {
      // Parse cardKey: format is "setId-cardId"
      const lastDashIndex = cardKey.lastIndexOf('-');
      if (lastDashIndex === -1) return;

      const setId = cardKey.substring(0, lastDashIndex);
      const cardId = cardKey.substring(lastDashIndex + 1);

      // Check of kaart al in purchase/shop staat
      const isAdded = activeTab === 'purchase' 
        ? isCardInPurchase(cardId, setId)
        : isCardInShop(cardId, setId);

      if (isAdded) {
        cardsToRemove.push({ setId, cardId, cardKey });
        removedCount++;
      }
    });

    // Verwijder alle kaarten in bulk
    cardsToRemove.forEach(({ setId, cardId }) => {
      if (activeTab === 'purchase') {
        removeCardFromPurchase(setId, cardId);
      } else {
        removeCardFromShop(setId, cardId);
      }
    });

    // Deselecteer alle verwijderde kaarten
    cardsToRemove.forEach(({ cardKey }) => {
      newSelected.delete(cardKey);
      delete updatedPrices[cardKey];
    });

    setSelectedCardsForBulk(newSelected);
    setCardPrices(updatedPrices);

    // Herlaad sets en cards na verwijdering om te zorgen dat de count correct wordt weergegeven
    if (removedCount > 0) {
      if (activeTab === 'purchase') {
        const purchaseResult = getPurchaseCards();
        const purchaseSetsResult = getPurchaseSets();
        setPurchaseCards(purchaseResult);
        setPurchaseSets(purchaseSetsResult);
      } else {
        const shopResult = getShopCards();
        const shopSetsResult = getShopSets();
        setShopCards(shopResult);
        setShopSets(shopSetsResult);
      }
      alert(`✅ ${removedCount} kaart${removedCount > 1 ? 'en' : ''} verwijderd uit ${activeTab === 'purchase' ? 'inkoop' : 'winkel'}`);
    } else {
      // Geen kaarten verwijderd
      alert('Geen kaarten gevonden die al toegevoegd zijn aan ' + (activeTab === 'purchase' ? 'inkoop' : 'winkel'));
    }
  };

  // Bulk selectie logica
  const handleCardClick = (card, index, event) => {
    const cardKey = `${card.set.id}-${card.id}`;
    const newSelected = new Set(selectedCardsForBulk);
    
    if (event.shiftKey && lastSelectedIndex !== null && lastSelectedIndex >= 0) {
      // SHIFT + CLICK: Selecteer range tussen lastSelectedIndex en huidige index
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      
      // Selecteer alle kaarten in de range (inclusief start en end)
      for (let i = start; i <= end; i++) {
        if (i >= 0 && i < currentSetCards.length) {
          const cardAtIndex = currentSetCards[i];
          if (cardAtIndex) {
            const key = `${cardAtIndex.set.id}-${cardAtIndex.id}`;
            newSelected.add(key);
            
            // Zet default prijs als nog niet gezet
            if (!cardPrices[key]) {
              setCardPrices(prev => ({ ...prev, [key]: defaultPrice }));
            }
          }
        }
      }
      
      // Update state
      setLastSelectedIndex(index);
      setSelectedCardsForBulk(newSelected);
      return;
    }
    
    if (event.ctrlKey || event.metaKey) {
      // CTRL/CMD + CLICK: Toggle zonder reset van andere selecties
      if (newSelected.has(cardKey)) {
        newSelected.delete(cardKey);
        setCardPrices(prev => {
          const updated = { ...prev };
          delete updated[cardKey];
          return updated;
        });
        setLastSelectedIndex(null);
      } else {
        newSelected.add(cardKey);
        setCardPrices(prev => ({ ...prev, [cardKey]: defaultPrice }));
        setLastSelectedIndex(index);
      }
      
      setSelectedCardsForBulk(newSelected);
      return;
    }
    
    // NORMALE CLICK: Toggle individueel
    if (newSelected.has(cardKey)) {
      // Deselecteer
      newSelected.delete(cardKey);
      setCardPrices(prev => {
        const updated = { ...prev };
        delete updated[cardKey];
        return updated;
      });
      setLastSelectedIndex(null);
    } else {
      // Selecteer
      newSelected.add(cardKey);
      setCardPrices(prev => ({ ...prev, [cardKey]: defaultPrice }));
      // Set lastSelectedIndex als startpunt voor toekomstige range selectie
      setLastSelectedIndex(index);
    }
    
    setSelectedCardsForBulk(newSelected);
  };

  // Opslaan functie - context-aware voor purchase/shop
  const saveSelectedCards = async () => {
    if (selectedCardsForBulk.size === 0) {
      alert('Selecteer eerst kaarten!');
      return;
    }
    
    if (!selectedSetInfo) {
      alert('Geen set geselecteerd!');
      return;
    }
    
    if (currentSetCards.length === 0) {
      alert('Geen kaarten geladen! Probeer de set opnieuw te selecteren.');
      return;
    }
    
    const isShop = activeTab === 'shop';
    
    if (isShop) {
      // Voor shop: prijs is verplicht
      const missingPrices = Array.from(selectedCardsForBulk).filter(key => !cardPrices[key] || cardPrices[key] === 0);
      if (missingPrices.length > 0) {
        alert('Voor verkoop moeten alle kaarten een prijs hebben!');
        return;
      }
    }
    
    console.log(`💾 Opslaan kaarten voor ${isShop ? 'VERKOOP' : 'INKOOP'}...`);
    
    let savedCount = 0;
    const errors = [];
    
    const findCard = (cardKey) => {
      const card = currentSetCards.find(c => {
        const expectedKey = `${c.set?.id}-${c.id}`;
        return expectedKey === cardKey;
      });
      
      if (card) return card;
      
      // Fallback: split
      const lastDashIndex = cardKey.lastIndexOf('-');
      if (lastDashIndex === -1) return null;
      
      const setId = cardKey.substring(0, lastDashIndex);
      const cardId = cardKey.substring(lastDashIndex + 1);
      
      return currentSetCards.find(c => c.id === cardId && c.set?.id === setId);
    };
    
    selectedCardsForBulk.forEach(cardKey => {
      const card = findCard(cardKey);
      
      if (!card) {
        errors.push(`Kaart niet gevonden: ${cardKey}`);
        return;
      }
      
      try {
        if (isShop) {
          const price = cardPrices[cardKey] || defaultPrice;
          handleAddCardToShop(card, price);
        } else {
          handleAddCardToPurchase(card);
        }
        savedCount++;
      } catch (error) {
        console.error(`❌ Fout bij opslaan ${card.name}:`, error);
        errors.push(`Fout bij opslaan ${card.name}: ${error.message}`);
      }
    });
    
    // Reset selectie
    setSelectedCardsForBulk(new Set());
    setCardPrices({});
    setLastSelectedIndex(null);
    
    // Update stats
    if (isShop) {
      setShopCards(getShopCards());
      setShopSets(getShopSets());
    } else {
      setPurchaseCards(getPurchaseCards());
      setPurchaseSets(getPurchaseSets());
    }
    
    if (errors.length > 0) {
      console.error('Errors bij opslaan:', errors);
    }
    
    if (savedCount > 0) {
      alert(`✅ ${savedCount} kaarten toegevoegd aan ${isShop ? 'winkel' : 'inkoop'}!`);
    } else {
      alert(`❌ Geen kaarten opgeslagen. Fouten: ${errors.join(', ')}`);
    }
  };

  // Functie om kaarten te selecteren op basis van nummer input
  const handleNumberInput = (inputValue) => {
    setCardNumberInput(inputValue);
    
    if (!inputValue.trim() || !selectedSetId || currentSetCards.length === 0) {
      return;
    }
    
    // Parseer de input: ondersteun zowel "1, 2, 3" als "1,2,3" formaten
    const numbers = inputValue
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0)
      .map(n => {
        // Probeer als nummer te parsen
        const num = parseInt(n, 10);
        return isNaN(num) ? null : num.toString();
      })
      .filter(n => n !== null);
    
    if (numbers.length === 0) {
      return;
    }
    
    // Zoek kaarten met de gespecificeerde nummers
    const newSelected = new Set(selectedCardsForBulk);
    const updatedPrices = { ...cardPrices };
    let foundCount = 0;
    
    currentSetCards.forEach((card, index) => {
      // Vergelijk zowel als string als nummer (sommige kaarten hebben "001", "002" etc.)
      const cardNumber = card.number ? card.number.toString() : '';
      const cardNumberTrimmed = cardNumber.replace(/^0+/, ''); // Verwijder leading zeros
      
      if (numbers.includes(cardNumber) || numbers.includes(cardNumberTrimmed)) {
        const cardKey = `${card.set.id}-${card.id}`;
        newSelected.add(cardKey);
        foundCount++;
        
        // Zet default prijs als nog niet gezet (voor shop)
        if (activeTab === 'shop' && !updatedPrices[cardKey]) {
          updatedPrices[cardKey] = defaultPrice;
        }
      }
    });
    
    setSelectedCardsForBulk(newSelected);
    setCardPrices(updatedPrices);
    
    // Optioneel: feedback geven als niet alle nummers gevonden zijn
    if (foundCount < numbers.length) {
      console.log(`⚠️ ${foundCount} van ${numbers.length} nummers gevonden`);
    }
  };

  const handleLogout = () => {
    logout();
      router.push('/login');
  };

  // Combineer jaar filter met search filter
  const displaySets = getFilteredSets();
  const filteredSets = displaySets.filter(set => 
    set.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const purchaseOffers = getPurchaseOffers();
  const shopOrders = getShopOrders();
  const allOrders = [...purchaseOffers.map(o => ({...o, orderType: 'purchase'})), ...shopOrders.map(o => ({...o, orderType: 'shop'}))];
  
  const filteredOffers = allOrders.filter(order =>
    order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pendingPurchaseOffers = purchaseOffers.filter(o => o.status === 'pending').length;
  const pendingShopOrders = shopOrders.filter(o => o.status === 'pending').length;
  const purchaseCardsCount = Object.keys(purchaseCards).length;
  const purchaseSetsCount = Object.keys(purchaseSets).length;
  const shopCardsCount = Object.keys(shopCards).length;
  const shopSetsCount = Object.keys(shopSets).length;

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen font-['Ubuntu',_sans-serif] relative">
      {/* Gradient Background */}
      <div className="animated-background-container"></div>
      
      {/* Content overlay */}
      <div className="relative z-10">
        {/* Header */}
        <header className="relative glass-strong sticky top-0 z-30 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/80 via-red-500/70 to-white/20 dark:from-red-900/80 dark:via-red-800/70 dark:to-gray-900/20"></div>
          
          <div className="absolute -right-20 top-0 bottom-0 w-96 opacity-10 dark:opacity-5 pointer-events-none transform rotate-12">
            <img 
              src="/pokemon-logo.svg" 
              alt="" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/10 to-transparent animate-glow"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="relative transform hover:rotate-12 transition-transform duration-300">
                  <img 
                    src="/pokeball-icon.png" 
                    alt="Pokeball" 
                    className="w-14 h-14 filter drop-shadow-lg"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white dark:text-red-100 tracking-tight drop-shadow-xl">
                  Dashboard
                </h1>
                <p className="text-sm text-white/90 dark:text-red-200/80 font-medium mt-1 text-center">
                  Beheer inkoop en verkoop
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {currentUser && (
                <>
                  <Link href={`/${currentUser.username}`}>
                    <button
                      className="relative flex items-center gap-2 glass rounded-full px-4 py-2 font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all group overflow-hidden text-red-600 dark:text-red-400 backdrop-blur-md"
                      title="Bekijk je publieke inkoop pagina"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <ExternalLink className="w-5 h-5 relative z-10" />
                      <span className="relative z-10 hidden sm:inline">Inkoop</span>
                    </button>
                  </Link>
                  <Link href={`/${currentUser.username}/shop`}>
                    <button
                      className="relative flex items-center gap-2 glass rounded-full px-4 py-2 font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all group overflow-hidden text-red-600 dark:text-red-400 backdrop-blur-md"
                      title="Bekijk je publieke verkoop pagina"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <ShoppingBag className="w-5 h-5 relative z-10" />
                      <span className="relative z-10 hidden sm:inline">Verkoop</span>
                    </button>
                  </Link>
                </>
              )}
              <ThemeToggle />
              <UserProfile />
            </div>
          </div>
        </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Content - Always visible for authenticated admins */}
        <>
            {/* Stats - Modern Glass iOS Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass-strong rounded-2xl p-6 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600 dark:text-gray-400 font-semibold text-sm mb-2 uppercase tracking-wide">Inkoop Kaarten</p>
                    <p className="text-4xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">{purchaseCardsCount}</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 dark:from-red-500/30 dark:to-orange-500/30 backdrop-blur-sm flex items-center justify-center border border-red-500/20 dark:border-red-400/30">
                    <ShoppingBag className="w-7 h-7 text-red-500 dark:text-red-400" />
                  </div>
                </div>
              </div>

              <div className="glass-strong rounded-2xl p-6 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600 dark:text-gray-400 font-semibold text-sm mb-2 uppercase tracking-wide">Winkel Kaarten</p>
                    <p className="text-4xl font-black bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">{shopCardsCount}</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 dark:from-purple-500/30 dark:to-blue-500/30 backdrop-blur-sm flex items-center justify-center border border-purple-500/20 dark:border-purple-400/30">
                    <BarChart3 className="w-7 h-7 text-purple-500 dark:text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="glass-strong rounded-2xl p-6 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600 dark:text-gray-400 font-semibold text-sm mb-2 uppercase tracking-wide">Openstaande Aanbiedingen</p>
                    <p className="text-4xl font-black bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">{pendingPurchaseOffers + pendingShopOrders}</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-teal-500/20 dark:from-green-500/30 dark:to-teal-500/30 backdrop-blur-sm flex items-center justify-center border border-green-500/20 dark:border-green-400/30">
                    <Mail className="w-7 h-7 text-green-500 dark:text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs - Modern Toggle Design */}
            <div className="glass-strong rounded-2xl p-1.5 mb-6 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl overflow-hidden">
              <div className="relative flex gap-1">
                {/* Active background indicator */}
                <div 
                  className={`absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r shadow-lg transition-all duration-300 ease-out ${
                    activeTab === 'purchase'
                      ? 'left-1.5 from-red-500 to-orange-500'
                      : activeTab === 'shop'
                      ? 'left-1/4 ml-1.5 from-purple-500 to-blue-500'
                      : activeTab === 'orders'
                      ? 'left-2/4 ml-1.5 from-green-500 to-teal-500'
                      : 'left-3/4 ml-1.5 from-blue-500 to-cyan-500'
                  }`}
                  style={{ 
                    width: 'calc(25% - 6px)',
                  }}
                />
                
                <button
                  onClick={() => { 
                    setActiveTab('purchase'); 
                    setActiveSubTab('browse'); 
                    setSelectedSetId(null); 
                    setSearchTerm('');
                    // Herlaad sets wanneer tab verandert om correcte counts te tonen
                    setPurchaseSets(getPurchaseSets());
                    setShopSets(getShopSets());
                  }}
                  className={`relative z-10 flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 ${
                    activeTab === 'purchase'
                      ? 'text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Inkoop Beheer</span>
                </button>
                
                <button
                  onClick={() => { 
                    setActiveTab('shop'); 
                    setActiveSubTab('browse'); 
                    setSelectedSetId(null); 
                    setSearchTerm('');
                    // Herlaad sets wanneer tab verandert om correcte counts te tonen
                    setPurchaseSets(getPurchaseSets());
                    setShopSets(getShopSets());
                  }}
                  className={`relative z-10 flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 ${
                    activeTab === 'shop'
                      ? 'text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Verkoop Beheer</span>
                </button>
                
                <button
                  onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
                  className={`relative z-10 flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 ${
                    activeTab === 'orders'
                      ? 'text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Aanbiedingen & Bestellingen</span>
                </button>

                <button
                  onClick={() => { setActiveTab('cache'); setShowCacheBeheer(!showCacheBeheer); }}
                  className={`relative z-10 flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 ${
                    activeTab === 'cache'
                      ? 'text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Cache Beheer</span>
                </button>
              </div>
            </div>

            {/* Cache Beheer - Collapsible Content */}
            {activeTab === 'cache' && (
              <div className="mb-6">
                <button
                  onClick={() => setShowCacheBeheer(!showCacheBeheer)}
                  className="w-full glass-strong hover:bg-white/40 dark:hover:bg-gray-800/40 rounded-xl p-4 flex items-center justify-between transition-all border border-white/20 dark:border-gray-700/30 shadow-lg backdrop-blur-xl mb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-500/30 dark:to-cyan-500/30 backdrop-blur-sm flex items-center justify-center border border-blue-500/20 dark:border-blue-400/30">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wide">Cache Beheer</span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-700 dark:text-gray-300 transition-transform duration-300 ${showCacheBeheer ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {showCacheBeheer && (
                  <div className="mt-3 glass-strong rounded-2xl overflow-hidden border border-white/20 dark:border-gray-700/30 shadow-xl backdrop-blur-xl">
                    <div className="p-5 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm">
                      <h3 className="font-bold text-sm mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2 uppercase tracking-wide">
                        <Shield className="w-4 h-4" />
                        Cache Beheer
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                        {/* Stats */}
                        <div className="glass rounded-xl p-4 border border-white/30 dark:border-gray-700/50">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide font-semibold">Gecachte Sets</p>
                          <p className="text-2xl font-black bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                            {getCardsCacheStats().cachedSets}
                          </p>
                        </div>
                        
                        <div className="glass rounded-xl p-4 border border-white/30 dark:border-gray-700/50">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide font-semibold">Cache Grootte</p>
                          <p className="text-2xl font-black bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                            {getCardsCacheStats().totalSizeKB} KB
                          </p>
                        </div>
                        
                        <div className="glass rounded-xl p-4 border border-white/30 dark:border-gray-700/50">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide font-semibold">Cache Geldig</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            7 dagen
                          </p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap mb-4">
                        <button
                          onClick={() => {
                            clearOldCardsCache();
                            alert('Oude caches gewist!');
                          }}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all text-sm"
                        >
                          Clear Oude Cache
                        </button>
                        
                        <button
                          onClick={() => {
                            if (confirm('Weet je zeker dat je ALLE kaarten caches wilt wissen? Dit betekent dat kaarten opnieuw geladen moeten worden.')) {
                              clearAllCardsCache();
                              alert('Alle kaarten caches gewist!');
                            }
                          }}
                          className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all text-sm"
                        >
                          Clear Alle Kaarten Cache
                        </button>
                        
                        <button
                          onClick={() => {
                            if (confirm('Weet je zeker dat je ALLES wilt wissen (sets + kaarten)?')) {
                              clearSetsCache();
                              clearAllCardsCache();
                              setAllSets([]);
                              setCurrentSetCards([]);
                              setHasLoadedSets(false);
                              alert('Alle caches gewist! Pagina wordt herladen...');
                              window.location.reload();
                            }
                          }}
                          className="px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all text-sm"
                        >
                          Reset Alles
                        </button>
                      </div>
                      
                      {/* Info */}
                      <p className="text-xs text-gray-600 dark:text-gray-400 glass rounded-lg p-3 border border-white/30 dark:border-gray-700/50">
                        Kaarten worden 7 dagen gecached. Sets worden 1 dag gecached. Cache wordt automatisch gewist als deze te oud is.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pricing Tools - Only shown in Shop tab */}
            {activeTab === 'shop' && (
              <div className="mb-6">
                <button
                  onClick={() => setShowPricingTools(!showPricingTools)}
                  className="w-full glass-strong hover:bg-white/40 dark:hover:bg-gray-800/40 rounded-xl p-4 flex items-center justify-between transition-all border border-white/20 dark:border-gray-700/30 shadow-lg backdrop-blur-xl"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 dark:from-purple-500/30 dark:to-blue-500/30 backdrop-blur-sm flex items-center justify-center border border-purple-500/20 dark:border-purple-400/30">
                      <Settings className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                    </div>
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wide">Pricing Tools</span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-700 dark:text-gray-300 transition-transform duration-300 ${showPricingTools ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {showPricingTools && (
                  <div className="mt-3 glass-strong rounded-2xl overflow-hidden border border-white/20 dark:border-gray-700/30 shadow-xl backdrop-blur-xl">
                    <div className="p-5 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm">
                      <h3 className="font-bold text-sm mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2 uppercase tracking-wide">
                        <Settings className="w-4 h-4" />
                        Bulk Pricing Operations
                      </h3>

                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setPricingLoading(true);
                          try {
                            const formData = new FormData(e.target);
                            const action = formData.get('action');
                            const filters = {
                              set: formData.get('filterSet') || undefined,
                              priceRange: formData.get('filterMinPrice') && formData.get('filterMaxPrice') 
                                ? {
                                    min: parseFloat(formData.get('filterMinPrice')),
                                    max: parseFloat(formData.get('filterMaxPrice')),
                                  }
                                : undefined,
                            };
                            
                            const body = {
                              filters,
                              action,
                              customPrice: formData.get('customPrice') ? parseFloat(formData.get('customPrice')) : undefined,
                              margin: formData.get('margin') ? parseFloat(formData.get('margin')) : undefined,
                            };

                            const token = localStorage.getItem('authToken');
                            const response = await fetch('/api/admin/cards/bulk-pricing', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                              },
                              body: JSON.stringify(body),
                            });

                            const data = await response.json();
                            if (response.ok) {
                              alert(`Success! Updated ${data.updated || 0} cards.`);
                              e.target.reset();
                            } else {
                              alert(`Error: ${data.error || 'Failed to apply bulk pricing'}`);
                            }
                          } catch (error) {
                            console.error('Error:', error);
                            alert('Error applying bulk pricing');
                          } finally {
                            setPricingLoading(false);
                          }
                        }}
                        className="space-y-4"
                      >
                        {/* Filters */}
                        <div className="glass rounded-xl p-4 border border-white/30 dark:border-gray-700/50">
                          <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filters
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Set Name (optional)
                              </label>
                              <input
                                type="text"
                                name="filterSet"
                                placeholder="e.g., Base Set"
                                className="w-full px-3 py-2 glass rounded-xl border border-white/30 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Min Price (optional)
                              </label>
                              <input
                                type="number"
                                name="filterMinPrice"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full px-3 py-2 glass rounded-xl border border-white/30 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Max Price (optional)
                              </label>
                              <input
                                type="number"
                                name="filterMaxPrice"
                                step="0.01"
                                placeholder="999.99"
                                className="w-full px-3 py-2 glass rounded-xl border border-white/30 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="glass rounded-xl p-4 border border-white/30 dark:border-gray-700/50">
                          <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-3">Action</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Action Type
                              </label>
                              <select
                                name="action"
                                id="pricingAction"
                                className="w-full px-3 py-2 glass rounded-xl border border-white/30 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 text-sm"
                                required
                                onChange={(e) => {
                                  const customPriceField = document.getElementById('customPriceField');
                                  const marginField = document.getElementById('marginField');
                                  if (e.target.value === 'apply-margin') {
                                    if (customPriceField) customPriceField.style.display = 'none';
                                    if (marginField) marginField.style.display = 'block';
                                  } else if (e.target.value === 'use-market') {
                                    if (customPriceField) customPriceField.style.display = 'none';
                                    if (marginField) marginField.style.display = 'none';
                                  } else {
                                    if (customPriceField) customPriceField.style.display = 'block';
                                    if (marginField) marginField.style.display = 'none';
                                  }
                                }}
                              >
                                <option value="set-custom">Set Custom Price</option>
                                <option value="apply-margin">Apply Margin %</option>
                                <option value="use-market">Use Market Price (remove custom)</option>
                              </select>
                            </div>

                            <div id="customPriceField">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Custom Price (€)
                              </label>
                              <input
                                type="number"
                                name="customPrice"
                                step="0.01"
                                min="0"
                                placeholder="5.00"
                                className="w-full px-3 py-2 glass rounded-xl border border-white/30 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 text-sm"
                              />
                            </div>

                            <div id="marginField" style={{ display: 'none' }}>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Margin Percentage (%)
                              </label>
                              <input
                                type="number"
                                name="margin"
                                step="0.1"
                                placeholder="10"
                                className="w-full px-3 py-2 glass rounded-xl border border-white/30 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 text-sm"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Positive = increase, negative = decrease (e.g., 10 = +10%, -5 = -5%)
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={pricingLoading}
                          className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {pricingLoading ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              Apply Bulk Pricing
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Purchase/Shop Browse Tab */}
            {((activeTab === 'purchase' || activeTab === 'shop') && activeSubTab === 'browse') && (
              <div>
                {/* Simpel Jaar Filter - CLIENT SIDE */}
                <div className="mb-6 glass-strong rounded-2xl p-5 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl">
                  <h3 className="font-bold text-sm mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2 uppercase tracking-wide">
                    <Search className="w-4 h-4" />
                    Filter Jaar
                  </h3>
                  
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setYearFilter('2026')}
                      className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                        yearFilter === '2026' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                          : 'glass text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      2026
                    </button>
                    
                    <button
                      onClick={() => setYearFilter('2025')}
                      className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                        yearFilter === '2025' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                          : 'glass text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      2025
                    </button>
                    
                    <button
                      onClick={() => setYearFilter('2024')}
                      className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                        yearFilter === '2024' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                          : 'glass text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      2024
                    </button>
                    
                    <button
                      onClick={() => setYearFilter('2023')}
                      className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                        yearFilter === '2023' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                          : 'glass text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      2023
                    </button>
                    
                    <button
                      onClick={() => setYearFilter('2022')}
                      className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                        yearFilter === '2022' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                          : 'glass text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      2022
                    </button>
                    
                    <button
                      onClick={() => setYearFilter('2021-2017')}
                      className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                        yearFilter === '2021-2017' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                          : 'glass text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      2021/2017
                    </button>
                    
                    <button
                      onClick={() => setYearFilter('2016-2010')}
                      className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                        yearFilter === '2016-2010' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                          : 'glass text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      2016/2010
                    </button>
                    
                    <button
                      onClick={() => setYearFilter('1996-2007')}
                      className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                        yearFilter === '1996-2007' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                          : 'glass text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      1996/2007
                    </button>
                    
                    <button
                      onClick={() => setYearFilter('all')}
                      className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                        yearFilter === 'all' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                          : 'glass text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      Alle Jaren
                    </button>
                  </div>
                  
                  {/* Handmatige Filter */}
                  <div className="mt-4 pt-4 border-t border-white/20 dark:border-gray-700/30">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Handmatig:</span>
                      <input
                        type="number"
                        placeholder="Van jaar"
                        value={customYearFrom}
                        onChange={(e) => setCustomYearFrom(e.target.value)}
                        className="px-3 py-2 glass rounded-lg border border-white/30 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 text-sm w-24"
                        min="1996"
                        max="2030"
                      />
                      <span className="text-gray-600 dark:text-gray-400">/</span>
                      <input
                        type="number"
                        placeholder="Tot jaar"
                        value={customYearTo}
                        onChange={(e) => setCustomYearTo(e.target.value)}
                        className="px-3 py-2 glass rounded-lg border border-white/30 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 text-sm w-24"
                        min="1996"
                        max="2030"
                      />
                      <button
                        onClick={() => {
                          if (customYearFrom && customYearTo) {
                            const from = parseInt(customYearFrom);
                            const to = parseInt(customYearTo);
                            if (!isNaN(from) && !isNaN(to) && from <= to) {
                              setYearFilter(`custom:${from}-${to}`);
                            }
                          }
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all text-sm"
                      >
                        Filter
                      </button>
                      
                      {/* Refresh button */}
                      <button
                        onClick={() => {
                          clearSetsCache();
                          fetchSets(true);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all ml-auto"
                      >
                        🔄 Ververs
                      </button>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="mt-3 text-sm text-gray-600">
                    {allSets.length > 0 && (
                      <>
                        <BarChart3 className="w-4 h-4" />
                        <span>{getFilteredSets().length} van {allSets.length} sets</span>
                        {yearFilter !== 'all' && <span className="text-gray-500 dark:text-gray-400">(gefilterd op {yearFilter})</span>}
                      </>
                    )}
                  </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                  <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Zoek een set..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-full border-3 border-purple-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-300 font-normal"
                    />
                  </div>
                </div>

                {/* Sets Grid */}
                {loading ? (
                  <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-400 dark:border-blue-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
                      Sets laden...
                    </p>
                  </div>
                ) : (
                  <div className="glass-strong rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/50 overflow-hidden backdrop-blur-xl">
                    <div className="divide-y divide-white/10 dark:divide-gray-700/30">
                      {filteredSets.map((set) => {
                        const currentSets = activeTab === 'purchase' ? purchaseSets : shopSets;
                        const setInfo = currentSets[set.id];
                        const cardCount = setInfo?.cardCount || 0;
                        
                        return (
                          <div
                            key={set.id}
                            className="p-6 flex items-center justify-between hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {set.images?.logo && (
                                <img
                                  src={set.images.logo}
                                  alt={set.name}
                                  className="w-16 h-16 object-contain"
                                />
                              )}
                              <div>
                                <h3 className="font-medium text-lg text-gray-800 dark:text-gray-200">{set.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                  {set.total} kaarten • {set.series || 'N/A'}
                                  {cardCount > 0 && (
                                    <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                                      ({cardCount} publiek)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">ID: {set.id}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                console.log('🎯 Opening card management for set:', set.id, set.name);
                                selectSetForCardManagement(set.id);
                              }}
                              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                            >
                              <Plus className="w-5 h-5" />
                              <span>Beheer Kaarten</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {filteredSets.length === 0 && (
                      <div className="p-12 text-center">
                        <p className="text-gray-600 dark:text-gray-400 font-medium">Geen sets gevonden</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Purchase/Shop Cards Tab */}
            {((activeTab === 'purchase' || activeTab === 'shop') && activeSubTab === 'cards') && (
              <div>
                {!selectedSetId ? (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-4 border-purple-400">
                    <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-gray-800 mb-2">Geen Set Geselecteerd</h3>
                    <p className="text-gray-600 mb-6">
                      Selecteer eerst een set vanuit de "Sets Browsen" tab om kaarten te beheren.
                    </p>
                    <button
                      onClick={() => setActiveSubTab('browse')}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                      Naar Sets Browsen
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Set Header - Glass Design */}
                    <div className="glass-strong rounded-2xl p-6 mb-6 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {selectedSetInfo?.images?.logo && (
                            <div className="glass rounded-xl p-2 border border-white/30 dark:border-gray-700/50">
                              <img
                                src={selectedSetInfo.images.logo}
                                alt={selectedSetInfo.name}
                                className="h-16 w-auto"
                              />
                            </div>
                          )}
                          <div>
                            <h2 className="text-2xl font-black text-gray-800 dark:text-white">{selectedSetInfo?.name}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              {currentSetCards.length} kaarten • {(activeTab === 'purchase' ? purchaseSets : shopSets)[selectedSetId]?.cardCount || 0} {activeTab === 'purchase' ? 'voor inkoop' : 'in winkel'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSetId(null);
                            setCurrentSetCards([]);
                            setSelectedSetInfo(null);
                            setActiveSubTab('browse');
                          }}
                          className="flex items-center gap-2 glass px-4 py-2.5 rounded-xl font-medium text-gray-800 dark:text-white hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all border border-white/30 dark:border-gray-700/50"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                          Terug
                        </button>
                      </div>
                    </div>

                    {/* Selectie Overzicht & Acties */}
                    {selectedCardsForBulk.size > 0 && (
                      <div className="mb-6 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl shadow-2xl p-6 sticky top-20 z-30">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          {/* Selectie info */}
                          <div>
                            <h3 className="text-2xl font-black">
                              {selectedCardsForBulk.size} Kaarten Geselecteerd
                            </h3>
                            {activeTab === 'shop' && (
                              <p className="text-sm opacity-90">
                                Totaalprijs: €{' '}
                                {Object.values(cardPrices)
                                  .reduce((sum, price) => sum + (parseFloat(price) || 0), 0)
                                  .toFixed(2)}
                              </p>
                            )}
                          </div>
                          
                          {/* Default prijs instellen (alleen voor shop) */}
                          {activeTab === 'shop' && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium">Standaard prijs:</label>
                              <input
                                type="number"
                                step="0.50"
                                min="0"
                                value={defaultPrice}
                                onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 5.00)}
                                className="w-24 px-3 py-2 rounded-lg text-gray-800 font-bold text-center"
                                placeholder="€5.00"
                              />
                            </div>
                          )}
                          
                          {/* Acties */}
                          <div className="flex gap-2 flex-wrap">
                            {activeTab === 'shop' && (
                              <button
                                onClick={() => {
                                  // Pas alle geselecteerde kaarten aan naar default prijs
                                  const updated = {};
                                  selectedCardsForBulk.forEach(key => {
                                    updated[key] = defaultPrice;
                                  });
                                  setCardPrices(updated);
                                }}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-bold transition-all"
                              >
                                Pas Alle Prijzen Aan
                              </button>
                            )}
                            
                            <button
                              onClick={deselectAddedCards}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-all shadow-lg"
                              title={`Verwijder geselecteerde kaarten uit ${activeTab === 'purchase' ? 'inkoop' : 'winkel'}`}
                            >
                              Verwijder Uit {activeTab === 'purchase' ? 'Inkoop' : 'Winkel'}
                            </button>
                            
                            <button
                              onClick={() => {
                                setSelectedCardsForBulk(new Set());
                                setCardPrices({});
                                setLastSelectedIndex(null);
                              }}
                              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-bold transition-all"
                            >
                              Deselecteer Alles
                            </button>
                            
                            <button
                              onClick={saveSelectedCards}
                              className="px-6 py-2 bg-white text-green-600 rounded-lg font-black shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                            >
                              💾 Opslaan ({selectedCardsForBulk.size})
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sneltoetsen & Nummer Selectie - Glass Design */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                      {/* Sneltoetsen */}
                      <div className="glass-strong rounded-2xl p-5 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 backdrop-blur-sm flex items-center justify-center border border-blue-500/20 dark:border-blue-400/30">
                            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="font-bold text-lg text-gray-800 dark:text-white">Sneltoetsen</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <button className="px-3 py-1.5 glass rounded-lg border border-white/30 dark:border-gray-700/50 text-sm font-semibold text-gray-800 dark:text-white hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all flex-shrink-0">
                              Klik
                            </button>
                            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 pt-1">Selecteer/deselecteer individuele kaart</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <button className="px-3 py-1.5 glass rounded-lg border border-white/30 dark:border-gray-700/50 text-sm font-semibold text-gray-800 dark:text-white hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all flex-shrink-0">
                              ⇧ Shift + Klik
                            </button>
                            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 pt-1">Selecteer alle kaarten tussen eerste en laatste selectie</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <button className="px-3 py-1.5 glass rounded-lg border border-white/30 dark:border-gray-700/50 text-sm font-semibold text-gray-800 dark:text-white hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all flex-shrink-0">
                              ⌘ Ctrl + Klik
                            </button>
                            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 pt-1">Toggle selectie zonder andere te deselecteren</p>
                          </div>
                        </div>
                      </div>

                      {/* Nummer Input voor Snelle Selectie */}
                      <div className="glass-strong rounded-2xl p-5 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 dark:from-green-500/30 dark:to-blue-500/30 backdrop-blur-sm flex items-center justify-center border border-green-500/20 dark:border-green-400/30">
                            <Search className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <h3 className="font-bold text-lg text-gray-800 dark:text-white">Selecteer op Nummer</h3>
                        </div>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={cardNumberInput}
                            onChange={(e) => handleNumberInput(e.target.value)}
                            placeholder="Bijv. 1, 2, 3 of 1,2,3"
                            className="w-full px-4 py-3 glass rounded-xl border border-white/30 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500/50 focus:outline-none font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all"
                          />
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            Voer kaartnummers in gescheiden door komma's (met of zonder spaties). De kaarten worden <span className="font-semibold text-green-600 dark:text-green-400">automatisch geselecteerd</span>.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* View Toggle */}
                    <div className="mb-4 flex items-center justify-end">
                      <div className="glass-strong rounded-xl p-1 flex gap-1 border border-white/20 dark:border-gray-700/30 shadow-lg">
                        <button
                          onClick={() => setCardView('grid')}
                          className={`p-2 rounded-lg transition-all ${
                            cardView === 'grid' 
                              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg' 
                              : 'text-gray-800 dark:text-white hover:bg-white/20'
                          }`}
                          title="Grid weergave"
                        >
                          <Grid className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCardView('list')}
                          className={`p-2 rounded-lg transition-all ${
                            cardView === 'list' 
                              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg' 
                              : 'text-gray-800 dark:text-white hover:bg-white/20'
                          }`}
                          title="Lijst weergave"
                        >
                          <List className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Cards Grid/List met Bulk Selectie */}
                    {loading ? (
                      <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent mb-4"></div>
                        <p className="text-gray-600 font-bold text-lg">
                          {currentSetCards.length === 0 
                            ? 'Kaarten laden...' 
                            : 'Laden uit cache...'}
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                          {currentSetCards.length === 0 
                            ? 'Dit kan 10-30 seconden duren. Volgende keer is het instant!' 
                            : 'Even geduld...'}
                        </p>
                      </div>
                    ) : (
                      cardView === 'grid' ? (
                        <div className="card-select-container grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 select-none" onSelectStart={(e) => e.preventDefault()}>
                          {currentSetCards.map((card, index) => {
                            const cardKey = `${card.set.id}-${card.id}`;
                            const isSelected = selectedCardsForBulk.has(cardKey);
                            const isAdded = activeTab === 'purchase' 
                              ? isCardInPurchase(card.id, card.set.id)
                              : isCardInShop(card.id, card.set.id);
                            
                            return (
                              <div key={card.id} className="relative">
                                {/* Kaart */}
                                <button
                                  onClick={(e) => handleCardClick(card, index, e)}
                                  onSelectStart={(e) => e.preventDefault()}
                                  className={`
                                    relative w-full rounded-xl overflow-hidden transition-all select-none
                                    ${isSelected 
                                      ? 'ring-4 ring-green-500 scale-105 shadow-2xl' 
                                      : 'hover:scale-105 shadow-lg'
                                    }
                                  `}
                                >
                                  {/* Donker overlay voor niet-geselecteerde kaarten */}
                                  {!isSelected && (
                                    <div className="absolute inset-0 bg-black/50 z-10 transition-opacity hover:bg-black/30" />
                                  )}
                                  
                                  {/* Added badge met verwijder optie */}
                                  {isAdded && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (activeTab === 'purchase') {
                                          handleRemoveCardFromPurchase(card.id, card.set.id);
                                        } else {
                                          handleRemoveCardFromShop(card.id, card.set.id);
                                        }
                                      }}
                                      className="absolute top-2 right-2 z-20 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold transition-all shadow-lg flex items-center gap-1 group"
                                      title={`Verwijder uit ${activeTab === 'purchase' ? 'inkoop' : 'winkel'}`}
                                    >
                                      <X className="w-3 h-3" />
                                      <span className="group-hover:hidden">{activeTab === 'purchase' ? 'Inkoop' : 'Winkel'}</span>
                                      <span className="hidden group-hover:inline">Verwijder</span>
                                    </button>
                                  )}
                                  
                                  {/* Selectie badge */}
                                  {isSelected && (
                                    <div className="absolute top-2 left-2 z-20 bg-green-500 text-white rounded-full p-2">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  
                                  {/* Kaart afbeelding */}
                                  <div className="aspect-[2.5/3.5] bg-gray-100 flex items-center justify-center relative">
                                    <img
                                      src={card.images?.small || card.images?.large}
                                      alt={card.name}
                                      draggable={false}
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  </div>
                                  
                                  {/* Kaart info */}
                                  <div className="p-2 bg-white">
                                    <p className="font-bold text-xs text-gray-800 truncate">{card.name}</p>
                                    <p className="text-xs text-gray-500">#{card.number}</p>
                                  </div>
                                </button>
                                
                                {/* Prijs input (alleen voor shop en geselecteerde kaarten) */}
                                {isSelected && activeTab === 'shop' && (
                                  <div className="mt-2">
                                    <input
                                      type="number"
                                      step="0.50"
                                      min="0"
                                      value={cardPrices[cardKey] || defaultPrice}
                                      onChange={(e) => setCardPrices(prev => ({
                                        ...prev,
                                        [cardKey]: parseFloat(e.target.value) || 0
                                      }))}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full px-2 py-1 text-sm border-2 border-green-500 rounded-lg text-center font-bold"
                                      placeholder="€ Prijs"
                                      required
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="card-select-container space-y-2 select-none" onSelectStart={(e) => e.preventDefault()}>
                          {currentSetCards.map((card, index) => {
                            const cardKey = `${card.set.id}-${card.id}`;
                            const isSelected = selectedCardsForBulk.has(cardKey);
                            const isAdded = activeTab === 'purchase' 
                              ? isCardInPurchase(card.id, card.set.id)
                              : isCardInShop(card.id, card.set.id);
                            
                            return (
                              <div
                                key={card.id}
                                onClick={(e) => handleCardClick(card, index, e)}
                                onSelectStart={(e) => e.preventDefault()}
                                className={`
                                  glass-strong rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all border select-none
                                  ${isSelected 
                                    ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20 border-green-500/50' 
                                    : 'border-white/20 dark:border-gray-700/30 hover:bg-white/40 dark:hover:bg-gray-700/40'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  {/* Checkbox indicator */}
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                                    isSelected
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-gray-300 dark:border-gray-600'
                                  }`}>
                                    {isSelected && (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </div>
                                  
                                  {/* Card info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-800 dark:text-white truncate">#{card.number} {card.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Kaart {index + 1} van {currentSetCards.length}</p>
                                  </div>
                                  
                                  {/* Added badge */}
                                  {isAdded && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (activeTab === 'purchase') {
                                          handleRemoveCardFromPurchase(card.id, card.set.id);
                                        } else {
                                          handleRemoveCardFromShop(card.id, card.set.id);
                                        }
                                      }}
                                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                    >
                                      <X className="w-3 h-3" />
                                      {activeTab === 'purchase' ? 'Inkoop' : 'Winkel'}
                                    </button>
                                  )}
                                </div>
                                
                                {/* Prijs input (alleen voor shop en geselecteerde kaarten) */}
                                {isSelected && activeTab === 'shop' && (
                                  <div className="ml-4">
                                    <input
                                      type="number"
                                      step="0.50"
                                      min="0"
                                      value={cardPrices[cardKey] || defaultPrice}
                                      onChange={(e) => setCardPrices(prev => ({
                                        ...prev,
                                        [cardKey]: parseFloat(e.target.value) || 0
                                      }))}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-24 px-3 py-2 text-sm border-2 border-green-500 rounded-lg text-center font-bold glass"
                                      placeholder="€ Prijs"
                                      required
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-3xl font-black mb-6 text-gray-800 dark:text-white">Aanbiedingen & Bestellingen</h2>
                
                <div className="mb-6">
                  <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Zoek in aanbiedingen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl glass border border-white/30 dark:border-gray-700/50 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-medium text-gray-800 dark:text-white dark:bg-gray-800/50 transition-all"
                    />
                  </div>
                </div>

                {filteredOffers.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="glass-strong rounded-2xl p-12 max-w-md mx-auto border border-white/20 dark:border-gray-700/30">
                      <Mail className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 font-medium">
                        Nog geen aanbiedingen of bestellingen ontvangen
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOffers.map((order) => {
                      const isPurchase = order.orderType === 'purchase';
                      const totalAmount = isPurchase 
                        ? (order.totalExpected || order.cards?.reduce((sum, card) => sum + (parseFloat(card.expectedPrice) || 0), 0) || 0)
                        : (order.totalPrice || order.cards?.reduce((sum, card) => sum + (parseFloat(card.price) || 0), 0) || 0);
                      
                      return (
                        <div
                          key={order.id}
                          className={`glass-strong rounded-2xl p-6 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all ${isPurchase ? 'border-red-500/30 dark:border-red-400/30' : 'border-purple-500/30 dark:border-purple-400/30'}`}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${isPurchase ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-700 dark:text-red-400 border border-red-500/30' : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/30'}`}>
                                  {isPurchase ? (
                                    <>
                                      <ShoppingBag className="w-3 h-3" />
                                      Inkoop Aanbieding
                                    </>
                                  ) : (
                                    <>
                                      <BarChart3 className="w-3 h-3" />
                                      Winkel Bestelling
                                    </>
                                  )}
                                </span>
                              </div>
                              <h3 className="text-xl font-black text-gray-800 dark:text-white">
                                {order.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{order.email}</p>
                              {order.phone && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{order.phone}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                                €{totalAmount.toFixed(2)}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(order.date).toLocaleDateString('nl-NL')}
                              </p>
                              <span className={`mt-2 inline-block px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                order.status === 'pending' 
                                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
                                  : order.status === 'accepted'
                                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-400 border border-green-500/30'
                                  : 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-700 dark:text-red-400 border border-red-500/30'
                              }`}>
                                {order.status === 'pending' ? 'Openstaand' : order.status === 'accepted' ? 'Geaccepteerd' : 'Geweigerd'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Bonnetje */}
                          <div className="glass rounded-xl p-4 mb-4 border border-white/30 dark:border-gray-700/50">
                            <h4 className="font-bold text-sm mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2 uppercase tracking-wide">
                              <Mail className="w-4 h-4" />
                              {isPurchase ? 'Aanbieding' : 'Bestelling'} ({order.cards?.length || 0} kaarten)
                            </h4>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                                  <th className="text-left py-2 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wide text-xs">Kaart</th>
                                  <th className="text-center py-2 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wide text-xs">Nummer</th>
                                  <th className="text-right py-2 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wide text-xs">{isPurchase ? 'Verwachte Prijs' : 'Prijs'}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.cards?.map((card, idx) => (
                                  <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="py-2 text-gray-800 dark:text-gray-200">{card.cardName}</td>
                                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">#{card.cardNumber}</td>
                                    <td className="text-right py-2 font-semibold text-gray-800 dark:text-gray-200">
                                      €{((isPurchase ? card.expectedPrice : card.price) || 0).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="font-bold border-t-2 border-gray-800 dark:border-gray-600">
                                  <td className="py-2 text-gray-800 dark:text-gray-200 uppercase tracking-wide" colSpan="2">Totaal</td>
                                  <td className="text-right py-2 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent text-lg font-black">
                                    €{totalAmount.toFixed(2)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Opmerkingen */}
                          {(order.offer || order.notes) && (
                            <div className="glass rounded-xl p-4 mb-4 border border-yellow-500/30 dark:border-yellow-400/30 bg-yellow-500/10 dark:bg-yellow-500/10">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 uppercase tracking-wide">
                                <Mail className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                Opmerking klant
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{order.offer || order.notes}</p>
                            </div>
                          )}
                          
                          {/* Acties */}
                          <div className="flex gap-2">
                            <button className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
                              <Check className="w-4 h-4" />
                              Accepteren
                            </button>
                            <button className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
                              <XCircle className="w-4 h-4" />
                              Afwijzen
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
      </main>
      </div>
    </div>
  );
}

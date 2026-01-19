'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, X, Heart, Sparkles, ArrowLeft, User, Shield, Menu, Copy, Check, List, Grid, ShoppingBag, Wallet, Sparkles as HoloIcon, RotateCcw as ReverseHoloIcon, Square as NonHoloIcon, Zap } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import UserProfile from '../components/UserProfile';
import { isAuthenticated } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';
import { getCachedSets, getPurchaseCards, getShopCards, updatePurchaseCards, updateShopCards } from '../lib/storage';
import { 
  averageMarketPrice, 
  getDefaultVariant, 
  getVariantData, 
  getAvailableVariants,
  getMidPrice,
  hasAnyPrice
} from '../lib/pricing';
import { hydrateCardPrices, getAPIKey } from '../lib/price-hydration';

export default function PublicUserPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const username = params.username;
  const isShopPage = pathname?.includes('/shop');
  const { user: authUser, loading: authLoading } = useAuth(); // Get authenticated user
  const [user, setUser] = useState(null);
  const [purchaseCards, setPurchaseCards] = useState([]);
  const [shopCards, setShopCards] = useState([]);
  const [activeTab, setActiveTab] = useState(isShopPage ? 'shop' : 'purchase'); // 'purchase' or 'shop'
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState([]);
  // Shift-range selectie: onthoud per set de laatste aangeklikte index (zodat shift+klik binnen een set werkt)
  const lastSelectedIndexBySetRef = useRef({}); // { [setId: string]: number }
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    offer: ''
  });
  const [authenticated, setAuthenticated] = useState(false);
  // State for set info and side modal
  const [setInfoMap, setSetInfoMap] = useState({});
  const [openSetModal, setOpenSetModal] = useState(null); // setId of null
  const [setModalView, setSetModalView] = useState('grid'); // 'grid' or 'list'
  const [copied, setCopied] = useState(false);
  const [mainView, setMainView] = useState('grid'); // 'grid' or 'list' for main page
  // State for offer modal with conditions and prices
  const [cardConditions, setCardConditions] = useState({}); // { cardId: 'NM' | 'EX' | 'GD' | 'LP' | 'DMG' }
  const [cardPrices, setCardPrices] = useState({}); // { cardId: price }
  // State for card variants (active variant per card)
  const [cardVariants, setCardVariants] = useState({}); // { cardId: 'nonHolo' | 'reverseHolo' | 'holofoil' }
  // Global card size
  const [cardSize, setCardSize] = useState('medium');

  // Sync activeTab with URL on initial mount and pathname changes
  useEffect(() => {
    const isShop = pathname === `/${username}/shop` || pathname?.endsWith('/shop');
    const initialTab = isShop ? 'shop' : 'purchase';
    setActiveTab(initialTab);
  }, [username, pathname]); // Run when username or pathname changes

  useEffect(() => {
    const checkAuth = () => {
      setAuthenticated(isAuthenticated());
    };
    checkAuth();
    
    // Only check on storage events (other tabs login/logout) - no polling
    const handleStorageChange = (e) => {
      if (e.key === 'authToken') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [username]); // Only run on username change
  
  // Load user data - wait for auth to load, then decide own vs public
  useEffect(() => {
    // Wait for auth to finish loading before deciding
    if (!authLoading) {
      loadUserData();
    }
  }, [username, activeTab, pathname, authenticated, authUser, authLoading]); // Reload when any of these change

  // Load set information from cache (for both purchase and shop cards)
  useEffect(() => {
    if (purchaseCards.length > 0 || shopCards.length > 0) {
      loadSetInfo();
    }
  }, [purchaseCards, shopCards]);

  // Intersection Observer for series logo intro animations - repeats on scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2 // Trigger when 20% of the element is visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add visible class to trigger animation
          entry.target.classList.add('visible');
        } else {
          // Remove visible class when out of view so animation can replay
          entry.target.classList.remove('visible');
        }
      });
    }, observerOptions);

    // Observe all series logo elements with a small delay to ensure DOM is ready
    const observeLogos = () => {
      const logoElements = document.querySelectorAll('.series-logo-intro');
      logoElements.forEach(logo => {
        // Reset animation state
        logo.classList.remove('visible');
        // Use requestAnimationFrame to ensure DOM is ready before observing
        requestAnimationFrame(() => {
          observer.observe(logo);
        });
      });
    };

    // Initial observation
    const timeoutId = setTimeout(observeLogos, 100);

    return () => {
      clearTimeout(timeoutId);
      const logoElements = document.querySelectorAll('.series-logo-intro');
      logoElements.forEach(logo => observer.unobserve(logo));
    };
  }, [purchaseCards, shopCards, setInfoMap, activeTab]); // Re-run when cards, set info, or tab changes

  const loadSetInfo = async () => {
    try {
      const cachedSets = getCachedSets();
      const setMap = {};
      
      if (cachedSets && cachedSets.length > 0) {
        cachedSets.forEach(set => {
          setMap[set.id] = set;
        });
      }
      
      setSetInfoMap(setMap);
    } catch (error) {
      console.error('Error loading set info:', error);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Check if viewing own profile - wait for authUser to load if authenticated
      // If not authenticated or authUser not loaded yet, assume public profile
      const isOwnProfile = authenticated && authUser && authUser.username?.toLowerCase() === username.toLowerCase();
      
      if (isOwnProfile) {
        // Load own cards from localStorage (fast, cached)
        const purchaseCardsData = getPurchaseCards();
        const shopCardsData = getShopCards();
        
        // Convert object to array for display
        const purchaseCardsArray = Object.values(purchaseCardsData);
        const shopCardsArray = Object.values(shopCardsData);
        
        // Render immediately from cache
        setPurchaseCards(purchaseCardsArray);
        setShopCards(shopCardsArray);
        
        // Trigger background price hydration (non-blocking)
        if (purchaseCardsArray.length > 0 || shopCardsArray.length > 0) {
          hydratePricesInBackground(purchaseCardsArray, shopCardsArray);
        }
        
        // Load user info from localStorage or API
        if (authUser) {
          setUser({
            username: authUser.username,
            displayName: authUser.displayName,
            avatarUrl: authUser.avatarUrl
          });
        } else {
          // Fallback to API if no authUser
          const purchaseResponse = await fetch(`/api/public/${username}/purchase-cards`);
          if (purchaseResponse.ok) {
            const purchaseData = await purchaseResponse.json();
            setUser(purchaseData.user);
          }
        }
      } else {
        // Public profile: Load cards from API (database)
        // Always load purchase cards, always load shop cards (we'll need them when switching tabs)
        const [purchaseResponse, shopResponse] = await Promise.all([
          fetch(`/api/public/${username}/purchase-cards`).catch(err => {
            console.error('Error fetching purchase cards:', err);
            return null;
          }),
          fetch(`/api/public/${username}/shop-cards`).catch(err => {
            console.error('Error fetching shop cards:', err);
            return null;
          })
        ]);
        
        // Handle purchase cards response
        if (purchaseResponse && purchaseResponse.ok) {
          const purchaseData = await purchaseResponse.json();
          console.log('📦 Public purchase cards loaded:', purchaseData.cards?.length || 0, 'cards');
          console.log('📦 First card sample:', purchaseData.cards?.[0]);
          setUser(purchaseData.user);
          setPurchaseCards(purchaseData.cards || []);
        } else if (purchaseResponse && !purchaseResponse.ok) {
          // User might not exist
          console.error('❌ Failed to load purchase cards:', purchaseResponse.status, purchaseResponse.statusText);
        } else if (!purchaseResponse) {
          console.error('❌ No purchase cards response received');
        }
        
        // Handle shop cards response
        if (shopResponse && shopResponse.ok) {
          const shopData = await shopResponse.json();
          console.log('📦 Public shop cards loaded:', shopData.cards?.length || 0, 'cards');
          setShopCards(shopData.cards || []);
        } else if (shopResponse && !shopResponse.ok) {
          console.error('❌ Failed to load shop cards:', shopResponse.status, shopResponse.statusText);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Background price hydration (non-blocking)
  const hydratePricesInBackground = async (purchaseCardsArray, shopCardsArray) => {
    const apiKey = getAPIKey();
    if (!apiKey) {
      console.log('⚠️ No API key available for price hydration');
      return;
    }
    
    // Run hydration in background without blocking UI
    setTimeout(async () => {
      try {
        // Hydrate purchase cards
        if (purchaseCardsArray.length > 0) {
          console.log('🔄 Starting background price hydration for purchase cards...');
          const hydratedPurchaseCards = await hydrateCardPrices(purchaseCardsArray, apiKey, {
            batchSize: 5,
            delayBetweenBatches: 1000
          });
          
          // Update localStorage with hydrated cards
          updatePurchaseCards(hydratedPurchaseCards);
          
          // Update state to reflect new prices (this will trigger re-render)
          setPurchaseCards([...hydratedPurchaseCards]);
        }
        
        // Hydrate shop cards
        if (shopCardsArray.length > 0) {
          console.log('🔄 Starting background price hydration for shop cards...');
          const hydratedShopCards = await hydrateCardPrices(shopCardsArray, apiKey, {
            batchSize: 5,
            delayBetweenBatches: 1000
          });
          
          // Update localStorage with hydrated cards
          updateShopCards(hydratedShopCards);
          
          // Update state to reflect new prices (this will trigger re-render)
          setShopCards([...hydratedShopCards]);
        }
        
        console.log('✅ Background price hydration complete');
      } catch (error) {
        console.error('❌ Error during background price hydration:', error);
      }
    }, 100); // Small delay to ensure UI renders first
  };

  // Group cards by set and sort by card number
  const groupCardsBySet = (cards) => {
    const grouped = {};
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      console.log('⚠️ groupCardsBySet: No cards to group', cards);
      return grouped;
    }
    console.log('📦 Grouping cards:', cards.length, 'cards');
    cards.forEach((card, index) => {
      // Handle both localStorage format and database format
      const setId = card.setId || card.setid || 'unknown';
      if (!grouped[setId]) {
        grouped[setId] = [];
      }
      grouped[setId].push(card);
      // Log first card for debugging
      if (index === 0) {
        console.log('📦 First card structure:', {
          setId: card.setId,
          setName: card.setName,
          cardId: card.cardId,
          cardName: card.cardName,
          cardNumber: card.cardNumber || card.number,
          keys: Object.keys(card)
        });
      }
    });
    
    // Sort cards within each set by card number
    Object.keys(grouped).forEach(setId => {
      grouped[setId].sort((a, b) => {
        // Get card numbers (handle both formats)
        const numA = a.cardNumber || a.number || '';
        const numB = b.cardNumber || b.number || '';
        
        // Try to parse as numbers for numeric comparison
        const parsedA = parseInt(numA, 10);
        const parsedB = parseInt(numB, 10);
        
        // If both are valid numbers, compare numerically
        if (!isNaN(parsedA) && !isNaN(parsedB)) {
          return parsedA - parsedB;
        }
        
        // Otherwise, compare as strings
        return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
      });
    });
    
    console.log('📦 Grouped into', Object.keys(grouped).length, 'sets');
    return grouped;
  };

  const purchaseCardsBySet = groupCardsBySet(purchaseCards);
  const shopCardsBySet = groupCardsBySet(shopCards);

  const toggleCardSelection = (card) => {
    // Use cardId if provided (already formatted), otherwise construct it
    const cardIdToMatch = card.cardId || `${card.setId}-${card.cardId}`;
    const isSelected = selectedCards.find(c => c.cardId === cardIdToMatch);
    let newSelection;
    
    if (isSelected) {
      newSelection = selectedCards.filter(c => c.cardId !== cardIdToMatch);
    } else {
      newSelection = [...selectedCards, {
        ...card,
        cardId: cardIdToMatch,
        cardName: card.cardName || card.name,
        cardNumber: card.cardNumber || card.number,
        images: card.images
      }];
    }
    
    setSelectedCards(newSelection);
  };

  const buildCardKey = (card) => {
    // In deze pagina wordt overal `${setId}-${cardId}` gebruikt als key.
    // Let op: `cardId` kan zelf ook al '-' bevatten (PokémonTCG ids), maar we houden de bestaande conventie aan.
    const setId = card?.setId;
    const cardId = card?.cardId;
    return `${setId}-${cardId}`;
  };

  const normalizeSelectedCard = (card, cardKey, variant) => {
    return {
      ...card,
      cardId: cardKey,
      cardName: card.cardName || card.name,
      cardNumber: card.cardNumber || card.number,
      images: card.images,
      ...(variant ? { variant } : {})
    };
  };

  const addCardsToSelection = (cardsToAdd) => {
    // cardsToAdd: Array<{ card, cardKey, variant }>
    setSelectedCards((prev) => {
      const map = new Map(prev.map((c) => [c.cardId, c]));
      cardsToAdd.forEach(({ card, cardKey, variant }) => {
        if (!map.has(cardKey)) {
          map.set(cardKey, normalizeSelectedCard(card, cardKey, variant));
        }
      });
      return Array.from(map.values());
    });
  };

  const toggleSingleCardSelection = (card, cardKey, variant) => {
    setSelectedCards((prev) => {
      const exists = prev.some((c) => c.cardId === cardKey);
      if (exists) return prev.filter((c) => c.cardId !== cardKey);
      return [...prev, normalizeSelectedCard(card, cardKey, variant)];
    });
  };

  const handleCardSelectClick = ({ card, idx, cards, activeVariant, event }) => {
    // Voorkom browser "shift+klik selecteer tekst tussen 2 punten"
    if (event?.shiftKey) {
      event.preventDefault();
    }

    const setId = card.setId;
    const cardKey = buildCardKey(card);

    // SHIFT + CLICK: selecteer range binnen dezelfde set
    if (event.shiftKey) {
      const lastIdx = lastSelectedIndexBySetRef.current?.[setId];
      if (typeof lastIdx === 'number') {
        const start = Math.min(lastIdx, idx);
        const end = Math.max(lastIdx, idx);
        const range = cards.slice(start, end + 1);

        addCardsToSelection(
          range.map((c) => {
            const key = buildCardKey(c);
            const v = cardVariants[key] || getDefaultVariant(c) || 'nonHolo';
            return { card: c, cardKey: key, variant: v };
          })
        );
        lastSelectedIndexBySetRef.current[setId] = idx;
        return;
      }
      // Als er nog geen anchor is: gedraag als normale toggle en zet anchor
      toggleSingleCardSelection(card, cardKey, activeVariant);
      lastSelectedIndexBySetRef.current[setId] = idx;
      return;
    }

    // CTRL/CMD + CLICK: toggle zonder andere te beïnvloeden
    if (event.ctrlKey || event.metaKey) {
      toggleSingleCardSelection(card, cardKey, activeVariant);
      lastSelectedIndexBySetRef.current[setId] = idx;
      return;
    }

    // Normale klik: toggle (zelfde behavior als nu)
    toggleSingleCardSelection(card, cardKey, activeVariant);
    lastSelectedIndexBySetRef.current[setId] = idx;
  };

  const handleTabChange = (tab) => {
    // Update state immediately
    setActiveTab(tab);
    setSelectedCards([]);
    
    // Update URL using Next.js router
    const newPath = tab === 'shop' ? `/${username}/shop` : `/${username}`;
    if (pathname !== newPath) {
      router.push(newPath);
    }
  };

  const handleSubmitOffer = (e) => {
    e.preventDefault();
    
    // Validate that all cards have prices
    const missingPrices = selectedCards.filter(card => {
      const price = parseFloat(cardPrices[card.cardId]);
      return !price || price === 0;
    });
    
    if (missingPrices.length > 0) {
      alert(`Gelieve voor alle kaarten een bedrag in te vullen. (${missingPrices.length} kaart(en) zonder prijs)`);
      return;
    }
    
    // Prepare offer data with conditions, prices, and variants
    const offerData = {
      ...formData,
      cards: selectedCards.map(card => {
        const cardKey = card.cardId;
        return {
          ...card,
          variant: card.variant || cardVariants[cardKey] || getDefaultVariant(card) || 'nonHolo',
          condition: cardConditions[cardKey] || 'NM',
          price: parseFloat(cardPrices[cardKey]) || 0
        };
      }),
      totalPrice: Object.values(cardPrices).reduce((sum, price) => sum + (parseFloat(price) || 0), 0)
    };
    
    // Here you would send the offer to the API
    console.log('Offer data:', offerData);
    alert(`Bedankt ${formData.name}! Je aanbod is ontvangen.`);
    
    setShowModal(false);
    setFormData({ name: '', email: '', phone: '', offer: '' });
    setSelectedCards([]);
    setCardConditions({});
    setCardPrices({});
  };

  const isCardSelected = (card) => {
    const cardKey = `${card.setId}-${card.cardId}`;
    return selectedCards.some(c => c.cardId === cardKey);
  };

  // Helper functions for side modal
  const getSetModalCards = () => {
    if (!openSetModal) return [];
    // Return cards based on active tab
    if (activeTab === 'shop') {
      return shopCardsBySet[openSetModal] || [];
    }
    return purchaseCardsBySet[openSetModal] || [];
  };

  const copySetList = () => {
    const cards = getSetModalCards();
    const setInfo = setInfoMap[openSetModal] || { name: cards[0]?.setName || openSetModal };
    const setTitle = setInfo.name;
    
    const list = [
      setTitle,
      '='.repeat(setTitle.length),
      '',
      ...cards.map((card, idx) => {
        const isSelected = isCardSelected(card);
        const checkbox = isSelected ? '✓' : '☐';
        return `${checkbox} ${idx + 1}. ${card.cardName} (#${card.cardNumber})`;
      })
    ].join('\n');
    
    navigator.clipboard.writeText(list);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen font-['Ubuntu',_sans-serif] relative flex items-center justify-center">
        <div className="animated-background-container"></div>
        <div className="relative z-10">
          <div className="glass-strong rounded-3xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
            <p className="text-gray-800 dark:text-white font-bold">Laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen font-['Ubuntu',_sans-serif] relative flex items-center justify-center p-4">
        <div className="animated-background-container"></div>
        <div className="relative z-10">
          <div className="glass-strong rounded-3xl p-12 max-w-md text-center">
            <User className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-4">Gebruiker Niet Gevonden</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Deze gebruiker bestaat niet of heeft geen publieke pagina.
            </p>
            <Link href="/">
              <button className="bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 text-white px-8 py-3 rounded-full font-black shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                Terug naar Homepage
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasPurchaseCards = Object.keys(purchaseCardsBySet).length > 0;
  const hasShopCards = Object.keys(shopCardsBySet).length > 0;

  return (
    <div className="min-h-screen font-['Ubuntu',_sans-serif] relative w-full overflow-x-hidden">
      <div className="animated-background-container">
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <div className="cloud cloud3"></div>
      </div>
      
      <div className="relative z-10 w-full overflow-x-hidden">
        {/* Header */}
        <header className="relative glass sticky top-0 z-30 shadow-lg w-full overflow-x-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 dark:from-red-700 via-red-500/95 dark:via-red-600/90 to-white/40 dark:to-gray-900/30"></div>
          
          <div className="absolute right-0 top-0 bottom-0 w-96 max-w-[50vw] opacity-10 dark:opacity-5 pointer-events-none transform rotate-12 overflow-hidden">
            <img 
              src="/pokemon-logo.svg" 
              alt="" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/10 to-transparent animate-glow"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-4 flex items-center justify-between w-full">
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link href="/account">
                <button className="relative p-3 glass rounded-xl backdrop-blur-md transition-all hover:scale-110 group">
                  <ArrowLeft className="w-5 h-5 text-white dark:text-red-200 relative z-10" />
                </button>
              </Link>
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
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white dark:text-red-100 tracking-tight drop-shadow-xl truncate">
                  {user.displayName || user.username}
                </h1>
                <p className="text-sm text-white/90 dark:text-red-200/80 font-medium mt-1">
                  Pokemon Kaarten Collectie
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-4">
              <ThemeToggle />
              
              {/* Show login link only if not authenticated */}
              {!authenticated && (
                <Link href="/login">
                  <button
                    className="relative p-3 glass rounded-xl backdrop-blur-md transition-all hover:scale-110 group"
                    title="Inloggen"
                  >
                    <Shield className="w-5 h-5 text-gray-800 dark:text-red-200" />
                  </button>
                </Link>
              )}
              
              {/* Show user profile if authenticated */}
              {authenticated && <UserProfile />}
              
              {selectedCards.length > 0 && activeTab === 'purchase' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="relative flex items-center gap-2 bg-white text-red-600 px-3 md:px-5 py-2 md:py-3 rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all group overflow-hidden z-20 flex-shrink-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 relative z-10" />
                  <span className="hidden sm:inline relative z-10 text-sm md:text-base">Aanbieden</span>
                  <span className="relative z-10 bg-red-600 text-white text-xs font-black rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center shadow-lg">
                    {selectedCards.length}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 w-full overflow-x-hidden">
          {/* Modern Toggle - Hip & Beautiful */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="relative glass-strong rounded-2xl p-1.5 inline-flex gap-1 shadow-xl backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
              {/* Active background indicator */}
              <div 
                className={`absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r shadow-lg transition-all duration-300 ease-out ${
                  activeTab === 'purchase'
                    ? 'left-1.5 right-1/2 mr-1.5 from-red-500 to-orange-500'
                    : 'left-1/2 ml-1.5 right-1.5 from-purple-500 to-blue-500'
                }`}
                style={{ 
                  width: activeTab === 'purchase' ? 'calc(50% - 6px)' : 'calc(50% - 6px)',
                  transform: activeTab === 'purchase' ? 'translateX(0)' : 'translateX(0)'
                }}
              />
              
              <button
                onClick={() => handleTabChange('purchase')}
                className={`relative z-10 px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2.5 min-w-[160px] justify-center ${
                  activeTab === 'purchase'
                    ? 'text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <ShoppingBag className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'purchase' ? 'scale-110' : 'scale-100'}`} />
                <span>Inkoop Kaarten</span>
              </button>
              
              <button
                onClick={() => handleTabChange('shop')}
                className={`relative z-10 px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2.5 min-w-[160px] justify-center ${
                  activeTab === 'shop'
                    ? 'text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Wallet className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'shop' ? 'scale-110' : 'scale-100'}`} />
                <span>Winkel Kaarten</span>
              </button>
            </div>
            
            {/* View Toggle and Card Size - Show on both purchase and shop tab */}
            {((activeTab === 'purchase' && hasPurchaseCards) || (activeTab === 'shop' && hasShopCards)) && (
              <div className="flex items-center gap-3">
                <div className="glass-strong rounded-xl p-1 flex gap-1">
                  <button
                    onClick={() => setMainView('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      mainView === 'grid' 
                        ? 'bg-red-500 text-white' 
                        : 'text-gray-800 dark:text-white hover:bg-white/20'
                    }`}
                    title="Grid weergave"
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setMainView('list')}
                    className={`p-2 rounded-lg transition-all ${
                      mainView === 'list' 
                        ? 'bg-red-500 text-white' 
                        : 'text-gray-800 dark:text-white hover:bg-white/20'
                    }`}
                    title="Lijst weergave"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Card Size Slider */}
                <div className="glass-strong rounded-xl px-3 py-1.5 flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Grootte:</span>
                  <div className="flex gap-1">
                    {['small', 'medium', 'large'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setCardSize(size)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                          cardSize === size
                            ? 'bg-red-500 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Purchase Cards Tab - Smooth transition without flickering */}
          <div className="relative">
            <div 
              className={`transition-opacity duration-200 ease-in-out ${
                activeTab === 'purchase' 
                  ? 'opacity-100 relative' 
                  : 'opacity-0 absolute inset-0 pointer-events-none'
              }`}
              style={{ 
                display: activeTab === 'purchase' ? 'block' : 'none'
              }}
            >
            {!hasPurchaseCards ? (
              <div className="glass-strong rounded-3xl p-12 text-center">
                <Sparkles className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-4">Geen Inkoop Kaarten</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Deze gebruiker heeft nog geen kaarten voor inkoop beschikbaar.
                </p>
              </div>
            ) : (
              <div>
                {Object.entries(purchaseCardsBySet).map(([setId, cards]) => {
                  const setInfo = setInfoMap[setId] || { id: setId, name: cards[0]?.setName || setId, images: null };
                  
                  return (
                    <div key={setId} className="mb-10 relative">
                      {/* Set Header with Logo and Hamburger Menu */}
                      <div className="glass rounded-2xl p-6 mb-6 relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-4">
                          {/* Set Logo left next to title */}
                          {setInfo.images?.logo && (
                            <div className="relative group series-logo-intro">
                              <img 
                                src={setInfo.images.logo} 
                                alt={setInfo.name} 
                                className="h-14 w-auto relative transform group-hover:scale-105 transition-transform"
                                style={{ position: 'relative', zIndex: 1 }}
                              />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white mb-1">
                              {setInfo.name}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                              <span className="text-red-600 dark:text-red-400 font-bold">{cards.length}</span> kaarten
                            </p>
                          </div>
                          
                          {/* Hamburger Menu Button */}
                          <button
                            onClick={() => setOpenSetModal(setId)}
                            className="p-2 glass rounded-lg hover:scale-110 transition-all"
                            title="Set overzicht"
                          >
                            <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Cards Display - Grid or List View */}
                      <div className="relative">
                        {/* Set logo in background of cards section */}
                        {setInfo.images?.logo && (
                          <div className="absolute top-0 right-0 w-1/4 h-1/4 opacity-15 dark:opacity-12 pointer-events-none z-0">
                            <img 
                              src={setInfo.images.logo} 
                              alt="" 
                              className="w-full h-full object-contain object-right-top"
                              style={{ filter: 'brightness(1.2)' }}
                            />
                          </div>
                        )}
                        
                        {mainView === 'grid' ? (
                          <div className={`card-select-container grid gap-5 relative z-10 ${
                            cardSize === 'small' ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8' :
                            cardSize === 'large' ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
                            'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                          }`}>
                            {cards.map((card, idx) => {
                              const selected = isCardSelected(card);
                              const cardKey = `${card.setId}-${card.cardId}`;
                              
                              const handleImageMouseMove = (e) => {
                                // Only trigger 3D effect when hovering over the image, not the text
                                const imageContainer = e.currentTarget;
                                const cardElement = imageContainer.closest('[data-card-key]');
                                if (!cardElement) return;
                                
                                const rect = cardElement.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;
                                
                                const centerX = rect.width / 2;
                                const centerY = rect.height / 2;
                                
                                // Meer rotatie voor meer "tuimelen" effect
                                const rotateX = (y - centerY) / 8;
                                const rotateY = (centerX - x) / 8;
                                
                                // Clamp rotatie om te voorkomen dat kaarten te ver draaien
                                const maxRotation = 25;
                                const clampedRotateX = Math.max(-maxRotation, Math.min(maxRotation, rotateX));
                                const clampedRotateY = Math.max(-maxRotation, Math.min(maxRotation, rotateY));
                                
                                const cardImage3d = imageContainer.querySelector('.card-image-3d');
                                if (cardImage3d) {
                                  // Reset transition voor directe respons tijdens muisbeweging
                                  cardImage3d.style.transition = 'transform 0.1s ease-out';
                                  // Use translate3d for hardware acceleration and prevent blur
                                  cardImage3d.style.transform = `
                                    translate3d(0, 0, 0)
                                    perspective(1000px) 
                                    rotateX(${clampedRotateX}deg) 
                                    rotateY(${clampedRotateY}deg)
                                    scale3d(0.95, 0.95, 1)
                                  `;
                                  cardImage3d.style.webkitTransform = `
                                    translate3d(0, 0, 0)
                                    perspective(1000px) 
                                    rotateX(${clampedRotateX}deg) 
                                    rotateY(${clampedRotateY}deg)
                                    scale3d(0.95, 0.95, 1)
                                  `;
                                  // Force hardware acceleration
                                  cardImage3d.style.willChange = 'transform';
                                  cardImage3d.style.backfaceVisibility = 'hidden';
                                  cardImage3d.style.webkitBackfaceVisibility = 'hidden';
                                  
                                  // Update glare position and intensity based on mouse position and rotation
                                  const shineElement = cardImage3d.querySelector('.card-shine-3d');
                                  if (shineElement) {
                                    // Calculate light position based on mouse position relative to card
                                    const lightX = (x / rect.width) * 100;
                                    const lightY = (y / rect.height) * 100;
                                    
                                    // Calculate intensity based on rotation (more rotation = more visible glare)
                                    const rotationAmount = Math.abs(clampedRotateX) + Math.abs(clampedRotateY);
                                    const intensity = Math.min(0.6, rotationAmount / 25); // Subtieler, max 60%
                                    
                                    shineElement.style.setProperty('--light-x', `${Math.max(0, Math.min(100, lightX))}%`);
                                    shineElement.style.setProperty('--light-y', `${Math.max(0, Math.min(100, lightY))}%`);
                                    shineElement.style.opacity = rotationAmount > 3 ? intensity.toString() : '0';
                                    shineElement.style.transition = 'opacity 0.15s ease-out';
                                  }
                                  
                                  // Update holographic reflection
                                  const holographicElement = cardImage3d.querySelector('.card-holographic-reflect');
                                  if (holographicElement) {
                                    const rotationAmount = Math.abs(clampedRotateX) + Math.abs(clampedRotateY);
                                    
                                    if (rotationAmount > 4) {
                                      const reflectX = 50 + (clampedRotateY * 1.0);
                                      const reflectY = 50 + (clampedRotateX * 1.0);
                                      const reflectAngle = Math.atan2(clampedRotateY, clampedRotateX) * (180 / Math.PI) * 0.3;
                                      
                                      const holoIntensity = Math.min(0.25, rotationAmount / 35); // Veel subtieler, max 25%
                                      
                                      holographicElement.style.setProperty('--reflect-x', `${Math.max(20, Math.min(80, reflectX))}%`);
                                      holographicElement.style.setProperty('--reflect-y', `${Math.max(20, Math.min(80, reflectY))}%`);
                                      holographicElement.style.setProperty('--reflect-angle', `${reflectAngle}deg`);
                                      holographicElement.style.opacity = holoIntensity.toString();
                                    } else {
                                      holographicElement.style.opacity = '0';
                                    }
                                    holographicElement.style.transition = 'opacity 0.25s ease-out';
                                  }
                                }
                              };
                              
                              const handleMouseLeave = (e) => {
                                const imageContainer = e.currentTarget;
                                const cardImage3d = imageContainer.querySelector('.card-image-3d');
                                if (cardImage3d) {
                                  // Reset card rotation with hardware acceleration
                                  cardImage3d.style.transition = 'transform 0.3s ease-out';
                                  cardImage3d.style.transform = 'translate3d(0, 0, 0) perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                                  cardImage3d.style.webkitTransform = 'translate3d(0, 0, 0) perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                                  
                                  // Hide glare effects
                                  const shineElement = cardImage3d.querySelector('.card-shine-3d');
                                  if (shineElement) {
                                    shineElement.style.opacity = '0';
                                    shineElement.style.transition = 'opacity 0.3s ease-out';
                                  }
                                  
                                  const holographicElement = cardImage3d.querySelector('.card-holographic-reflect');
                                  if (holographicElement) {
                                    holographicElement.style.opacity = '0';
                                    holographicElement.style.transition = 'opacity 0.3s ease-out';
                                  }
                                }
                              };
                              
                              // Get active variant for this card
                              const activeVariant = cardVariants[cardKey] || getDefaultVariant(card) || 'nonHolo';
                              const availableVariants = getAvailableVariants(card);
                              const variantData = getVariantData(card, activeVariant);
                              
                              // Get variant icon component
                              const getVariantIcon = (variant) => {
                                switch (variant) {
                                  case 'holofoil': return <HoloIcon className="w-4 h-4" />;
                                  case 'reverseHolo': return <ReverseHoloIcon className="w-4 h-4" />;
                                  case 'nonHolo': return <NonHoloIcon className="w-4 h-4" />;
                                  default: return null;
                                }
                              };
                              
                              // Format price with comma
                              const formatPrice = (price) => {
                                if (price === null || price === undefined) return null;
                                return price.toFixed(2).replace('.', ',');
                              };
                              
                              const handleVariantChange = (e, newVariant) => {
                                e.stopPropagation(); // Prevent card selection
                                setCardVariants({
                                  ...cardVariants,
                                  [cardKey]: newVariant
                                });
                                
                                // If card is selected, update the selected card's variant
                                if (selected) {
                                  const updatedSelected = selectedCards.map(c => 
                                    c.cardId === cardKey ? { ...c, variant: newVariant } : c
                                  );
                                  setSelectedCards(updatedSelected);
                                }
                              };
                              
                              const handleClick = (e) => {
                                // Prevent native shift+click text selection
                                if (e?.shiftKey) e.preventDefault();
                                const wasSelected = selected;

                                handleCardSelectClick({
                                  card,
                                  idx,
                                  cards,
                                  activeVariant,
                                  event: e
                                });

                                // Reset transform when deselecting (single-card toggles)
                                if (wasSelected && (e.ctrlKey || e.metaKey || (!e.shiftKey && !e.ctrlKey && !e.metaKey))) {
                                  const cardElement = document.querySelector(`[data-card-key="${cardKey}"]`);
                                  if (cardElement) {
                                    const imageContainer = cardElement.querySelector('.card-image-3d');
                                    if (imageContainer) {
                                      imageContainer.style.transform = '';
                                    }
                                  }
                                }
                              };
                              
                              return (
                                <div
                                  key={cardKey}
                                  data-card-key={cardKey}
                                  className={`group relative rounded-xl ${
                                    selected 
                                      ? 'card-selected' 
                                      : ''
                                  }`}
                                  style={{
                                    ...(selected ? { padding: '2px' } : {}),
                                    transformStyle: 'preserve-3d',
                                    backfaceVisibility: 'hidden',
                                    borderRadius: '0.75rem',
                                    transition: selected ? 'padding 0.3s ease' : 'transform 0.3s ease',
                                    transform: selected ? 'none' : 'translate3d(0, 0, 0) scale(1)',
                                    willChange: selected ? 'auto' : 'transform'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!selected) {
                                      e.currentTarget.style.transform = 'translate3d(0, -12px, 0) scale(1.05)';
                                      // Compenseer de schaal op de afbeelding om blur te voorkomen
                                      const imgContainer = e.currentTarget.querySelector('.card-image-3d');
                                      if (imgContainer) {
                                        imgContainer.style.transform = 'translate3d(0, 0, 0) scale(0.95238)'; // 1/1.05
                                      }
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!selected) {
                                      e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1)';
                                      // Reset de afbeelding schaal
                                      const imgContainer = e.currentTarget.querySelector('.card-image-3d');
                                      if (imgContainer) {
                                        imgContainer.style.transform = 'translate3d(0, 0, 0) scale(1)';
                                      }
                                    }
                                  }}
                                >
                                  {/* Background layer with blur - behind entire card, NOT over image */}
                                  <div 
                                    className="absolute inset-0 rounded-xl"
                                    style={{
                                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                      backdropFilter: 'blur(10px)',
                                      WebkitBackdropFilter: 'blur(10px)',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                                      zIndex: 0
                                    }}
                                  />
                                  
                                  {selected && (
                                    <div className="absolute inset-0 bg-red-500/5 dark:bg-red-400/10 z-10 pointer-events-none rounded-xl"></div>
                                  )}
                                  
                                  {/* Heart icon - visible when selected, positioned above everything */}
                                  {selected && (
                                    <div 
                                      className="absolute"
                                      style={{ 
                                        top: '8px',
                                        right: '8px',
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: '#dc2626',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 100,
                                        pointerEvents: 'none',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                      }}
                                    >
                                      <Heart className="w-4 h-4 text-white fill-white" />
                                    </div>
                                  )}
                                  
                                  {/* Card image container - clickable and hoverable - above blur background */}
                                  <div 
                                    className="aspect-[2.5/3.5] flex items-center justify-center p-2 relative cursor-pointer rounded-t-xl"
                                    style={{
                                      transformStyle: 'preserve-3d',
                                      backfaceVisibility: 'hidden',
                                      backgroundColor: 'transparent',
                                      zIndex: 1,
                                      isolation: 'isolate',
                                      transform: 'translate3d(0, 0, 0)',
                                      WebkitTransform: 'translate3d(0, 0, 0)',
                                      willChange: 'transform'
                                    }}
                                    onMouseDown={(e) => {
                                      // Block browser range-selection on shift+click
                                      if (e.shiftKey) e.preventDefault();
                                    }}
                                    onClick={handleClick}
                                    onMouseMove={handleImageMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                  >
                                    {/* Subtle background pattern */}
                                    <div className="absolute inset-0 opacity-5 dark:opacity-10">
                                      <div className="absolute inset-0" style={{
                                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(239,68,68,0.15) 1px, transparent 0)',
                                        backgroundSize: '20px 20px'
                                      }}></div>
                                    </div>
                                    
                                    {/* Rotating card image container with glare as child */}
                                    <div 
                                      className="card-image-3d w-full h-full flex items-center justify-center transition-transform duration-100 relative pointer-events-none"
                                      style={{ 
                                        transformStyle: 'preserve-3d', 
                                        transform: 'translate3d(0, 0, 0) scale(1)',
                                        WebkitTransform: 'translate3d(0, 0, 0) scale(1)',
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden',
                                        willChange: 'transform',
                                        transformOrigin: 'center center',
                                        WebkitTransformOrigin: 'center center'
                                      }}
                                    >
                                      {/* Image wrapper - exact same bounds as image */}
                                      <div 
                                        className="relative"
                                        style={{
                                          maxWidth: '100%',
                                          maxHeight: '100%',
                                          width: 'auto',
                                          height: 'auto',
                                          transform: 'translate3d(0, 0, 0)',
                                          WebkitTransform: 'translate3d(0, 0, 0)',
                                          isolation: 'isolate',
                                          willChange: 'auto',
                                          transformOrigin: 'center center',
                                          WebkitTransformOrigin: 'center center'
                                        }}
                                      >
                                        <img
                                          src={card.images?.large || card.images?.small}
                                          alt={card.cardName}
                                          className="max-w-full max-h-full object-contain relative z-10"
                                          draggable="false"
                                          style={{ 
                                            borderRadius: '0.75rem', 
                                            display: 'block',
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden',
                                            transform: 'translate3d(0, 0, 0) scale(1)',
                                            WebkitTransform: 'translate3d(0, 0, 0) scale(1)',
                                            imageRendering: '-webkit-optimize-contrast',
                                            WebkitFontSmoothing: 'antialiased',
                                            WebkitImageRendering: 'optimize-contrast',
                                            filter: 'none',
                                            WebkitFilter: 'none',
                                            willChange: 'auto',
                                            transformOrigin: 'center center',
                                            WebkitTransformOrigin: 'center center',
                                            imageRendering: 'auto'
                                          }}
                                        />
                                        
                                        {/* 3D Lighting effect - perfectly aligned with image bounds */}
                                        <div 
                                          className="card-shine-3d absolute pointer-events-none"
                                          style={{ 
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            background: 'radial-gradient(circle 150px at var(--light-x, 20%) var(--light-y, 20%), rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.05) 70%, transparent 85%)',
                                            opacity: 0,
                                            zIndex: 15,
                                            borderRadius: '0.75rem',
                                            overflow: 'hidden',
                                            backgroundColor: 'transparent',
                                            mixBlendMode: 'screen',
                                            border: 'none',
                                            outline: 'none'
                                          }}
                                        ></div>
                                        
                                        {/* Holografische reflectie effect - perfectly aligned with image bounds */}
                                        <div 
                                          className="card-holographic-reflect absolute pointer-events-none"
                                          style={{ 
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            zIndex: 16,
                                            borderRadius: '0.75rem',
                                            overflow: 'hidden',
                                            backgroundColor: 'transparent'
                                          }}
                                        ></div>
                                      </div>
                                      
                                      {/* Shimmer effect - only over the image itself */}
                                      {selected && (
                                        <div className="absolute inset-0 shimmer-border z-20 pointer-events-none" style={{ 
                                          width: 'calc(100% - 1rem)', 
                                          height: 'calc(100% - 1rem)',
                                          top: '0.5rem',
                                          left: '0.5rem',
                                          borderRadius: '0.75rem'
                                        }}></div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className={`p-3 bg-gradient-to-br from-white/90 to-white dark:from-gray-800/90 dark:to-gray-900 dark:text-white border-t border-white/20 shadow-sm rounded-b-xl relative ${availableVariants.length > 1 ? 'overflow-hidden' : ''}`} style={{ zIndex: 1, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
                                    {/* Card Title: #Number Name */}
                                    <div className="flex items-center gap-1 mb-1.5">
                                      <p className="font-bold text-xs text-gray-800 dark:text-gray-100 truncate flex-1">
                                        #{card.cardNumber} {card.cardName}
                                      </p>
                                      {variantData && (
                                        <span className="text-xs flex-shrink-0" title={activeVariant}>
                                          {getVariantIcon(activeVariant)}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Variant Toggle */}
                                    {availableVariants.length > 1 && (
                                      <div className="mb-1.5 flex gap-1">
                                        {availableVariants.map((variant) => (
                                          <button
                                            key={variant}
                                            onClick={(e) => handleVariantChange(e, variant)}
                                            className={`flex-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                                              activeVariant === variant
                                                ? 'bg-red-500 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            }`}
                                            title={variant === 'holofoil' ? 'Holofoil' : variant === 'reverseHolo' ? 'Reverse Holo' : 'Non-Holo'}
                                          >
                                            {variant === 'holofoil' ? 'Holo' : variant === 'reverseHolo' ? 'Reverse' : 'Non-Holo'}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {/* Pricing Display - Single Line with Flex Layout */}
                                    {variantData ? (
                                      (() => {
                                        const mainPrice = variantData.market || variantData.mid || variantData.low;
                                        if (!mainPrice) {
                                          return <p className="text-[10px] text-gray-500 dark:text-gray-500">Geen prijsdata</p>;
                                        }
                                        
                                        return (
                                          <div className="flex items-center gap-1.5 flex-wrap text-xs leading-tight">
                                            <span className="font-bold text-red-600 dark:text-red-400">€{formatPrice(mainPrice)}</span>
                                            {(variantData.low || variantData.mid) && (
                                              <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                                                {variantData.low && `low €${formatPrice(variantData.low)}`}
                                                {variantData.low && variantData.mid && ' · '}
                                                {variantData.mid && `mid €${formatPrice(variantData.mid)}`}
                                              </span>
                                            )}
                                            <span className="text-gray-400 dark:text-gray-500 text-[10px] ml-auto">TCGplayer</span>
                                          </div>
                                        );
                                      })()
                                    ) : (
                                      <p className="text-[10px] text-gray-500 dark:text-gray-500">Geen prijsdata</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="card-select-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 relative z-10">
                            {cards.map((card, idx) => {
                              const selected = isCardSelected(card);
                              const cardKey = `${card.setId}-${card.cardId}`;
                              const activeVariant = cardVariants[cardKey] || getDefaultVariant(card) || 'nonHolo';
                              const availableVariants = getAvailableVariants(card);
                              const variantData = getVariantData(card, activeVariant);
                              
                              const getVariantIcon = (variant) => {
                                switch (variant) {
                                  case 'holofoil': return '✨';
                                  case 'reverseHolo': return '🔄';
                                  case 'nonHolo': return '⬜';
                                  default: return '';
                                }
                              };
                              
                              const formatPrice = (price) => {
                                if (price === null || price === undefined) return null;
                                return price.toFixed(2).replace('.', ',');
                              };
                              
                              const handleVariantChange = (e, newVariant) => {
                                e.stopPropagation();
                                setCardVariants({
                                  ...cardVariants,
                                  [cardKey]: newVariant
                                });
                                if (selected) {
                                  const updatedSelected = selectedCards.map(c => 
                                    c.cardId === cardKey ? { ...c, variant: newVariant } : c
                                  );
                                  setSelectedCards(updatedSelected);
                                }
                              };
                              
                              return (
                                <div
                                  key={cardKey}
                                  className={`glass rounded-xl p-3 transition-all ${
                                    selected ? 'ring-2 ring-red-500' : ''
                                  }`}
                                >
                                  <button
                                    onMouseDown={(e) => {
                                      if (e.shiftKey) e.preventDefault();
                                    }}
                                    onClick={(e) => {
                                      handleCardSelectClick({
                                        card,
                                        idx,
                                        cards,
                                        activeVariant,
                                        event: e
                                      });
                                    }}
                                    className="w-full flex items-center gap-2 text-left"
                                  >
                                    <div className="flex-shrink-0 w-5 text-center">
                                      <span className="font-bold text-xs text-gray-800 dark:text-white">
                                        {idx + 1}.
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {/* Card Title: #Number Name */}
                                      <div className="flex items-center gap-1 mb-1">
                                        <p className="font-bold text-xs text-gray-800 dark:text-white truncate flex-1">
                                          #{card.cardNumber} {card.cardName}
                                        </p>
                                        {variantData && (
                                          <span className="text-xs flex-shrink-0">
                                            {getVariantIcon(activeVariant)}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Variant Toggle */}
                                      {availableVariants.length > 1 && (
                                        <div className="mb-1 flex gap-1">
                                          {availableVariants.map((variant) => (
                                            <button
                                              key={variant}
                                              onClick={(e) => handleVariantChange(e, variant)}
                                              className={`flex-1 px-1 py-0.5 rounded text-[9px] font-medium transition-all ${
                                                activeVariant === variant
                                                  ? 'bg-red-500 text-white'
                                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                              }`}
                                            >
                                              {variant === 'holofoil' ? 'H' : variant === 'reverseHolo' ? 'R' : 'N'}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* Pricing Display - Single Line with Flex Layout */}
                                      {variantData ? (
                                        (() => {
                                          const mainPrice = variantData.market || variantData.mid || variantData.low;
                                          if (!mainPrice) {
                                            return <p className="text-[10px] text-gray-500 dark:text-gray-500">Geen prijsdata</p>;
                                          }
                                          
                                          return (
                                            <div className="flex items-center gap-1.5 flex-wrap text-xs leading-tight">
                                              <span className="font-bold text-red-600 dark:text-red-400">€{formatPrice(mainPrice)}</span>
                                              {(variantData.low || variantData.mid) && (
                                                <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                                                  {variantData.low && `low €${formatPrice(variantData.low)}`}
                                                  {variantData.low && variantData.mid && ' · '}
                                                  {variantData.mid && `mid €${formatPrice(variantData.mid)}`}
                                                </span>
                                              )}
                                              <span className="text-gray-400 dark:text-gray-500 text-[10px] ml-auto">TCGplayer</span>
                                            </div>
                                          );
                                        })()
                                      ) : (
                                        <p className="text-[10px] text-gray-500 dark:text-gray-500">Geen prijsdata</p>
                                      )}
                                    </div>
                                    {selected && (
                                      <div className="flex-shrink-0">
                                        <Heart className="w-4 h-4 text-red-600 fill-current" />
                                      </div>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>

          {/* Shop Cards Tab - Smooth transition without flickering */}
          <div className="relative">
            <div 
              className={`transition-opacity duration-200 ease-in-out ${
                activeTab === 'shop' 
                  ? 'opacity-100 relative' 
                  : 'opacity-0 absolute inset-0 pointer-events-none'
              }`}
              style={{ 
                display: activeTab === 'shop' ? 'block' : 'none'
              }}
            >
            {!hasShopCards ? (
              <div className="glass-strong rounded-3xl p-12 text-center">
                <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-4">Geen Winkel Kaarten</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Deze gebruiker heeft nog geen kaarten in de winkel beschikbaar.
                </p>
              </div>
            ) : (
              <div>
                {Object.entries(shopCardsBySet).map(([setId, cards], index) => {
                  const setInfo = setInfoMap[setId] || { id: setId, name: cards[0]?.setName || setId, images: null };
                  
                  return (
                    <div key={setId} className="mb-10 relative">
                      {/* Set Header with Logo and Hamburger Menu - same as purchase */}
                      <div className="glass rounded-2xl p-6 mb-6 relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-4">
                          {/* Set Logo left next to title */}
                          {setInfo.images?.logo && (
                            <div className="relative group series-logo-intro">
                              <img 
                                src={setInfo.images.logo} 
                                alt={setInfo.name} 
                                className="h-14 w-auto relative transform group-hover:scale-105 transition-transform"
                                style={{ position: 'relative', zIndex: 1 }}
                              />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white mb-1">
                              {setInfo.name}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                              <span className="text-purple-600 dark:text-purple-400 font-bold">{cards.length}</span> kaarten
                            </p>
                          </div>
                          
                          {/* Hamburger Menu Button */}
                          <button
                            onClick={() => setOpenSetModal(setId)}
                            className="p-2 glass rounded-lg hover:scale-110 transition-all"
                            title="Set overzicht"
                          >
                            <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Cards Display - Grid or List View - same as purchase */}
                      <div className="relative">
                        {/* Set logo in background of cards section */}
                        {setInfo.images?.logo && (
                          <div className="absolute top-0 right-0 w-1/4 h-1/4 opacity-15 dark:opacity-12 pointer-events-none z-0">
                            <img 
                              src={setInfo.images.logo} 
                              alt="" 
                              className="w-full h-full object-contain object-right-top"
                              style={{ filter: 'brightness(1.2)' }}
                            />
                          </div>
                        )}
                        
                        {mainView === 'grid' ? (
                          <div className={`grid gap-5 relative z-10 ${
                            cardSize === 'small' ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8' :
                            cardSize === 'large' ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
                            'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                          }`}>
                            {cards.map((card) => {
                              const selected = isCardSelected(card);
                              const cardKey = `${card.setId}-${card.cardId}`;
                              
                              const handleImageMouseMove = (e) => {
                                const imageContainer = e.currentTarget;
                                const cardElement = imageContainer.closest('[data-card-key]');
                                if (!cardElement) return;
                                
                                const rect = cardElement.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;
                                
                                const centerX = rect.width / 2;
                                const centerY = rect.height / 2;
                                
                                const rotateX = (y - centerY) / 8;
                                const rotateY = (centerX - x) / 8;
                                
                                const maxRotation = 25;
                                const clampedRotateX = Math.max(-maxRotation, Math.min(maxRotation, rotateX));
                                const clampedRotateY = Math.max(-maxRotation, Math.min(maxRotation, rotateY));
                                
                                const cardImage3d = imageContainer.querySelector('.card-image-3d');
                                if (cardImage3d) {
                                  cardImage3d.style.transition = 'transform 0.1s ease-out';
                                  cardImage3d.style.transform = `
                                    translate3d(0, 0, 0)
                                    perspective(1000px) 
                                    rotateX(${clampedRotateX}deg) 
                                    rotateY(${clampedRotateY}deg)
                                    scale3d(0.95, 0.95, 1)
                                  `;
                                  cardImage3d.style.webkitTransform = `
                                    translate3d(0, 0, 0)
                                    perspective(1000px) 
                                    rotateX(${clampedRotateX}deg) 
                                    rotateY(${clampedRotateY}deg)
                                    scale3d(0.95, 0.95, 1)
                                  `;
                                  cardImage3d.style.willChange = 'transform';
                                  cardImage3d.style.backfaceVisibility = 'hidden';
                                  cardImage3d.style.webkitBackfaceVisibility = 'hidden';
                                  
                                  const shineElement = cardImage3d.querySelector('.card-shine-3d');
                                  if (shineElement) {
                                    const lightX = (x / rect.width) * 100;
                                    const lightY = (y / rect.height) * 100;
                                    const rotationAmount = Math.abs(clampedRotateX) + Math.abs(clampedRotateY);
                                    const intensity = Math.min(0.6, rotationAmount / 25);
                                    
                                    shineElement.style.setProperty('--light-x', `${Math.max(0, Math.min(100, lightX))}%`);
                                    shineElement.style.setProperty('--light-y', `${Math.max(0, Math.min(100, lightY))}%`);
                                    shineElement.style.opacity = rotationAmount > 3 ? intensity.toString() : '0';
                                    shineElement.style.transition = 'opacity 0.15s ease-out';
                                  }
                                  
                                  const holographicElement = cardImage3d.querySelector('.card-holographic-reflect');
                                  if (holographicElement) {
                                    const rotationAmount = Math.abs(clampedRotateX) + Math.abs(clampedRotateY);
                                    
                                    if (rotationAmount > 4) {
                                      const reflectX = 50 + (clampedRotateY * 1.0);
                                      const reflectY = 50 + (clampedRotateX * 1.0);
                                      const reflectAngle = Math.atan2(clampedRotateY, clampedRotateX) * (180 / Math.PI) * 0.3;
                                      const holoIntensity = Math.min(0.25, rotationAmount / 35);
                                      
                                      holographicElement.style.setProperty('--reflect-x', `${Math.max(20, Math.min(80, reflectX))}%`);
                                      holographicElement.style.setProperty('--reflect-y', `${Math.max(20, Math.min(80, reflectY))}%`);
                                      holographicElement.style.setProperty('--reflect-angle', `${reflectAngle}deg`);
                                      holographicElement.style.opacity = holoIntensity.toString();
                                    } else {
                                      holographicElement.style.opacity = '0';
                                    }
                                    holographicElement.style.transition = 'opacity 0.25s ease-out';
                                  }
                                }
                              };
                              
                              const handleMouseLeave = (e) => {
                                const imageContainer = e.currentTarget;
                                const cardImage3d = imageContainer.querySelector('.card-image-3d');
                                if (cardImage3d) {
                                  cardImage3d.style.transition = 'transform 0.3s ease-out';
                                  cardImage3d.style.transform = 'translate3d(0, 0, 0) perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                                  cardImage3d.style.webkitTransform = 'translate3d(0, 0, 0) perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                                  
                                  const shineElement = cardImage3d.querySelector('.card-shine-3d');
                                  if (shineElement) {
                                    shineElement.style.opacity = '0';
                                    shineElement.style.transition = 'opacity 0.3s ease-out';
                                  }
                                  
                                  const holographicElement = cardImage3d.querySelector('.card-holographic-reflect');
                                  if (holographicElement) {
                                    holographicElement.style.opacity = '0';
                                    holographicElement.style.transition = 'opacity 0.3s ease-out';
                                  }
                                }
                              };
                              
                              const activeVariant = cardVariants[cardKey] || getDefaultVariant(card) || 'nonHolo';
                              const availableVariants = getAvailableVariants(card);
                              const variantData = getVariantData(card, activeVariant);
                              
                              const getVariantIcon = (variant) => {
                                switch (variant) {
                                  case 'holofoil': return '✨';
                                  case 'reverseHolo': return '🔄';
                                  case 'nonHolo': return '⬜';
                                  default: return '';
                                }
                              };
                              
                              const formatPrice = (price) => {
                                if (price === null || price === undefined) return null;
                                return price.toFixed(2).replace('.', ',');
                              };
                              
                              const handleVariantChange = (e, newVariant) => {
                                e.stopPropagation();
                                setCardVariants({
                                  ...cardVariants,
                                  [cardKey]: newVariant
                                });
                                
                                if (selected) {
                                  const updatedSelected = selectedCards.map(c => 
                                    c.cardId === cardKey ? { ...c, variant: newVariant } : c
                                  );
                                  setSelectedCards(updatedSelected);
                                }
                              };
                              
                              const handleClick = () => {
                                const wasSelected = selected;
                                
                                if (!wasSelected) {
                                  toggleCardSelection({
                                    ...card,
                                    cardId: cardKey,
                                    variant: activeVariant
                                  });
                                } else {
                                  toggleCardSelection({
                                    ...card,
                                    cardId: cardKey
                                  });
                                }
                                
                                if (wasSelected) {
                                  const cardElement = document.querySelector(`[data-card-key="${cardKey}"]`);
                                  if (cardElement) {
                                    const imageContainer = cardElement.querySelector('.card-image-3d');
                                    if (imageContainer) {
                                      imageContainer.style.transform = '';
                                    }
                                  }
                                }
                              };
                              
                              // Shop card: get user price and TCG price
                              const userPrice = card.price || 0;
                              const tcgMainPrice = variantData?.market || variantData?.mid || variantData?.low;
                              
                              return (
                                <div
                                  key={cardKey}
                                  data-card-key={cardKey}
                                  className={`group relative rounded-xl ${
                                    selected 
                                      ? 'card-selected' 
                                      : ''
                                  }`}
                                  style={{
                                    ...(selected ? { padding: '2px' } : {}),
                                    transformStyle: 'preserve-3d',
                                    backfaceVisibility: 'hidden',
                                    borderRadius: '0.75rem',
                                    transition: selected ? 'padding 0.3s ease' : 'transform 0.3s ease',
                                    transform: selected ? 'none' : 'translate3d(0, 0, 0) scale(1)',
                                    willChange: selected ? 'auto' : 'transform'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!selected) {
                                      e.currentTarget.style.transform = 'translate3d(0, -12px, 0) scale(1.05)';
                                      const imgContainer = e.currentTarget.querySelector('.card-image-3d');
                                      if (imgContainer) {
                                        imgContainer.style.transform = 'translate3d(0, 0, 0) scale(0.95238)';
                                      }
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!selected) {
                                      e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1)';
                                      const imgContainer = e.currentTarget.querySelector('.card-image-3d');
                                      if (imgContainer) {
                                        imgContainer.style.transform = 'translate3d(0, 0, 0) scale(1)';
                                      }
                                    }
                                  }}
                                >
                                  {/* Background layer with blur */}
                                  <div 
                                    className="absolute inset-0 rounded-xl"
                                    style={{
                                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                      backdropFilter: 'blur(10px)',
                                      WebkitBackdropFilter: 'blur(10px)',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                                      zIndex: 0
                                    }}
                                  />
                                  
                                  {selected && (
                                    <div className="absolute inset-0 bg-red-500/5 dark:bg-red-400/10 z-10 pointer-events-none rounded-xl"></div>
                                  )}
                                  
                                  {selected && (
                                    <div 
                                      className="absolute"
                                      style={{ 
                                        top: '8px',
                                        right: '8px',
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: '#dc2626',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 100,
                                        pointerEvents: 'none',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                      }}
                                    >
                                      <Heart className="w-4 h-4 text-white fill-white" />
                                    </div>
                                  )}
                                  
                                  {/* Card image container */}
                                  <div 
                                    className="aspect-[2.5/3.5] flex items-center justify-center p-2 relative cursor-pointer rounded-t-xl"
                                    style={{
                                      transformStyle: 'preserve-3d',
                                      backfaceVisibility: 'hidden',
                                      backgroundColor: 'transparent',
                                      zIndex: 1,
                                      isolation: 'isolate',
                                      transform: 'translate3d(0, 0, 0)',
                                      WebkitTransform: 'translate3d(0, 0, 0)',
                                      willChange: 'transform'
                                    }}
                                    onClick={handleClick}
                                    onMouseMove={handleImageMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                  >
                                    <div className="absolute inset-0 opacity-5 dark:opacity-10">
                                      <div className="absolute inset-0" style={{
                                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(239,68,68,0.15) 1px, transparent 0)',
                                        backgroundSize: '20px 20px'
                                      }}></div>
                                    </div>
                                    
                                    <div 
                                      className="card-image-3d w-full h-full flex items-center justify-center transition-transform duration-100 relative pointer-events-none"
                                      style={{ 
                                        transformStyle: 'preserve-3d', 
                                        transform: 'translate3d(0, 0, 0) scale(1)',
                                        WebkitTransform: 'translate3d(0, 0, 0) scale(1)',
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden',
                                        willChange: 'transform',
                                        transformOrigin: 'center center',
                                        WebkitTransformOrigin: 'center center'
                                      }}
                                    >
                                      <div 
                                        className="relative"
                                        style={{
                                          maxWidth: '100%',
                                          maxHeight: '100%',
                                          width: 'auto',
                                          height: 'auto',
                                          transform: 'translate3d(0, 0, 0)',
                                          WebkitTransform: 'translate3d(0, 0, 0)',
                                          isolation: 'isolate',
                                          willChange: 'auto',
                                          transformOrigin: 'center center',
                                          WebkitTransformOrigin: 'center center'
                                        }}
                                      >
                                        <img
                                          src={card.images?.large || card.images?.small}
                                          alt={card.cardName}
                                          className="max-w-full max-h-full object-contain relative z-10"
                                          draggable="false"
                                          style={{ 
                                            borderRadius: '0.75rem', 
                                            display: 'block',
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden',
                                            transform: 'translate3d(0, 0, 0) scale(1)',
                                            WebkitTransform: 'translate3d(0, 0, 0) scale(1)',
                                            imageRendering: '-webkit-optimize-contrast',
                                            WebkitFontSmoothing: 'antialiased',
                                            WebkitImageRendering: 'optimize-contrast',
                                            filter: 'none',
                                            WebkitFilter: 'none',
                                            willChange: 'auto',
                                            transformOrigin: 'center center',
                                            WebkitTransformOrigin: 'center center',
                                            imageRendering: 'auto'
                                          }}
                                        />
                                        
                                        <div 
                                          className="card-shine-3d absolute pointer-events-none"
                                          style={{ 
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            background: 'radial-gradient(circle 150px at var(--light-x, 20%) var(--light-y, 20%), rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.05) 70%, transparent 85%)',
                                            opacity: 0,
                                            zIndex: 15,
                                            borderRadius: '0.75rem',
                                            overflow: 'hidden',
                                            backgroundColor: 'transparent',
                                            mixBlendMode: 'screen',
                                            border: 'none',
                                            outline: 'none'
                                          }}
                                        ></div>
                                        
                                        <div 
                                          className="card-holographic-reflect absolute pointer-events-none"
                                          style={{ 
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            zIndex: 16,
                                            borderRadius: '0.75rem',
                                            overflow: 'hidden',
                                            backgroundColor: 'transparent'
                                          }}
                                        ></div>
                                      </div>
                                      
                                      {selected && (
                                        <div className="absolute inset-0 shimmer-border z-20 pointer-events-none" style={{ 
                                          width: 'calc(100% - 1rem)', 
                                          height: 'calc(100% - 1rem)',
                                          top: '0.5rem',
                                          left: '0.5rem',
                                          borderRadius: '0.75rem'
                                        }}></div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Card info section - SHOP VERSION with price display */}
                                  <div className={`p-3 bg-gradient-to-br from-white/90 to-white dark:from-gray-800/90 dark:to-gray-900 dark:text-white border-t border-white/20 shadow-sm rounded-b-xl relative ${availableVariants.length > 1 ? 'overflow-hidden' : ''}`} style={{ zIndex: 1, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
                                    {/* Card Title */}
                                    <div className="flex items-center gap-1 mb-1.5">
                                      <p className="font-bold text-xs text-gray-800 dark:text-gray-100 truncate flex-1">
                                        #{card.cardNumber} {card.cardName}
                                      </p>
                                      {variantData && (
                                        <span className="text-xs flex-shrink-0" title={activeVariant}>
                                          {getVariantIcon(activeVariant)}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Variant Toggle - Only show when selected */}
                                    {selected && availableVariants.length > 1 && (
                                      <div className="mb-1.5 flex gap-1">
                                        {availableVariants.map((variant) => (
                                          <button
                                            key={variant}
                                            onClick={(e) => handleVariantChange(e, variant)}
                                            className={`flex-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                                              activeVariant === variant
                                                ? 'bg-red-500 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            }`}
                                            title={variant === 'holofoil' ? 'Holofoil' : variant === 'reverseHolo' ? 'Reverse Holo' : 'Non-Holo'}
                                          >
                                            {variant === 'holofoil' ? 'Holo' : variant === 'reverseHolo' ? 'Reverse' : 'Non-Holo'}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {/* SHOP PRICING DISPLAY: User price on top, TCG price below */}
                                    <div className="space-y-0.5">
                                      {/* User's selling price - larger, prominent */}
                                      <div className="flex items-center">
                                        <span className="font-black text-sm text-purple-600 dark:text-purple-400">
                                          €{formatPrice(userPrice)}
                                        </span>
                                      </div>
                                      
                                      {/* TCG price - smaller, below user price */}
                                      {tcgMainPrice ? (
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                          <span>TCG: €{formatPrice(tcgMainPrice)}</span>
                                          {variantData?.low || variantData?.mid ? (
                                            <span className="text-gray-400 dark:text-gray-500">
                                              ({variantData.low && `low €${formatPrice(variantData.low)}`}
                                              {variantData.low && variantData.mid && ' · '}
                                              {variantData.mid && `mid €${formatPrice(variantData.mid)}`})
                                            </span>
                                          ) : null}
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                          Geen TCG prijsdata
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 relative z-10">
                            {cards.map((card, idx) => {
                              const selected = isCardSelected(card);
                              const cardKey = `${card.setId}-${card.cardId}`;
                              const activeVariant = cardVariants[cardKey] || getDefaultVariant(card) || 'nonHolo';
                              const availableVariants = getAvailableVariants(card);
                              const variantData = getVariantData(card, activeVariant);
                              
                              const getVariantIcon = (variant) => {
                                switch (variant) {
                                  case 'holofoil': return '✨';
                                  case 'reverseHolo': return '🔄';
                                  case 'nonHolo': return '⬜';
                                  default: return '';
                                }
                              };
                              
                              const formatPrice = (price) => {
                                if (price === null || price === undefined) return null;
                                return price.toFixed(2).replace('.', ',');
                              };
                              
                              const handleVariantChange = (e, newVariant) => {
                                e.stopPropagation();
                                setCardVariants({
                                  ...cardVariants,
                                  [cardKey]: newVariant
                                });
                                if (selected) {
                                  const updatedSelected = selectedCards.map(c => 
                                    c.cardId === cardKey ? { ...c, variant: newVariant } : c
                                  );
                                  setSelectedCards(updatedSelected);
                                }
                              };
                              
                              // Shop card: get user price and TCG price
                              const userPrice = card.price || 0;
                              const tcgMainPrice = variantData?.market || variantData?.mid || variantData?.low;
                              
                              return (
                                <div
                                  key={cardKey}
                                  className={`glass rounded-xl p-3 transition-all ${
                                    selected ? 'ring-2 ring-red-500' : ''
                                  }`}
                                >
                                  <button
                                    onClick={() => {
                                      if (!selected) {
                                        toggleCardSelection({
                                          ...card,
                                          cardId: cardKey,
                                          variant: activeVariant
                                        });
                                      } else {
                                        toggleCardSelection({
                                          ...card,
                                          cardId: cardKey
                                        });
                                      }
                                    }}
                                    className="w-full flex items-center gap-2 text-left"
                                  >
                                    <div className="flex-shrink-0 w-5 text-center">
                                      <span className="font-bold text-xs text-gray-800 dark:text-white">
                                        {idx + 1}.
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {/* Card Title: #Number Name */}
                                      <div className="flex items-center gap-1 mb-1">
                                        <p className="font-bold text-xs text-gray-800 dark:text-white truncate flex-1">
                                          #{card.cardNumber} {card.cardName}
                                        </p>
                                        {variantData && (
                                          <span className="text-xs flex-shrink-0">
                                            {getVariantIcon(activeVariant)}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Variant Toggle - Only show when selected */}
                                      {selected && availableVariants.length > 1 && (
                                        <div className="mb-1 flex gap-1">
                                          {availableVariants.map((variant) => (
                                            <button
                                              key={variant}
                                              onClick={(e) => handleVariantChange(e, variant)}
                                              className={`flex-1 px-1 py-0.5 rounded text-[9px] font-medium transition-all ${
                                                activeVariant === variant
                                                  ? 'bg-red-500 text-white'
                                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                              }`}
                                            >
                                              {variant === 'holofoil' ? 'H' : variant === 'reverseHolo' ? 'R' : 'N'}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* SHOP PRICING DISPLAY: User price on top, TCG price below */}
                                      <div className="space-y-0.5">
                                        {/* User's selling price - larger, prominent */}
                                        <div className="flex items-center">
                                          <span className="font-black text-sm text-purple-600 dark:text-purple-400">
                                            €{formatPrice(userPrice)}
                                          </span>
                                        </div>
                                        
                                        {/* TCG price - smaller, below user price */}
                                        {tcgMainPrice ? (
                                          <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                            <span>TCG: €{formatPrice(tcgMainPrice)}</span>
                                            {variantData?.low || variantData?.mid ? (
                                              <span className="text-gray-400 dark:text-gray-500">
                                                ({variantData.low && `low €${formatPrice(variantData.low)}`}
                                                {variantData.low && variantData.mid && ' · '}
                                                {variantData.mid && `mid €${formatPrice(variantData.mid)}`})
                                              </span>
                                            ) : null}
                                          </div>
                                        ) : (
                                          <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                            Geen TCG prijsdata
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {selected && (
                                      <div className="flex-shrink-0">
                                        <Heart className="w-4 h-4 text-red-600 fill-current" />
                                      </div>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </main>

        {/* Side Modal for Set Overview */}
        {openSetModal && (
          <div className="fixed inset-0 z-50 animate-fade-in overflow-hidden">
            {/* Pokemon-style diagonal red/white background - animated */}
            <div 
              className="absolute offer-modal-background"
              style={{
                background: 'repeating-linear-gradient(45deg, #dc2626 0%, #dc2626 12.5%, #ffffff 12.5%, #ffffff 25%)',
                backgroundSize: '40px 40px',
                opacity: 0.95,
                top: '-20%',
                left: '-10%',
                right: '-10%',
                bottom: '-20%',
                width: '120%',
                height: '140%'
              }}
            />
            <div className="absolute inset-0 bg-red-600/80 backdrop-blur-sm" />
            
            <div className="relative flex items-center justify-center p-4 h-full overflow-y-auto">
              <div className="max-w-2xl w-full max-h-[90vh] relative flex flex-col">
                {/* Header outside container to cover border */}
                <div className="bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 rounded-t-3xl p-6 flex items-center justify-between shadow-lg z-20 flex-shrink-0" style={{ borderRadius: '1.5rem 1.5rem 0 0' }}>
                  <div className="flex items-center gap-4 flex-1">
                    {setInfoMap[openSetModal]?.images?.logo && (
                      <img 
                        src={setInfoMap[openSetModal].images.logo} 
                        alt={setInfoMap[openSetModal].name} 
                        className="h-10 w-auto drop-shadow-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">
                        {setInfoMap[openSetModal]?.name || purchaseCardsBySet[openSetModal]?.[0]?.setName || openSetModal}
                      </h2>
                      <p className="text-sm text-white/90 font-medium">
                        {getSetModalCards().length} kaarten
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-1 flex gap-1 border border-white/30">
                      <button
                        onClick={() => setSetModalView('grid')}
                        className={`p-2 rounded transition-all ${
                          setModalView === 'grid' 
                            ? 'bg-white text-red-600 shadow-md' 
                            : 'text-white hover:bg-white/20'
                        }`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSetModalView('list')}
                        className={`p-2 rounded transition-all ${
                          setModalView === 'list' 
                            ? 'bg-white text-red-600 shadow-md' 
                            : 'text-white hover:bg-white/20'
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Copy Button (only in list view) */}
                    {setModalView === 'list' && (
                      <button
                        onClick={copySetList}
                        className="relative p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-all border border-white/30"
                        title="Kopieer lijst"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-white relative z-10" />
                        ) : (
                          <Copy className="w-5 h-5 text-white relative z-10" />
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => setOpenSetModal(null)}
                      className="relative p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-all border border-white/30"
                    >
                      <X className="w-6 h-6 text-white relative z-10" />
                    </button>
                  </div>
                </div>
                
                {/* Content container - scrollable */}
                <div className="glass-strong offer-modal-container rounded-b-3xl flex-1 overflow-y-auto relative shadow-2xl backdrop-blur-2xl" style={{ border: 'none', outline: 'none', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', marginTop: '-1px' }}>
                <div className="p-6 bg-gradient-to-b from-white/95 to-white dark:from-gray-900/95 dark:to-gray-900 relative -mt-px" style={{ marginTop: '-1px' }}>
                {setModalView === 'grid' ? (
                  <div className="card-select-container grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(() => {
                      // Filter cards with prices and sort by highest mid price
                      const cardsWithPrices = getSetModalCards()
                        .filter(card => hasAnyPrice(card))
                        .sort((a, b) => {
                          const aMid = getMidPrice(a, getDefaultVariant(a) || 'nonHolo') || 0;
                          const bMid = getMidPrice(b, getDefaultVariant(b) || 'nonHolo') || 0;
                          return bMid - aMid; // Highest first
                        });
                      
                      return cardsWithPrices.map((card, idx) => {
                        const cardKey = `${card.setId}-${card.cardId}`;
                        const selected = isCardSelected(card);
                        const activeVariant = cardVariants[cardKey] || getDefaultVariant(card) || 'nonHolo';
                        const variantData = getVariantData(card, activeVariant);
                        const availableVariants = getAvailableVariants(card);
                        
                        const getVariantIcon = (variant) => {
                          switch (variant) {
                            case 'holofoil': return <HoloIcon className="w-4 h-4" />;
                            case 'reverseHolo': return <ReverseHoloIcon className="w-4 h-4" />;
                            case 'nonHolo': return <NonHoloIcon className="w-4 h-4" />;
                            default: return null;
                          }
                        };
                        
                        const formatPrice = (price) => {
                          if (price === null || price === undefined) return null;
                          return price.toFixed(2).replace('.', ',');
                        };
                        
                        return (
                          <div
                            key={cardKey}
                            className={`relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden transition-all border-0 shadow-sm ${
                              selected ? 'ring-2 ring-red-500' : 'hover:shadow-md'
                            }`}
                          >
                            {selected && (
                              <div className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 z-10">
                                <Heart className="w-3 h-3 fill-current" />
                              </div>
                            )}
                            <button
                              onMouseDown={(e) => {
                                if (e.shiftKey) e.preventDefault();
                              }}
                              onClick={(e) => {
                                handleCardSelectClick({
                                  card,
                                  idx,
                                  cards: cardsWithPrices,
                                  activeVariant,
                                  event: e
                                });
                              }}
                              className="w-full"
                            >
                              <img
                                src={card.images?.small || card.images?.large}
                                alt={card.cardName}
                                className="w-full h-auto rounded-t"
                                draggable={false}
                              />
                            </button>
                            <div className="p-2">
                              {/* Card Title: #Number Name */}
                              <div className="flex items-center gap-1 mb-1">
                                <p className="font-bold text-xs text-gray-800 dark:text-white truncate flex-1">
                                  #{card.cardNumber} {card.cardName}
                                </p>
                                {variantData && (
                                  <span className="text-xs flex-shrink-0">
                                    {getVariantIcon(activeVariant)}
                                  </span>
                                )}
                              </div>
                              
                              {/* Variant Toggle */}
                              {availableVariants.length > 1 && (
                                <div className="mb-1.5 flex gap-1">
                                  {availableVariants.map((variant) => (
                                    <button
                                      key={variant}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCardVariants({
                                          ...cardVariants,
                                          [cardKey]: variant
                                        });
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                        activeVariant === variant
                                          ? 'bg-red-500 text-white shadow-md'
                                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                      }`}
                                    >
                                      {variant === 'holofoil' ? 'Holofoil' : variant === 'reverseHolo' ? 'Reverse Holo' : 'Non-Holo'}
                                    </button>
                                  ))}
                                </div>
                              )}
                              
                              {/* Pricing Display - Single Line with Flex Layout */}
                              {variantData ? (
                                (() => {
                                  const mainPrice = variantData.market || variantData.mid || variantData.low;
                                  if (!mainPrice) {
                                    return <p className="text-[10px] text-gray-500 dark:text-gray-500">Geen prijsdata</p>;
                                  }
                                  
                                  return (
                                    <div className="flex items-center gap-1.5 flex-wrap text-xs leading-tight">
                                      <span className="font-bold text-red-600 dark:text-red-400">€{formatPrice(mainPrice)}</span>
                                      {(variantData.low || variantData.mid) && (
                                        <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                                          {variantData.low && `low €${formatPrice(variantData.low)}`}
                                          {variantData.low && variantData.mid && ' · '}
                                          {variantData.mid && `mid €${formatPrice(variantData.mid)}`}
                                        </span>
                                      )}
                                      <span className="text-gray-400 dark:text-gray-500 text-[10px] ml-auto">TCGplayer</span>
                                    </div>
                                  );
                                })()
                              ) : (
                                <p className="text-[10px] text-gray-500 dark:text-gray-500">Geen prijsdata</p>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                          <div className="card-select-container space-y-3">
                    {getSetModalCards().map((card, idx) => {
                      const selected = isCardSelected(card);
                      const cardKey = `${card.setId}-${card.cardId}`;
                      const activeVariant = cardVariants[cardKey] || getDefaultVariant(card) || 'nonHolo';
                      const variantData = getVariantData(card, activeVariant);
                      const availableVariants = getAvailableVariants(card);
                      
                      const formatPrice = (price) => {
                        if (price === null || price === undefined) return null;
                        return price.toFixed(2).replace('.', ',');
                      };
                      
                      // Get user price if available
                      const userPrice = card.price || 0;
                      const tcgMainPrice = variantData?.market || variantData?.mid || variantData?.low;
                      
                      return (
                        <div
                          key={cardKey}
                          className={`bg-white dark:bg-gray-800 rounded-xl p-3 border-0 shadow-sm transition-all flex items-center gap-3 ${
                            selected ? 'ring-2 ring-red-500' : 'hover:shadow-md'
                          }`}
                        >
                          <button
                            onMouseDown={(e) => {
                              if (e.shiftKey) e.preventDefault();
                            }}
                            onClick={(e) => {
                              const modalCards = getSetModalCards();
                              handleCardSelectClick({
                                card,
                                idx,
                                cards: modalCards,
                                activeVariant,
                                event: e
                              });
                            }}
                            className="flex-shrink-0 w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-red-500 transition-colors"
                          >
                            {selected && <Check className="w-4 h-4 text-red-500" />}
                          </button>
                          <span className="font-bold text-gray-800 dark:text-white flex-shrink-0">
                            {idx + 1}.
                          </span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-800 dark:text-white truncate">
                              #{card.cardNumber} {card.cardName}
                            </p>
                            {variantData && (
                              <span className="text-xs flex-shrink-0">
                                {activeVariant === 'holofoil' ? <HoloIcon className="w-4 h-4" /> : activeVariant === 'reverseHolo' ? <ReverseHoloIcon className="w-4 h-4" /> : <NonHoloIcon className="w-4 h-4" />}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* User Price (if available) */}
                            {userPrice > 0 ? (
                              <>
                                <span className="font-black text-sm text-red-600 dark:text-red-400 whitespace-nowrap">
                                  €{formatPrice(userPrice)}
                                </span>
                                {tcgMainPrice && (
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    (TCG: €{formatPrice(tcgMainPrice)})
                                  </span>
                                )}
                              </>
                            ) : variantData ? (
                              (() => {
                                const mainPrice = variantData.market || variantData.mid || variantData.low;
                                if (!mainPrice) {
                                  return <span className="text-xs text-gray-500 dark:text-gray-400">Geen prijsdata</span>;
                                }
                                
                                return (
                                  <>
                                    <span className="font-bold text-red-600 dark:text-red-400 text-sm whitespace-nowrap">€{formatPrice(mainPrice)}</span>
                                    {(variantData.low || variantData.mid) && (
                                      <span className="text-gray-500 dark:text-gray-400 text-[10px] whitespace-nowrap">
                                        ({variantData.low && `low €${formatPrice(variantData.low)}`}
                                        {variantData.low && variantData.mid && ' · '}
                                        {variantData.mid && `mid €${formatPrice(variantData.mid)}`})
                                      </span>
                                    )}
                                    <span className="text-gray-400 dark:text-gray-500 text-[10px] whitespace-nowrap">TCGplayer</span>
                                  </>
                                );
                              })()
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">Geen prijsdata</span>
                            )}
                          </div>
                          {selected && (
                            <div className="flex-shrink-0">
                              <Heart className="w-4 h-4 text-red-600 fill-current" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Offer Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 animate-fade-in overflow-hidden">
            {/* Pokemon-style diagonal red/white background - animated */}
            <div 
              className="absolute offer-modal-background"
              style={{
                background: 'repeating-linear-gradient(45deg, #dc2626 0%, #dc2626 12.5%, #ffffff 12.5%, #ffffff 25%)',
                backgroundSize: '40px 40px',
                opacity: 0.95,
                top: '-20%',
                left: '-10%',
                right: '-10%',
                bottom: '-20%',
                width: '120%',
                height: '140%'
              }}
            />
            <div className="absolute inset-0 bg-red-600/80 backdrop-blur-sm" />
            
            <div className="relative flex items-center justify-center p-4 h-full overflow-y-auto">
              <div className="max-w-2xl w-full max-h-[90vh] relative flex flex-col">
                {/* Header outside container to cover border */}
                <div className="bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 rounded-t-3xl p-6 flex items-center justify-between shadow-lg z-20 flex-shrink-0" style={{ borderRadius: '1.5rem 1.5rem 0 0' }}>
                  <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">
                    Aanbieding Versturen
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="relative p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-all border border-white/30"
                  >
                    <X className="w-6 h-6 text-white relative z-10" />
                  </button>
                </div>
                
                {/* Content container - scrollable */}
                <div className="glass-strong offer-modal-container rounded-b-3xl flex-1 overflow-y-auto relative shadow-2xl backdrop-blur-2xl" style={{ border: 'none', outline: 'none', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', marginTop: '-1px' }}>

                <div className="p-6 bg-gradient-to-b from-white/95 to-white dark:from-gray-900/95 dark:to-gray-900 relative -mt-px" style={{ marginTop: '-1px' }}>
                  <div className="mb-6">
                    <h3 className="font-black text-lg mb-4 text-gray-800 dark:text-white">
                      Geselecteerde Kaarten ({selectedCards.length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto mb-4 pr-2">
                      {selectedCards.map((card) => {
                        const cardKey = card.cardId;
                        const condition = cardConditions[cardKey] || 'NM';
                        const price = cardPrices[cardKey] || '';
                        
                        return (
                          <div key={cardKey} className="bg-white dark:bg-gray-800 rounded-xl p-3 border-0 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                              {/* Left side: Title, Input, Condition, Variant */}
                              <div className="flex-1 min-w-0 space-y-2">
                                {/* Title */}
                                <p className="font-bold text-sm text-gray-800 dark:text-white">#{card.cardNumber} {card.cardName}</p>
                                
                                {/* Price Input */}
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    Bedrag <span className="text-red-500">*</span>:
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={price}
                                    onChange={(e) => setCardPrices({...cardPrices, [cardKey]: e.target.value})}
                                    className="w-24 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-xs text-gray-800 dark:text-white bg-white dark:bg-gray-700 transition-all"
                                    placeholder="0.00"
                                  />
                                </div>
                                
                                {/* Condition and Variant on same line */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Condition Buttons */}
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                      Staat:
                                    </label>
                                    {[
                                      { code: 'NM', label: 'NM', tooltip: 'Near Mint - Als nieuw' },
                                      { code: 'EX', label: 'EX', tooltip: 'Excellent - Lichte slijtage aan randen' },
                                      { code: 'GD', label: 'GD', tooltip: 'Good - Zichtbaar gebruikt' },
                                      { code: 'LP', label: 'LP', tooltip: 'Light Played - Veel slijtage, geen vouwen' },
                                      { code: 'DMG', label: 'DMG', tooltip: 'Damaged - Vouwen, scheuren of defect' }
                                    ].map((cond) => (
                                      <div key={cond.code} className="relative group">
                                        <button
                                          type="button"
                                          onClick={() => setCardConditions({...cardConditions, [cardKey]: cond.code})}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                            condition === cond.code
                                              ? 'bg-red-500 text-white shadow-md'
                                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                          }`}
                                        >
                                          {cond.label}
                                        </button>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap">
                                          {cond.tooltip}
                                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                            <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Variant Selection */}
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                      Type:
                                    </label>
                                    {(() => {
                                      const availableVariants = getAvailableVariants(card);
                                      const selectedVariant = card.variant || cardVariants[cardKey] || getDefaultVariant(card) || 'nonHolo';
                                      
                                      const variantLabels = {
                                        'holofoil': 'Holofoil',
                                        'reverseHolo': 'Reverse Holo',
                                        'nonHolo': 'Non-Holo'
                                      };
                                      
                                      return availableVariants.map((variant) => (
                                        <button
                                          key={variant}
                                          type="button"
                                          onClick={() => {
                                            const updatedVariants = {...cardVariants, [cardKey]: variant};
                                            setCardVariants(updatedVariants);
                                            
                                            const cardIndex = selectedCards.findIndex(c => c.cardId === cardKey);
                                            if (cardIndex >= 0) {
                                              const updatedCards = [...selectedCards];
                                              updatedCards[cardIndex] = {...updatedCards[cardIndex], variant};
                                              setSelectedCards(updatedCards);
                                            }
                                          }}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                            selectedVariant === variant
                                              ? 'bg-red-500 text-white shadow-md'
                                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                          }`}
                                          title={variantLabels[variant] || variant}
                                        >
                                          {variantLabels[variant] || variant}
                                        </button>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right side: Price and Card Image */}
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                {(() => {
                                  const cardKey = card.cardId;
                                  const selectedVariant = card.variant || cardVariants[cardKey] || getDefaultVariant(card) || 'nonHolo';
                                  const variantData = getVariantData(card, selectedVariant);
                                  
                                  const formatPrice = (price) => {
                                    if (price === null || price === undefined) return null;
                                    return price.toFixed(2).replace('.', ',');
                                  };
                                  
                                  if (variantData) {
                                    const mainPrice = variantData.market || variantData.mid || variantData.low;
                                    if (mainPrice) {
                                      return (
                                        <div className="flex items-center gap-2 text-right">
                                          <span className="font-bold text-red-600 dark:text-red-400 text-sm">€{formatPrice(mainPrice)}</span>
                                          <span className="text-gray-500 dark:text-gray-400 text-xs">TCGplayer</span>
                                        </div>
                                      );
                                    }
                                  }
                                  return null;
                                })()}
                                
                                {/* Card Image */}
                                <img
                                  src={card.images?.small}
                                  alt={card.cardName}
                                  className="w-14 h-20 object-contain rounded flex-shrink-0"
                                  style={{ border: 'none', outline: 'none' }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  
                  {/* Total Indicative Value */}
                  {selectedCards.length > 0 && (() => {
                    const totalIndicativeValue = selectedCards.reduce((sum, card) => {
                      const cardKey = card.cardId;
                      const variant = card.variant || cardVariants[cardKey] || getDefaultVariant(card) || 'nonHolo';
                      const variantData = getVariantData(card, variant);
                      
                      if (!variantData) return sum;
                      
                      // Use mid price only (fallback to low) - high excluded
                      const price = variantData.mid || variantData.low;
                      
                      return sum + (price !== null && price !== undefined ? price : 0);
                    }, 0);
                    
                    if (totalIndicativeValue > 0) {
                      return (
                        <div className="glass-strong rounded-xl p-4 mt-4">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-800 dark:text-white">Totale indicatieve waarde:</span>
                            <span className="font-black text-2xl text-red-600 dark:text-red-400">
                              €{totalIndicativeValue.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Indicatieve marktwaarde (TCGplayer) - Dit is geen verkoopprijs
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Total Price (User Input) */}
                  {selectedCards.length > 0 && (
                    <div className="glass-strong rounded-xl p-4 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-bold text-gray-800 dark:text-white">Totaalprijs:</span>
                        <span className="font-black text-2xl text-red-600 dark:text-red-400">
                          €{Object.values(cardPrices).reduce((sum, price) => sum + (parseFloat(price) || 0), 0).toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Bon/Overzicht van alle prijzen */}
                      <div className="border-t border-gray-300 dark:border-gray-600 pt-4 mt-4">
                        <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-3">Bon Overzicht:</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedCards.map((card) => {
                            const cardKey = card.cardId;
                            const price = parseFloat(cardPrices[cardKey]) || 0;
                            const condition = cardConditions[cardKey] || 'NM';
                            const variant = card.variant || cardVariants[cardKey] || getDefaultVariant(card) || 'nonHolo';
                            
                            if (price === 0) return null;
                            
                            const conditionLabels = {
                              'NM': 'Near Mint',
                              'EX': 'Excellent',
                              'GD': 'Good',
                              'LP': 'Light Played',
                              'DMG': 'Damaged'
                            };
                            
                            const variantLabels = {
                              'holofoil': 'Holofoil',
                              'reverseHolo': 'Reverse Holo',
                              'nonHolo': 'Non-Holo'
                            };
                            
                            return (
                              <div key={cardKey} className="flex items-center justify-between text-sm py-1 border-b border-gray-200 dark:border-gray-700 last:border-0">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800 dark:text-white">
                                    {card.cardName} #{card.cardNumber}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {conditionLabels[condition] || condition} • {variantLabels[variant] || 'Non-Holo'}
                                  </p>
                                </div>
                                <span className="font-bold text-gray-800 dark:text-white ml-4">
                                  €{price.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmitOffer} className="space-y-5">
                  <div>
                    <label className="block font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">Naam *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl glass border border-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-gray-800 dark:text-white dark:bg-gray-800/50 transition-all"
                      placeholder="Je volledige naam"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl glass border border-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-gray-800 dark:text-white dark:bg-gray-800/50 transition-all"
                      placeholder="je@email.com"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">Telefoonnummer</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl glass border border-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-gray-800 dark:text-white dark:bg-gray-800/50 transition-all"
                      placeholder="+31 6 12345678"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">Opmerkingen</label>
                    <textarea
                      value={formData.offer}
                      onChange={(e) => setFormData({...formData, offer: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl glass border border-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-gray-800 dark:text-white dark:bg-gray-800/50 transition-all resize-none"
                      rows="3"
                      placeholder="Vertel ons over de staat van je kaarten..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="relative w-full bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 text-white px-6 py-4 rounded-full font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Verstuur Aanbod
                    </span>
                  </button>
                </form>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Floating Winkelwagen Button - Always visible when cards selected */}
        {selectedCards.length > 0 && activeTab === 'purchase' && (
          <button
            onClick={() => setShowModal(true)}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-40 group"
          >
            <ShoppingCart className="w-6 h-6 relative z-10" />
            <span className="absolute -top-2 -right-2 bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 text-xs font-black rounded-full w-7 h-7 flex items-center justify-center border-2 border-red-600 dark:border-red-500 shadow-lg">
              {selectedCards.length}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

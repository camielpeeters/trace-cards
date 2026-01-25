'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingCart, X, Heart, Sparkles, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '../../components/ThemeToggle';

export default function PublicUserPage() {
  const params = useParams();
  const username = params.username;

  // Safari cloud visibility fix - Apply styles directly via JavaScript
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const ua = navigator.userAgent || '';
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    
    if (isSafari) {
      // Apply cloud styles directly via JavaScript for Safari
      const style = document.createElement('style');
      style.id = 'safari-clouds-fix';
      style.textContent = `
        .animated-background-container .cloud,
        .animated-background-container .cloud1,
        .animated-background-container .cloud2,
        .animated-background-container .cloud3,
        .animated-background-container .cloud4,
        .animated-background-container .cloud5,
        .animated-background-container .cloud6 {
          display: block !important;
          position: absolute !important;
          background: rgba(255, 255, 255, 0.65) !important;
          border-radius: 100px !important;
          filter: blur(28px) !important;
          -webkit-filter: blur(28px) !important;
          opacity: 0.85 !important;
          will-change: transform !important;
          box-shadow: 0 8px 32px rgba(255, 255, 255, 0.3) !important;
          z-index: -1 !important;
        }
        
        .dark .animated-background-container .cloud,
        .dark .animated-background-container .cloud1,
        .dark .animated-background-container .cloud2,
        .dark .animated-background-container .cloud3,
        .dark .animated-background-container .cloud4,
        .dark .animated-background-container .cloud5,
        .dark .animated-background-container .cloud6 {
          background: rgba(220, 230, 240, 0.45) !important;
          opacity: 0.7 !important;
          box-shadow: 0 8px 32px rgba(200, 210, 220, 0.2) !important;
        }
        
        .animated-background-container .cloud1 {
          width: 450px !important;
          height: 160px !important;
          top: 12% !important;
          left: -200px !important;
          animation: cloud-move 45s linear infinite !important;
        }
        
        .animated-background-container .cloud2 {
          width: 500px !important;
          height: 180px !important;
          top: 32% !important;
          left: -250px !important;
          animation: cloud-move-slow 60s linear infinite !important;
          animation-delay: -20s !important;
        }
        
        .animated-background-container .cloud3 {
          width: 400px !important;
          height: 140px !important;
          top: 6% !important;
          left: -150px !important;
          animation: cloud-move 50s linear infinite !important;
          animation-delay: -40s !important;
        }
        
        .animated-background-container .cloud4 {
          width: 430px !important;
          height: 150px !important;
          top: 48% !important;
          left: -180px !important;
          animation: cloud-move-slow 55s linear infinite !important;
          animation-delay: -10s !important;
        }
        
        .animated-background-container .cloud5 {
          width: 380px !important;
          height: 130px !important;
          top: 22% !important;
          left: -160px !important;
          animation: cloud-move 58s linear infinite !important;
          animation-delay: -35s !important;
        }
        
        .animated-background-container .cloud6 {
          width: 420px !important;
          height: 145px !important;
          top: 58% !important;
          left: -190px !important;
          animation: cloud-move 52s linear infinite !important;
          animation-delay: -25s !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        const existingStyle = document.getElementById('safari-clouds-fix');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, []);
  const [user, setUser] = useState(null);
  const [purchaseCards, setPurchaseCards] = useState([]);
  const [shopCards, setShopCards] = useState([]);
  const [activeTab, setActiveTab] = useState('purchase'); // 'purchase' or 'shop'
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    offer: ''
  });

  useEffect(() => {
    loadUserData();
  }, [username]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load purchase cards
      const purchaseResponse = await fetch(`/api/public/${username}/purchase-cards`);
      if (purchaseResponse.ok) {
        const purchaseData = await purchaseResponse.json();
        setUser(purchaseData.user);
        setPurchaseCards(purchaseData.cards || []);
      }
      
      // Load shop cards
      const shopResponse = await fetch(`/api/public/${username}/shop-cards`);
      if (shopResponse.ok) {
        const shopData = await shopResponse.json();
        setShopCards(shopData.cards || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group cards by set
  const groupCardsBySet = (cards) => {
    const grouped = {};
    cards.forEach(card => {
      if (!grouped[card.setId]) {
        grouped[card.setId] = [];
      }
      grouped[card.setId].push(card);
    });
    return grouped;
  };

  const purchaseCardsBySet = groupCardsBySet(purchaseCards);
  const shopCardsBySet = groupCardsBySet(shopCards);

  const toggleCardSelection = (card) => {
    const isSelected = selectedCards.find(c => c.cardId === `${card.setId}-${card.cardId}`);
    let newSelection;
    
    if (isSelected) {
      newSelection = selectedCards.filter(c => c.cardId !== `${card.setId}-${card.cardId}`);
    } else {
      newSelection = [...selectedCards, {
        ...card,
        cardId: `${card.setId}-${card.cardId}`,
        cardName: card.cardName,
        cardNumber: card.cardNumber,
        images: card.images
      }];
    }
    
    setSelectedCards(newSelection);
  };

  const handleSubmitOffer = (e) => {
    e.preventDefault();
    
    // Here you would send the offer to the API
    // For now, just show an alert
    alert(`Bedankt ${formData.name}! Je aanbod is ontvangen.`);
    
    setShowModal(false);
    setFormData({ name: '', email: '', phone: '', offer: '' });
    setSelectedCards([]);
  };

  const isCardSelected = (card) => {
    return selectedCards.some(c => c.cardId === `${card.setId}-${card.cardId}`);
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
    <div className="min-h-screen font-['Ubuntu',_sans-serif] relative">
      <div className="animated-background-container">
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <div className="cloud cloud3"></div>
      </div>
      
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
              <Link href="/">
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
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white dark:text-red-100 tracking-tight drop-shadow-xl">
                  {user.displayName || user.username}
                </h1>
                <p className="text-sm text-white/90 dark:text-red-200/80 font-medium mt-1">
                  Pokemon Kaarten Collectie
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              {selectedCards.length > 0 && activeTab === 'purchase' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="relative flex items-center gap-2 bg-white dark:bg-red-50 text-red-600 dark:text-red-700 px-5 py-3 rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <ShoppingCart className="w-5 h-5 relative z-10" />
                  <span className="hidden sm:inline relative z-10">Aanbieding</span>
                  <span className="relative z-10 bg-red-600 text-white text-xs font-black rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
                    {selectedCards.length}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          {/* Tabs */}
          <div className="mb-8">
            <div className="glass-strong rounded-2xl p-2 inline-flex gap-2">
              <button
                onClick={() => { setActiveTab('purchase'); setSelectedCards([]); }}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === 'purchase'
                    ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-lg'
                    : 'bg-transparent text-gray-800 dark:text-white hover:bg-white/20'
                }`}
              >
                🛒 Inkoop Kaarten
              </button>
              <button
                onClick={() => { setActiveTab('shop'); setSelectedCards([]); }}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === 'shop'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'bg-transparent text-gray-800 dark:text-white hover:bg-white/20'
                }`}
              >
                💰 Winkel Kaarten
              </button>
            </div>
          </div>

          {/* Purchase Cards Tab */}
          {activeTab === 'purchase' && (
            <>
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
                  {Object.entries(purchaseCardsBySet).map(([setId, cards]) => (
                    <div key={setId} className="mb-10">
                      <div className="glass-strong rounded-2xl p-6 mb-6">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white mb-2">
                          {cards[0]?.setName || setId}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                          <span className="text-red-600 dark:text-red-400 font-bold">{cards.length}</span> kaarten
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {cards.map((card) => {
                          const selected = isCardSelected(card);
                          return (
                            <button
                              key={`${card.setId}-${card.cardId}`}
                              onClick={() => toggleCardSelection(card)}
                              className={`group relative glass rounded-xl overflow-hidden transform transition-all duration-300 ${
                                selected 
                                  ? 'card-selected' 
                                  : 'hover:-translate-y-3 hover:scale-105'
                              }`}
                              style={selected ? { padding: '2px' } : {}}
                            >
                              {selected && (
                                <div className="absolute top-2 right-2 z-30 bg-red-600 text-white rounded-full p-2 shadow-lg">
                                  <Heart className="w-4 h-4 fill-current" />
                                </div>
                              )}
                              
                              <div className="aspect-[2.5/3.5] bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-2 relative overflow-hidden rounded-t-xl">
                                {selected && (
                                  <div className="absolute inset-0 rounded-t-xl shimmer-border z-20"></div>
                                )}
                                <img
                                  src={card.images?.small || card.images?.large}
                                  alt={card.cardName}
                                  className="max-w-full max-h-full object-contain relative z-10"
                                />
                              </div>
                              
                              <div className="p-3 bg-gradient-to-br from-white/90 to-white dark:from-gray-800/90 dark:to-gray-900 dark:text-white backdrop-blur-sm border-t border-white/20 shadow-sm rounded-b-xl">
                                <p className="font-bold text-xs text-gray-800 dark:text-gray-100 truncate mb-1">
                                  {card.cardName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  #{card.cardNumber}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Shop Cards Tab */}
          {activeTab === 'shop' && (
            <>
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
                  {Object.entries(shopCardsBySet).map(([setId, cards]) => (
                    <div key={setId} className="mb-10">
                      <div className="glass-strong rounded-2xl p-6 mb-6">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white mb-2">
                          {cards[0]?.setName || setId}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                          <span className="text-purple-600 dark:text-purple-400 font-bold">{cards.length}</span> kaarten
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {cards.map((card) => (
                          <div
                            key={`${card.setId}-${card.cardId}`}
                            className="group relative glass rounded-xl overflow-hidden transform transition-all duration-300 hover:-translate-y-3 hover:scale-105"
                          >
                            <div className="aspect-[2.5/3.5] bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-2 relative overflow-hidden rounded-t-xl">
                              <img
                                src={card.images?.small || card.images?.large}
                                alt={card.cardName}
                                className="max-w-full max-h-full object-contain relative z-10"
                              />
                            </div>
                            
                            <div className="p-3 bg-gradient-to-br from-white/90 to-white dark:from-gray-800/90 dark:to-gray-900 dark:text-white backdrop-blur-sm border-t border-white/20 shadow-sm rounded-b-xl">
                              <p className="font-bold text-xs text-gray-800 dark:text-gray-100 truncate mb-1">
                                {card.cardName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                                #{card.cardNumber}
                              </p>
                              <p className="font-black text-sm text-purple-600 dark:text-purple-400">
                                €{card.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        {/* Offer Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass-strong rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
              <div className="sticky top-0 glass-dark rounded-t-3xl p-6 flex items-center justify-between border-b border-white/20 z-10">
                <h2 className="text-2xl md:text-3xl font-black text-white dark:text-red-100">
                  Aanbieding Versturen
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="relative p-2 glass rounded-full hover:scale-110 transition-all group"
                >
                  <X className="w-6 h-6 text-white dark:text-red-200 relative z-10" />
                </button>
              </div>

              <div className="p-6 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50">
                <div className="mb-6">
                  <h3 className="font-black text-lg mb-4 text-gray-800 dark:text-white">
                    Geselecteerde Kaarten ({selectedCards.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-2">
                    {selectedCards.map((card) => (
                      <div key={card.cardId} className="glass rounded-xl p-3 flex items-center gap-3">
                        <img
                          src={card.images?.small}
                          alt={card.cardName}
                          className="w-12 h-16 object-contain rounded"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-800 dark:text-white">{card.cardName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">#{card.cardNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
        )}
      </div>
    </div>
  );
}

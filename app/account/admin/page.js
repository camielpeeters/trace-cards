'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, Users, User, ExternalLink, Mail, Calendar, Key, Save, Eye, EyeOff, ShoppingBag, Bug, ArrowLeft, Trash2 } from 'lucide-react';
import { isAuthenticated, logout } from '../../lib/auth';
import Link from 'next/link';
import ThemeToggle from '../../components/ThemeToggle';
import UserProfile from '../../components/UserProfile';
import { 
  getCachedSets, 
  clearSetsCache, 
  isCacheValid,
  getCardsCacheStats,
  clearAllCardsCache,
  clearOldCardsCache
} from '../../lib/storage';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'api', or 'debug'
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiMessage, setApiMessage] = useState({ type: '', text: '' });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setMounted(true);
    
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    // Load API key
    const savedApiKey = localStorage.getItem('pokemonApiKey') || '';
    setApiKey(savedApiKey);
    
    loadUsers();
    loadCurrentUser();
  }, [router]);

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

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/admin/users', {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSaveApiKey = () => {
    setApiMessage({ type: '', text: '' });
    
    if (!apiKey.trim()) {
      setApiMessage({ type: 'error', text: 'API sleutel is verplicht' });
      return;
    }
    
    localStorage.setItem('pokemonApiKey', apiKey.trim());
    setApiMessage({ type: 'success', text: 'API sleutel opgeslagen! De pagina wordt herladen...' });
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

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
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header - Same as /account */}
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
              <Link href="/account">
                <button
                  className="relative p-2 glass rounded-full backdrop-blur-md transition-all hover:scale-110 group flex items-center justify-center mr-2"
                  title="Terug naar Dashboard"
                >
                  <ArrowLeft className="w-5 h-5 text-white dark:text-red-100" />
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
                  Admin Beheer
                </h1>
                <p className="text-sm text-white/90 dark:text-red-200/80 font-medium mt-1">
                  Beheer gebruikers & API configuratie
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {currentUser && (
                <>
                  <Link href={`/${currentUser.username}`}>
                    <button
                      className="relative flex items-center gap-2 bg-white dark:bg-red-50 text-red-600 dark:text-red-700 px-4 py-2 rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all group overflow-hidden"
                      title="Bekijk je publieke inkoop pagina"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <ExternalLink className="w-5 h-5 relative z-10" />
                      <span className="relative z-10 hidden sm:inline">Inkoop</span>
                    </button>
                  </Link>
                  <Link href={`/${currentUser.username}/shop`}>
                    <button
                      className="relative flex items-center gap-2 bg-white dark:bg-red-50 text-red-600 dark:text-red-700 px-4 py-2 rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all group overflow-hidden"
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
          {/* Tabs - Admin Only */}
          <div className="glass-strong rounded-2xl p-1.5 mb-6 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl overflow-hidden">
            <div className="relative flex gap-1">
              {/* Active background indicator */}
              <div 
                className={`absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r shadow-lg transition-all duration-300 ease-out ${
                  activeTab === 'users'
                    ? 'left-1.5 from-blue-500 to-purple-500'
                    : activeTab === 'api'
                    ? 'left-1/3 ml-1.5 from-blue-500 to-purple-500'
                    : 'left-2/3 ml-1.5 from-blue-500 to-purple-500'
                }`}
                style={{ 
                  width: 'calc(33.333% - 6px)',
                }}
              />
              
              <button
                onClick={() => setActiveTab('users')}
                className={`relative z-10 flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 ${
                  activeTab === 'users'
                    ? 'text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Gebruikers Beheer</span>
              </button>
              
              <button
                onClick={() => setActiveTab('api')}
                className={`relative z-10 flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 ${
                  activeTab === 'api'
                    ? 'text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Key className="w-5 h-5" />
                <span>TCG API Koppeling</span>
              </button>
              
              <button
                onClick={() => setActiveTab('debug')}
                className={`relative z-10 flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 ${
                  activeTab === 'debug'
                    ? 'text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Bug className="w-5 h-5" />
                <span>Debug Info</span>
              </button>
            </div>
          </div>

          {/* API Tab Content */}
          {activeTab === 'api' && (
            <div className="glass-strong rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 mb-6">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <Key className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                  Pokemon TCG API Configuratie
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Configureer je Pokemon TCG API sleutel. Deze wordt app-wide gebruikt voor alle API calls.
                </p>
              </div>

              {apiMessage.text && (
                <div className={`mb-4 p-4 rounded-lg ${
                  apiMessage.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-400 text-green-800 dark:text-green-200' 
                    : 'bg-red-50 dark:bg-red-900/30 border-2 border-red-400 text-red-800 dark:text-red-200'
                }`}>
                  {apiMessage.text}
                </div>
              )}

              <div className="mb-6">
                <label className="flex items-center gap-2 text-gray-800 dark:text-white font-bold mb-3">
                  <Key className="w-5 h-5" />
                  API Sleutel
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-4 py-3 glass rounded-xl border border-white/30 dark:border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-12"
                    placeholder="Voer je Pokemon TCG API sleutel in"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    title={showApiKey ? 'Verberg API sleutel' : 'Toon API sleutel'}
                  >
                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Haal je API sleutel op via <a href="https://pokemontcg.io/" target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">pokemontcg.io</a>
                </p>
              </div>

              <button
                onClick={handleSaveApiKey}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-lg font-black shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <Save className="w-5 h-5" />
                API Sleutel Opslaan
              </button>
            </div>
          )}

          {/* Debug Info Tab Content */}
          {activeTab === 'debug' && (
            <div className="space-y-6">
              {/* Debug Informatie */}
              <div className="glass-strong rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                    <Bug className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                    Debug Informatie
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Technische informatie voor debugging en troubleshooting.
                  </p>
                </div>

                <div className="glass rounded-xl p-4 border border-white/30 dark:border-gray-700/50 mb-6">
                  <div className="text-xs space-y-2 font-mono text-gray-800 dark:text-gray-300">
                    <div className="flex items-center justify-between py-1 border-b border-white/20 dark:border-gray-700/30">
                      <span className="text-gray-600 dark:text-gray-400">API Key:</span>
                      <span className={apiKey ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                        {apiKey ? 'Set' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/20 dark:border-gray-700/30">
                      <span className="text-gray-600 dark:text-gray-400">Mounted:</span>
                      <span className={mounted ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                        {mounted ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/20 dark:border-gray-700/30">
                      <span className="text-gray-600 dark:text-gray-400">Loading:</span>
                      <span className={loading ? 'text-yellow-600 dark:text-yellow-400 font-semibold' : 'text-green-600 dark:text-green-400 font-semibold'}>
                        {loading ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/20 dark:border-gray-700/30">
                      <span className="text-gray-600 dark:text-gray-400">Users Count:</span>
                      <span className="text-gray-800 dark:text-gray-200 font-semibold">{users.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600 dark:text-gray-400">Active Tab:</span>
                      <span className="text-gray-800 dark:text-gray-200 font-semibold">{activeTab}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache Configuratie */}
              <div className="glass-strong rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                    Cache Configuratie
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Beheer en monitor cache instellingen en status.
                  </p>
                </div>

                {/* Cache Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
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
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide font-semibold">Sets Cache</p>
                    <p className={`text-lg font-bold ${isCacheValid() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isCacheValid() ? 'Geldig' : 'Ongeldig'}
                    </p>
                  </div>
                </div>

                {/* Cache Actions */}
                <div className="flex gap-2 flex-wrap mb-4">
                  <button
                    onClick={() => {
                      clearOldCardsCache();
                      alert('Oude caches gewist!');
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Oude Cache
                  </button>
                  
                  <button
                    onClick={() => {
                      if (confirm('Weet je zeker dat je ALLE kaarten caches wilt wissen? Dit betekent dat kaarten opnieuw geladen moeten worden.')) {
                        clearAllCardsCache();
                        alert('Alle kaarten caches gewist!');
                      }
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Alle Kaarten Cache
                  </button>
                  
                  <button
                    onClick={() => {
                      if (confirm('Weet je zeker dat je de sets cache wilt wissen?')) {
                        clearSetsCache();
                        alert('Sets cache gewist!');
                      }
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Sets Cache
                  </button>
                  
                  <button
                    onClick={() => {
                      if (confirm('Weet je zeker dat je ALLES wilt wissen (sets + kaarten)?')) {
                        clearSetsCache();
                        clearAllCardsCache();
                        alert('Alle caches gewist! Pagina wordt herladen...');
                        window.location.reload();
                      }
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset Alles
                  </button>
                </div>

                {/* Cache Info */}
                <p className="text-xs text-gray-600 dark:text-gray-400 glass rounded-lg p-3 border border-white/30 dark:border-gray-700/50">
                  Kaarten worden 7 dagen gecached. Sets worden 1 dag gecached. Cache wordt automatisch gewist als deze te oud is.
                </p>
              </div>
            </div>
          )}

          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <>
              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Gebruikers laden...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-20 glass-strong rounded-2xl p-8 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl">
                  <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Geen Gebruikers</h2>
                  <p className="text-gray-600 dark:text-gray-400">Er zijn nog geen geregistreerde gebruikers.</p>
                </div>
              ) : (
                <div className="glass-strong rounded-2xl shadow-xl backdrop-blur-xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 border-b border-white/20 dark:border-gray-700/30">
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                      <Users className="w-6 h-6" />
                      Alle Gebruikers ({users.length})
                    </h2>
                  </div>
                  
                  <div className="divide-y divide-white/10 dark:divide-gray-700/30">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="p-6 hover:bg-white/10 dark:hover:bg-gray-700/20 transition-all"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.displayName || user.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-8 h-8 text-white" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-black text-gray-800 dark:text-white mb-1">
                                {user.displayName || user.username}
                              </h3>
                              <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  <span className="font-medium">@{user.username}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  <span>{user.email}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(user.createdAt).toLocaleDateString('nl-NL', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-black text-red-600 dark:text-red-400">{user._count.purchaseCards}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Inkoop</div>
                              </div>
                              <div className="text-center">
                                <div className="font-black text-purple-600 dark:text-purple-400">{user._count.shopCards}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Winkel</div>
                              </div>
                              <div className="text-center">
                                <div className="font-black text-green-600 dark:text-green-400">{user._count.purchaseOffers}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Aanbiedingen</div>
                              </div>
                              <div className="text-center">
                                <div className="font-black text-blue-600 dark:text-blue-400">{user._count.shopOrders}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Bestellingen</div>
                              </div>
                            </div>
                            
                            {/* Public Page Link */}
                            <Link href={`/${user.username}`}>
                              <button
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span className="hidden sm:inline">Bekijk Pagina</span>
                                <span className="sm:hidden">Open</span>
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

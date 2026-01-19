'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Lock, Shield, Save, Eye, EyeOff, Settings as SettingsIcon, ExternalLink, ShoppingBag, Mail } from 'lucide-react';
import { isAuthenticated, logout } from '../../lib/auth';
import { getAdminCredentials, initAdminCredentials } from '../../lib/storage';
import Link from 'next/link';
import ThemeToggle from '../../components/ThemeToggle';
import UserProfile from '../../components/UserProfile';

export default function Settings() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = isAuthenticated();
      setAuthenticated(auth);
      
      if (!auth) {
        router.push('/login');
        return;
      }

      // Load current user
      loadCurrentUser();

      // Load current credentials
      initAdminCredentials();
      const credentials = getAdminCredentials();
      if (credentials) {
        setUsername(credentials.username || '');
      }
    }
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
          // Check if user is admin (username === 'admin')
          setIsAdmin(data.user?.username?.toLowerCase() === 'admin');
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const handleSave = () => {
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      // Validate
      if (!username.trim()) {
        setMessage({ type: 'error', text: 'Gebruikersnaam is verplicht' });
        setLoading(false);
        return;
      }

      if (newPassword && newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Nieuwe wachtwoorden komen niet overeen' });
        setLoading(false);
        return;
      }

      if (newPassword && newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Wachtwoord moet minimaal 6 tekens lang zijn' });
        setLoading(false);
        return;
      }

      // Get current credentials
      const credentials = getAdminCredentials();
      
      // Update credentials
      const updatedCredentials = {
        username: username.trim(),
        password: newPassword || credentials?.password || 'admin123'
      };

      localStorage.setItem('adminCredentials', JSON.stringify(updatedCredentials));
      
      setMessage({ type: 'success', text: 'Instellingen opgeslagen!' });
      setNewPassword('');
      setConfirmPassword('');
      
      // Reload after a moment
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Fout bij opslaan: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen font-['Ubuntu',_sans-serif] relative">
      {/* Gradient Background */}
      <div className="animated-background-container"></div>

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
                  Settings
                </h1>
                <p className="text-sm text-white/90 dark:text-red-200/80 font-medium mt-1">
                  Beheer je account instellingen
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

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="glass-strong rounded-2xl shadow-xl p-6 md:p-8">
            {/* Success/Error Message */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-400' 
                  : 'bg-red-50 dark:bg-red-900/30 border-2 border-red-400'
              }`}>
                <p className={`font-medium text-sm ${
                  message.type === 'success' 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {message.text}
                </p>
              </div>
            )}

            {/* Username Section */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-gray-800 dark:text-white font-bold mb-3">
                <User className="w-5 h-5" />
                Gebruikersnaam
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 glass rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Gebruikersnaam"
              />
            </div>

            {/* Email Section - Read Only */}
            {currentUser?.email && (
              <div className="mb-6">
                <label className="flex items-center gap-2 text-gray-800 dark:text-white font-bold mb-3">
                  <Mail className="w-5 h-5" />
                  Email Adres
                </label>
                <input
                  type="email"
                  value={currentUser.email}
                  readOnly
                  className="w-full px-4 py-3 glass rounded-xl border border-white/20 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-gray-100/50 dark:bg-gray-800/50 cursor-not-allowed"
                  placeholder="Email adres"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Je email adres kan niet worden gewijzigd
                </p>
              </div>
            )}

            {/* Current Password Section */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-gray-800 dark:text-white font-bold mb-3">
                <Lock className="w-5 h-5" />
                Huidig Wachtwoord
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-12"
                  placeholder="Huidig wachtwoord (optioneel)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Laat leeg om alleen gebruikersnaam te wijzigen
              </p>
            </div>

            {/* New Password Section */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-gray-800 dark:text-white font-bold mb-3">
                <Lock className="w-5 h-5" />
                Nieuw Wachtwoord
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-12"
                  placeholder="Nieuw wachtwoord (optioneel)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Section */}
            {newPassword && (
              <div className="mb-6">
                <label className="flex items-center gap-2 text-gray-800 dark:text-white font-bold mb-3">
                  <Lock className="w-5 h-5" />
                  Bevestig Nieuw Wachtwoord
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 glass rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-12"
                    placeholder="Bevestig nieuw wachtwoord"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Beheer Section Link */}
            <div className="mb-6 pt-6 border-t border-white/20">
              <Link
                href="/account"
                className="flex items-center gap-3 px-4 py-3 glass rounded-xl hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all group mb-3"
              >
                <SettingsIcon className="w-5 h-5 text-gray-800 dark:text-white group-hover:scale-110 transition-transform" />
                <span className="font-medium text-gray-800 dark:text-white">Beheer Dashboard</span>
              </Link>
              
              {/* Admin Beheer Link - Only show if user is admin */}
              {isAdmin && (
                <Link
                  href="/account/admin"
                  className="flex items-center gap-3 px-4 py-3 glass rounded-xl hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all group bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400/50"
                >
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-blue-600 dark:text-blue-400 font-bold">Admin Beheer</span>
                </Link>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 dark:bg-red-500 text-white px-6 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

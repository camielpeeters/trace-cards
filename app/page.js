'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, X, LogIn, UserPlus, ArrowRight, ShoppingBag, Heart } from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';
import UserProfile from './components/UserProfile';
import { isAuthenticated } from './lib/auth';
import { useAuth } from './hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const [authenticated, setAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const auth = isAuthenticated();
    setAuthenticated(auth);
    
    // Redirect to public page if authenticated and user is loaded
    if (auth && user?.username && !authLoading) {
      router.replace(`/${user.username}`);
    }
  }, [user, router, authLoading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || 'Login failed');
        setLoginLoading(false);
        return;
      }

      // Save token and user data
      login(data.token, data.user);
      setAuthenticated(true);
      setShowLoginModal(false);
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Something went wrong. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

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
                  Trace Cards
                </h1>
                <p className="text-sm text-white/90 dark:text-red-200/80 font-medium mt-1">
                  Pokemon Kaarten Verkoop Platform
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              
              {!authenticated ? (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="relative flex items-center gap-1 sm:gap-2 bg-white dark:bg-red-50 text-red-600 dark:text-red-700 px-3 py-2 sm:px-5 sm:py-3 rounded-full font-bold text-sm sm:text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                  <span className="relative z-10 hidden sm:inline">Inloggen</span>
                  <span className="relative z-10 sm:hidden">Login</span>
                </button>
              ) : (
                <UserProfile />
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-16">
            <div className="inline-block mb-8" style={{ overflow: 'visible' }}>
              <img 
                src="/pokeball-icon.png" 
                alt="Pokeball" 
                className="w-32 h-32 filter drop-shadow-2xl"
                style={{ imageRendering: 'crisp-edges', overflow: 'visible', clipPath: 'none' }}
              />
            </div>
            
            <h2 className="text-5xl md:text-7xl font-black text-gray-800 dark:text-white mb-6 drop-shadow-lg">
              Verkoop & Koop
              <br />
              <span className="bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 bg-clip-text text-transparent animate-gradient">
                Pokemon Kaarten
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto font-medium">
              Ontdek duizenden Pokemon kaarten. Verkoop je collectie of koop de kaarten die je zoekt.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => setShowLoginModal(true)}
                className="relative flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 text-white px-8 py-4 rounded-full font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <LogIn className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Begin Nu</span>
                <ArrowRight className="w-5 h-5 relative z-10" />
              </button>
              
              <Link href="/register">
                <button className="relative flex items-center gap-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 px-8 py-4 rounded-full font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all overflow-hidden group border-2 border-red-600 dark:border-red-500">
                  <UserPlus className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Registreer</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="glass-strong rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-3">
                Verkoop Je Kaarten
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Maak je eigen winkel en verkoop je Pokemon kaarten aan andere verzamelaars.
              </p>
            </div>

            <div className="glass-strong rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-3">
                Koop Kaarten
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Blader door duizenden kaarten en vind precies wat je zoekt voor je collectie.
              </p>
            </div>

            <div className="glass-strong rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-3">
                Beheer Je Collectie
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Organiseer je kaarten, maak sets en beheer je inkoop en verkoop.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="glass-strong rounded-3xl p-12 text-center">
            <h3 className="text-3xl md:text-4xl font-black text-gray-800 dark:text-white mb-4">
              Klaar om te beginnen?
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Maak een account aan en start met het verkopen of kopen van Pokemon kaarten vandaag nog!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowLoginModal(true)}
                className="relative flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 text-white px-8 py-4 rounded-full font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <LogIn className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Inloggen</span>
              </button>
              
              <Link href="/register">
                <button className="relative flex items-center gap-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 px-8 py-4 rounded-full font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all border-2 border-red-600 dark:border-red-500">
                  <UserPlus className="w-5 h-5" />
                  <span>Registreer Nu</span>
                </button>
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-strong rounded-3xl max-w-md w-full relative">
            {/* Modal header */}
            <div className="sticky top-0 glass-dark rounded-t-3xl p-6 flex items-center justify-between border-b border-white/20 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-white dark:text-red-100">
                  Inloggen
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginError('');
                  setLoginForm({ username: '', password: '' });
                }}
                className="relative p-2 glass rounded-full hover:scale-110 transition-all group"
              >
                <X className="w-6 h-6 text-white dark:text-red-200 relative z-10" />
              </button>
            </div>

            <div className="p-6 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50">
              {/* Error Message */}
              {loginError && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-xl">
                  <p className="text-red-600 dark:text-red-400 font-medium text-sm">{loginError}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Gebruikersnaam *
                  </label>
                  <input
                    type="text"
                    required
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl glass border border-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-gray-800 dark:text-white dark:bg-gray-800/50 transition-all"
                    placeholder="Gebruikersnaam"
                    disabled={loginLoading}
                  />
                </div>

                <div>
                  <label className="block font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Wachtwoord *
                  </label>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl glass border border-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-gray-800 dark:text-white dark:bg-gray-800/50 transition-all"
                    placeholder="Wachtwoord"
                    disabled={loginLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="relative w-full bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 text-white px-6 py-4 rounded-full font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loginLoading ? 'Inloggen...' : 'Inloggen'}
                  </span>
                </button>
              </form>

              {/* Register Link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Nog geen account?
                </p>
                <Link
                  href="/register"
                  onClick={() => setShowLoginModal(false)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold text-sm underline"
                >
                  Registreer hier
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

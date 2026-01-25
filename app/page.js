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

  // Safari cloud visibility fix - Apply styles directly via JavaScript
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const ua = navigator.userAgent || '';
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    
    if (isSafari) {
      // Function to apply cloud styles
      const applyCloudStyles = () => {
        // First, inject CSS
        let style = document.getElementById('safari-clouds-fix');
        if (!style) {
          style = document.createElement('style');
          style.id = 'safari-clouds-fix';
          document.head.appendChild(style);
        }
        
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
            visibility: visible !important;
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
        
        // Also directly set inline styles on cloud elements as backup
        setTimeout(() => {
          const clouds = document.querySelectorAll('.animated-background-container .cloud');
          clouds.forEach((cloud) => {
            cloud.style.setProperty('display', 'block', 'important');
            cloud.style.setProperty('position', 'absolute', 'important');
            cloud.style.setProperty('background', 'rgba(255, 255, 255, 0.65)', 'important');
            cloud.style.setProperty('border-radius', '100px', 'important');
            cloud.style.setProperty('filter', 'blur(28px)', 'important');
            cloud.style.setProperty('-webkit-filter', 'blur(28px)', 'important');
            cloud.style.setProperty('opacity', '0.85', 'important');
            cloud.style.setProperty('will-change', 'transform', 'important');
            cloud.style.setProperty('box-shadow', '0 8px 32px rgba(255, 255, 255, 0.3)', 'important');
            cloud.style.setProperty('z-index', '-1', 'important');
            cloud.style.setProperty('visibility', 'visible', 'important');
          });
        }, 100);
      };
      
      // Apply immediately and also after DOM is ready
      applyCloudStyles();
      setTimeout(applyCloudStyles, 100);
      setTimeout(applyCloudStyles, 500);
      
      // Also listen for DOM changes
      const observer = new MutationObserver(() => {
        applyCloudStyles();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      
      return () => {
        observer.disconnect();
        const existingStyle = document.getElementById('safari-clouds-fix');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, []);

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
      <div className="animated-background-container">
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <div className="cloud cloud3"></div>
        <div className="cloud cloud4"></div>
        <div className="cloud cloud5"></div>
        <div className="cloud cloud6"></div>
      </div>
      
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
          
          <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 lg:py-6 flex items-center justify-between">
            {/* Mobile: Pokeball + Titel (geen TCG logo) */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <img 
                src="/pokeball-icon.png" 
                alt="Pokeball" 
                className="w-6 h-6 sm:w-8 md:w-10 lg:w-12 h-auto filter drop-shadow-lg"
                style={{ imageRendering: 'crisp-edges' }}
              />
              <div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black text-white dark:text-red-100 tracking-tight drop-shadow-xl">
                  Trace Cards
                </h1>
                {/* Slogan alleen op desktop */}
                <p className="hidden md:block text-sm text-white/90 dark:text-red-200/80 font-medium mt-1">
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

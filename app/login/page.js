'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Save token and user data
      login(data.token, data.user);
      
      // Redirect to home
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen font-['Ubuntu',_sans-serif] relative flex items-center justify-center p-4">
        <div className="glass-strong rounded-3xl p-12 max-w-md text-center">
          <Sparkles className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-['Ubuntu',_sans-serif] relative flex items-center justify-center p-4">
      <div className="animated-background-container"></div>

      <div className="relative z-10 glass-strong rounded-3xl shadow-2xl max-w-md w-full border-4 border-red-400 dark:border-red-600">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800 p-6 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white">Login</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50">
          <div className="text-center mb-6">
            <Sparkles className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Log in om je account te beheren
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-xl">
              <p className="text-red-600 dark:text-red-400 font-medium text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">
                Gebruikersnaam *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-gray-800 dark:text-white dark:bg-gray-800/50 transition-all"
                placeholder="Gebruikersnaam"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">
                Wachtwoord *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-gray-800 dark:text-white dark:bg-gray-800/50 transition-all"
                placeholder="Wachtwoord"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 text-white px-6 py-4 rounded-full font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Inloggen...' : 'Inloggen'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              Nog geen account?
            </p>
            <Link
              href="/register"
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold text-sm underline"
            >
              Registreer hier
            </Link>
          </div>

          {/* Setup Admin Link - REMOVED for security (admin already created) */}

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium text-sm underline"
            >
              ← Terug naar homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

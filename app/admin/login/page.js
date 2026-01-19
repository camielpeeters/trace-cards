'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, X } from 'lucide-react';
import { login, isAuthenticated } from '../../lib/auth';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/account');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = login(username, password);
      
      if (result.success) {
        router.push('/account');
      } else {
        setError(result.error || 'Inloggen mislukt');
      }
    } catch (err) {
      setError('Er is een fout opgetreden. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-red-50 font-['Ubuntu',_sans-serif] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-4 border-blue-400">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-2xl font-black text-white">Admin Login</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <Sparkles className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              Log in om de admin dashboard te beheren
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-400 rounded-xl">
              <p className="text-red-600 font-medium text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium text-sm mb-2 text-gray-700">
                Gebruikersnaam *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 font-normal"
                placeholder="Gebruikersnaam"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block font-medium text-sm mb-2 text-gray-700">
                Wachtwoord *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 font-normal"
                placeholder="Wachtwoord"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-full font-medium text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Inloggen...' : 'Inloggen'}
            </button>
          </form>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800 font-medium text-sm underline"
            >
              ← Terug naar homepage
            </button>
          </div>

          {/* Default Credentials Info (development only) */}
          <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl">
            <p className="text-xs text-gray-600 font-medium text-center">
              <strong>Development:</strong> Default credentials zijn{' '}
              <code className="bg-white px-2 py-1 rounded font-mono text-xs">admin / admin123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Save, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function SetupAdmin() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [email, setEmail] = useState('admin@admin.local');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      // Validation
      if (!username.trim()) {
        setMessage({ type: 'error', text: 'Gebruikersnaam is verplicht' });
        setLoading(false);
        return;
      }

      if (!password) {
        setMessage({ type: 'error', text: 'Wachtwoord is verplicht' });
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'Wachtwoorden komen niet overeen' });
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setMessage({ type: 'error', text: 'Wachtwoord moet minimaal 6 tekens lang zijn' });
        setLoading(false);
        return;
      }

      // Call API to create/update admin
      let response;
      try {
        response = await fetch('/api/auth/setup-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        setMessage({ type: 'error', text: 'Kan niet verbinden met server. Controleer of de server draait.' });
        setLoading(false);
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        
        // Try to extract error message from HTML
        const errorMatch = text.match(/<title>(.*?)<\/title>/i) || text.match(/Error: (.*?)(?:\n|<)/i);
        const errorMsg = errorMatch ? errorMatch[1] : 'Server error - check console for details';
        
        setMessage({ type: 'error', text: `Server error: ${errorMsg}. Controleer de server logs.` });
        setLoading(false);
        return;
      }

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        setMessage({ type: 'error', text: 'Ongeldige response van server' });
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Fout bij aanmaken admin' });
        setLoading(false);
        return;
      }

      setMessage({ type: 'success', text: data.message || 'Admin gebruiker aangemaakt/geüpdatet!' });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Fout bij opslaan: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-['Ubuntu',_sans-serif] relative flex items-center justify-center p-4">
      <div className="animated-background-container">
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <div className="cloud cloud3"></div>
      </div>

      <div className="relative z-10 glass-strong rounded-3xl shadow-2xl max-w-md w-full border-4 border-red-400 dark:border-red-600">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800 p-6 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white">Admin Setup</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50">
          <div className="text-center mb-6">
            <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">
              Maak of update de admin gebruiker in de database
            </p>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`mb-4 p-4 rounded-xl ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-400' 
                : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-400'
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

          {/* Form */}
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
                placeholder="admin"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-gray-800 dark:text-white dark:bg-gray-800/50 transition-all"
                placeholder="admin@admin.local"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">
                Wachtwoord *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass border border-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-gray-800 dark:text-white dark:bg-gray-800/50 transition-all pr-12"
                  placeholder="Nieuw wachtwoord"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">
                Bevestig Wachtwoord *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass border border-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-gray-800 dark:text-white dark:bg-gray-800/50 transition-all pr-12"
                  placeholder="Bevestig wachtwoord"
                  disabled={loading}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 text-white px-6 py-4 rounded-full font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Opslaan...' : 'Admin Aanmaken/Updaten'}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium text-sm underline"
            >
              ← Terug naar login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

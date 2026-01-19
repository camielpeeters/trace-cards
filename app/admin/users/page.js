'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, Home, Users, User, ExternalLink, Mail, Calendar } from 'lucide-react';
import { isAuthenticated, logout } from '../../lib/auth';
import Link from 'next/link';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    loadUsers();
  }, [router]);

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
    router.push('/admin/login');
  };

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-red-50 font-['Ubuntu',_sans-serif]">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-lg">
                Admin - Gebruikers Beheer
              </h1>
              <p className="text-xs text-white/80 font-medium">Overzicht van alle geregistreerde gebruikers</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <button
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all"
                title="Naar Beheer"
              >
                <Home className="w-5 h-5 text-white" />
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg backdrop-blur-sm transition-all font-medium text-white"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Uitloggen</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Gebruikers laden...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-800 mb-2">Geen Gebruikers</h2>
            <p className="text-gray-600">Er zijn nog geen geregistreerde gebruikers.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border-4 border-blue-400 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <Users className="w-6 h-6" />
                Alle Gebruikers ({users.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-6 hover:bg-gray-50 transition-all"
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
                        <h3 className="text-xl font-black text-gray-800 mb-1">
                          {user.displayName || user.username}
                        </h3>
                        <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600">
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
                          <div className="font-black text-red-600">{user._count.purchaseCards}</div>
                          <div className="text-xs text-gray-500">Inkoop</div>
                        </div>
                        <div className="text-center">
                          <div className="font-black text-purple-600">{user._count.shopCards}</div>
                          <div className="text-xs text-gray-500">Winkel</div>
                        </div>
                        <div className="text-center">
                          <div className="font-black text-green-600">{user._count.purchaseOffers}</div>
                          <div className="text-xs text-gray-500">Aanbiedingen</div>
                        </div>
                        <div className="text-center">
                          <div className="font-black text-blue-600">{user._count.shopOrders}</div>
                          <div className="text-xs text-gray-500">Bestellingen</div>
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
      </main>
    </div>
  );
}

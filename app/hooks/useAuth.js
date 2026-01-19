'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  const login = (token, userData) => {
    localStorage.setItem('authToken', token);
    setUser(userData);
  };
  
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    router.push('/');
  };
  
  const requireAuth = () => {
    if (!loading && !user) {
      router.push('/login');
    }
  };
  
  return { user, loading, login, logout, requireAuth };
};

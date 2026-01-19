'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { User, LogOut, Settings, ChevronDown, LayoutDashboard, Shield } from 'lucide-react';
import { isAuthenticated, logout } from '../lib/auth';

export default function UserProfile() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const auth = isAuthenticated();
      setAuthenticated(auth);
      
      // Check if user is admin - only once when authenticated
      if (auth) {
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
              setIsAdmin(data.user?.username?.toLowerCase() === 'admin');
            }
          }
        } catch (error) {
          // Silent fail
        }
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAuth();
    
    // Only check on storage events (other tabs login/logout) - no polling
    const handleStorageChange = (e) => {
      if (e.key === 'authToken') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Calculate dropdown position
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right
        });
      }
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setIsOpen(false);
    router.push('/');
  };

  const handleSettings = () => {
    setIsOpen(false);
    router.push('/account/settings');
  };

  const handleBeheer = () => {
    setIsOpen(false);
    router.push('/account');
  };

  const handleAdmin = () => {
    setIsOpen(false);
    router.push('/account/admin');
  };

  if (!authenticated) {
    return null;
  }

  const dropdownContent = isOpen && mounted && createPortal(
    <div
      ref={dropdownRef}
      className="fixed w-48 glass-strong rounded-xl shadow-xl border border-white/20 overflow-hidden z-[100] animate-fade-in"
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`
      }}
    >
      <div className="p-2">
        <button
          onClick={handleBeheer}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
            pathname === '/account' || pathname === '/beheer'
              ? 'bg-white/30 dark:bg-gray-700/50 border border-white/40'
              : 'hover:bg-white/20 dark:hover:bg-gray-700/30'
          }`}
          title="Beheer Dashboard"
        >
          <LayoutDashboard className="w-5 h-5 text-gray-800 dark:text-white" />
          <span className="font-medium text-gray-800 dark:text-white">Dashboard</span>
        </button>
        <button
          onClick={handleSettings}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
            pathname === '/account/settings'
              ? 'bg-white/30 dark:bg-gray-700/50 border border-white/40'
              : 'hover:bg-white/20 dark:hover:bg-gray-700/30'
          }`}
          title="Instellingen"
        >
          <Settings className="w-5 h-5 text-gray-800 dark:text-white" />
          <span className="font-medium text-gray-800 dark:text-white">Instellingen</span>
        </button>
        {isAdmin && (
          <button
            onClick={handleAdmin}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
              pathname === '/account/admin'
                ? 'bg-blue-500/30 dark:bg-blue-400/30 border border-blue-400/50'
                : 'hover:bg-white/20 dark:hover:bg-gray-700/30'
            }`}
            title="Admin Beheer"
          >
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-600 dark:text-blue-400 font-bold">Admin Beheer</span>
          </button>
        )}
        <div className="border-t border-white/20 dark:border-gray-700/30 my-1"></div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/20 dark:hover:bg-red-400/20 transition-all text-left"
          title="Uitloggen"
        >
          <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="font-medium text-red-600 dark:text-red-400">Uitloggen</span>
        </button>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <div className="relative" ref={buttonRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-3 glass rounded-xl backdrop-blur-md transition-all hover:scale-110 group flex items-center gap-2"
          title="User Profile"
        >
          <User className="w-5 h-5 text-gray-800 dark:text-red-200" />
          <ChevronDown className={`w-4 h-4 text-gray-800 dark:text-red-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {dropdownContent}
    </>
  );
}

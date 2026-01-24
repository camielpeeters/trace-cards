'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, ShoppingCart, X, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';

export default function NotificationTray({ authenticated, pendingOffersCount, onLoadNotifications }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const trayRef = useRef(null);

  // Close tray when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (trayRef.current && !trayRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Load notifications when tray opens
  useEffect(() => {
    if (isOpen && authenticated) {
      loadNotifications();
    }
  }, [isOpen, authenticated]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const [purchaseRes, shopRes] = await Promise.all([
        fetch('/api/user/purchase-offers', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/user/shop-orders', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const allNotifications = [];

      if (purchaseRes.ok) {
        const { offers } = await purchaseRes.json();
        const pendingOffers = offers.filter(o => 
          o.status && o.status.toUpperCase() === 'PENDING'
        );
        pendingOffers.forEach(offer => {
          allNotifications.push({
            id: `purchase-${offer.id}`,
            type: 'purchase',
            title: 'Nieuwe inkoop aanbieding',
            message: `${offer.visitorName || 'Onbekende bezoeker'} heeft een aanbieding gedaan`,
            date: offer.createdAt,
            link: '/account',
            tab: 'orders'
          });
        });
      }

      if (shopRes.ok) {
        const { orders } = await shopRes.json();
        const pendingOrders = orders.filter(o => 
          o.status && o.status.toLowerCase() === 'pending'
        );
        pendingOrders.forEach(order => {
          allNotifications.push({
            id: `shop-${order.id}`,
            type: 'shop',
            title: 'Nieuwe verkoop bestelling',
            message: `${order.customerName || 'Onbekende klant'} heeft een bestelling geplaatst`,
            date: order.createdAt,
            link: '/account',
            tab: 'orders'
          });
        });
      }

      // Sort by date (newest first)
      allNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    // Set the active tab in localStorage
    localStorage.setItem('dashboardActiveTab', notification.tab);
    setIsOpen(false);
  };

  if (!authenticated || pendingOffersCount === 0) {
    return null;
  }

  return (
    <div className="relative" ref={trayRef} style={{ zIndex: 9999 }}>
      {/* Notification Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 sm:p-3 glass rounded-lg sm:rounded-xl backdrop-blur-md transition-all hover:scale-110 group"
        title={`${pendingOffersCount} nieuwe ${pendingOffersCount === 1 ? 'notificatie' : 'notificaties'}`}
      >
        <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white dark:text-red-200 relative z-10" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg animate-pulse">
          {pendingOffersCount > 9 ? '9+' : pendingOffersCount}
        </span>
      </button>

      {/* Notification Tray Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-strong rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 backdrop-blur-xl overflow-hidden" style={{ zIndex: 9999 }}>
          <div className="p-4 border-b border-white/10 dark:border-gray-700/30 flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">
              Notificaties
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 dark:hover:bg-gray-700/30 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Laden...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Geen notificaties
              </div>
            ) : (
              <div className="divide-y divide-white/10 dark:divide-gray-700/30">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.link}
                    onClick={() => handleNotificationClick(notification)}
                    className="block p-4 hover:bg-white/20 dark:hover:bg-gray-700/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        notification.type === 'purchase' 
                          ? 'bg-red-500/20 dark:bg-red-500/30' 
                          : 'bg-purple-500/20 dark:bg-purple-500/30'
                      }`}>
                        {notification.type === 'purchase' ? (
                          <ShoppingCart className="w-4 h-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 dark:text-white mb-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(notification.date).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/10 dark:border-gray-700/30">
              <Link
                href="/account"
                onClick={() => {
                  localStorage.setItem('dashboardActiveTab', 'orders');
                  setIsOpen(false);
                }}
                className="block text-center text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                Bekijk alle notificaties
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

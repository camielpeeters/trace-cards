'use client';

import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check initial dark mode state
    const checkDarkMode = () => {
      return document.documentElement.classList.contains('dark');
    };
    
    setDarkMode(checkDarkMode());

    // Observe changes to dark mode class
    const observer = new MutationObserver(() => {
      setDarkMode(checkDarkMode());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return { darkMode, mounted };
}

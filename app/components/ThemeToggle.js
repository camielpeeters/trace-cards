'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { darkMode, setDarkMode, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full glass flex items-center justify-center">
        <div className="w-5 h-5 rounded-full bg-gray-400 animate-pulse" />
      </div>
    );
  }

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="relative w-12 h-12 rounded-full glass flex items-center justify-center transition-all hover:scale-110 group"
      aria-label="Toggle dark mode"
    >
      <Sun 
        className={`absolute w-5 h-5 text-yellow-500 transition-all duration-300 ${
          darkMode ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`} 
      />
      <Moon 
        className={`absolute w-5 h-5 text-blue-300 transition-all duration-300 ${
          darkMode ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`} 
      />
    </button>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InstallLayout({ children }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkInstalled = async () => {
      try {
        const response = await fetch('/api/install/is-installed');
        const data = await response.json();
        
        if (data.installed) {
          // Already installed, redirect to login
          router.push('/login');
        } else {
          setChecking(false);
        }
      } catch (error) {
        // Error checking, allow access
        setChecking(false);
      }
    };

    checkInstalled();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Checking installation status...</p>
        </div>
      </div>
    );
  }

  return children;
}

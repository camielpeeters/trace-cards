'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Settings() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to account/settings
    router.replace('/account/settings');
  }, [router]);
  
  return null;
}

'use client';

import { ThemeProvider } from './ThemeProvider';
import CloudBackground from './CloudBackground';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <CloudBackground />
      {children}
    </ThemeProvider>
  );
}

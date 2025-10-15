'use client';

import { useEffect } from 'react';
import { initializeTheme } from '../lib/theme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeTheme();
    
    const handleThemeChange = () => {
      setTimeout(() => initializeTheme(), 0);
    };
    
    window.addEventListener('theme-changed', handleThemeChange);
    
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => {
        const themePreference = localStorage.getItem('theme-preference');
        if (themePreference === 'system' || !themePreference) {
          initializeTheme();
        }
      };
      
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      return () => {
        window.removeEventListener('theme-changed', handleThemeChange);
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
    
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
    };
  }, []);

  return <>{children}</>;
}
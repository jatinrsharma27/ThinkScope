'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';
import SearchBar from './SearchBar';

export default function Navbar() {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null } | null>(null);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'signin' | 'signup' }>({ isOpen: false, mode: 'signin' });
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
    
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('theme');
      const isDarkMode = currentTheme === 'dark' || (!currentTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(isDarkMode);
    };
    
    window.addEventListener('theme-changed', handleThemeChange);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session?.user);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    // Function to fetch user profile
    const fetchUserProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session?.user);
      if (session?.user) {
        setAuthModal({ isOpen: false, mode: 'signin' });
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('theme-changed', handleThemeChange);
      document.removeEventListener('mousedown', handleClickOutside);
      subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    setIsDark(newTheme);
  };

  return (
    <nav className={`sticky top-0 z-50 px-6 py-4 transition-all duration-300 ${isScrolled
        ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm'
        : 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700'
      }`}>
      <div className="flex items-center justify-between">
        <a href="/" className="text-2xl font-bold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer">
          ThinkScope
        </a>

        {/* Desktop search bar */}
        <div className={`hidden md:flex items-center rounded-full px-4 py-2 w-[500px] lg:w-[600px] xl:w-[700px] transition-all duration-300 ${isScrolled
            ? 'bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-600/50'
            : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600'
          }`}>
          <SearchBar className="flex-1" />
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile search icon */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className={`md:hidden w-8 h-8 rounded-full cursor-pointer flex items-center justify-center transition-all duration-300 ${isScrolled
                ? 'bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-200/80 dark:hover:bg-gray-700/80'
                : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {isLoggedIn ? (
            /* Profile circle when logged in */
            <div className="relative">
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 bg-gray-800 rounded-full cursor-pointer flex items-center justify-center"
              >
                <span className="text-white text-sm font-medium">
                  {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                    <div className="font-medium">{userProfile?.full_name || 'User'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 break-words">{user?.email}</div>
                  </div>

                  <a href="/saved" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Saved</a>
                  <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Settings</a>

                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Log out
                  </button>
                </div>
                </div>
              )}
            </div>
          ) : (
            /* Sign in button when not logged in */
            <button
              onClick={() => setAuthModal({ isOpen: true, mode: 'signin' })}
              className={`px-4 py-2 text-white rounded-md text-sm font-medium transition-all duration-300 ${isScrolled
                  ? 'bg-gray-800/90 backdrop-blur-md hover:bg-gray-700/90'
                  : 'bg-gray-800 hover:bg-gray-700'
                }`}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      {isMobileSearchOpen && (
        <div className={`md:hidden mt-4 flex items-center rounded-full px-4 py-2 transition-all duration-300 ${isScrolled
            ? 'bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-600/50'
            : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600'
          }`}>
          <SearchBar className="flex-1" />
        </div>
      )}

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        mode={authModal.mode}
        onModeChange={(mode) => setAuthModal({ ...authModal, mode })}
      />
    </nav>
  );
}
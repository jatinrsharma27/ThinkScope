export const initializeTheme = () => {
  if (typeof window === 'undefined') return;
  
  const themePreference = localStorage.getItem('theme-preference') || 'system';
  const savedTheme = localStorage.getItem('theme');
  
  document.documentElement.classList.remove('dark');
  
  if (themePreference === 'dark' || savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (themePreference === 'light' || savedTheme === 'light') {
    // Already removed above
  } else {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }
};
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initial state reads directly from the HTML class set by index.html script
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    // Listen for cross-tab or external changes just in case, though toggleTheme handles it internally
    const handleThemeChange = (event) => {
      if (event.detail && typeof event.detail.theme !== 'undefined') {
        setIsDarkMode(event.detail.theme === 'dark');
      }
    };
    
    // Also listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      const mode = localStorage.getItem('mode') || localStorage.getItem('theme');
      if (!mode) { // Only override if user hasn't explicitly set a preference
        const isDark = e.matches;
        setIsDarkMode(isDark);
        document.documentElement.classList.toggle('dark', isDark);
        document.body.classList.toggle('dark-mode', isDark);
      }
    };

    window.addEventListener('themeChange', handleThemeChange);
    mediaQuery.addEventListener('change', handleSystemChange);
    
    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    
    // Save preference uniformly
    localStorage.setItem('mode', nextTheme);
    localStorage.setItem('theme', nextTheme);
    
    // Update DOM classes for Tailwind and App.css
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.body.classList.toggle('dark-mode', nextTheme === 'dark');
    
    // Dispatch for any legacy listeners
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: nextTheme } }));
  };

  const setTheme = (themeStr) => {
     const isDark = themeStr === 'dark';
     if (isDarkMode !== isDark) {
         toggleTheme();
     }
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

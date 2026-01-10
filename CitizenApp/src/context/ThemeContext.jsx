import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Color scheme: White+Green (light) / Black+White/Green (dark)
  const theme = {
    darkMode,
    toggleDarkMode,
    colors: darkMode ? {
      // Dark mode colors
      background: 'bg-gray-900',
      backgroundSecondary: 'bg-gray-800',
      surface: 'bg-gray-800',
      text: 'text-white',
      textSecondary: 'text-gray-400',
      primary: 'bg-green-600',
      primaryHover: 'hover:bg-green-700',
      primaryText: 'text-green-400',
      border: 'border-gray-700',
      card: 'bg-gray-800',
      cardHover: 'hover:bg-gray-700',
      hover: 'hover:bg-gray-700',
      navbar: 'bg-gray-900',
      accent: 'text-green-400',
      input: 'bg-gray-700',
      gradient: 'from-gray-900 via-gray-800 to-gray-900',
      buttonGradient: 'from-green-600 to-green-800'
    } : {
      // Light mode colors
      background: 'bg-gray-50',
      backgroundSecondary: 'bg-white',
      surface: 'bg-white',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      primary: 'bg-green-600',
      primaryHover: 'hover:bg-green-700',
      primaryText: 'text-green-600',
      border: 'border-gray-200',
      card: 'bg-white',
      cardHover: 'hover:bg-gray-50',
      hover: 'hover:bg-gray-100',
      navbar: 'bg-white',
      accent: 'text-green-600',
      input: 'bg-gray-100',
      gradient: 'from-green-50 via-white to-green-50',
      buttonGradient: 'from-green-500 to-green-700'
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

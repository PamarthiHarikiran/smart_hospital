import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  CLINICAL_TEAL: 'clinical-teal',
};

const THEME_STORAGE_KEY = 'elitecare_theme';

export const THEME_OPTIONS = [
  {
    id: THEMES.LIGHT,
    name: 'Light Mode',
    shortName: 'Light',
    iconName: 'Sun',
    bgClass: 'bg-slate-50 text-slate-900',
    description: 'Crisp, high-clarity clinical white workspace',
    badgeColor: '#3b82f6',
    previewBg: '#f8fafc',
    previewBorder: '#e2e8f0',
  },
  {
    id: THEMES.DARK,
    name: 'Dark Mode',
    shortName: 'Dark',
    iconName: 'Moon',
    bgClass: 'bg-slate-950 text-slate-100',
    description: 'Ultra-low eye strain midnight slate environment',
    badgeColor: '#818cf8',
    previewBg: '#020617',
    previewBorder: '#1e293b',
  },
  {
    id: THEMES.CLINICAL_TEAL,
    name: 'Clinical Teal Mode',
    shortName: 'Clinical Teal',
    iconName: 'Sparkles',
    bgClass: 'bg-teal-950 text-teal-50',
    description: 'Specialized deep hospital teal & cyan theme',
    badgeColor: '#14b8a6',
    previewBg: '#042f2e',
    previewBorder: '#134e4a',
  },
];

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && [THEMES.LIGHT, THEMES.DARK, THEMES.CLINICAL_TEAL].includes(saved)) {
        return saved;
      }
    } catch {
      // LocalStorage access fallback
    }
    return THEMES.LIGHT;
  });

  // Apply theme to document element and persist in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);

      // Manage Tailwind-style class tokens on html root
      document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-clinical-teal');
      document.documentElement.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  // Set specific theme
  const setTheme = (newTheme) => {
    if ([THEMES.LIGHT, THEMES.DARK, THEMES.CLINICAL_TEAL].includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  // 1-Click cycle through themes: light -> dark -> clinical-teal -> light
  const toggleTheme = () => {
    setThemeState((current) => {
      if (current === THEMES.LIGHT) return THEMES.DARK;
      if (current === THEMES.DARK) return THEMES.CLINICAL_TEAL;
      return THEMES.LIGHT;
    });
  };

  // Helper getters
  const isLight = theme === THEMES.LIGHT;
  const isDark = theme === THEMES.DARK;
  const isClinicalTeal = theme === THEMES.CLINICAL_TEAL;

  // Resolve Tailwind background classes
  const getThemeClass = () => {
    switch (theme) {
      case THEMES.DARK:
        return 'bg-slate-950 text-slate-100 theme-dark';
      case THEMES.CLINICAL_TEAL:
        return 'bg-teal-950 text-teal-50 theme-clinical-teal';
      case THEMES.LIGHT:
      default:
        return 'bg-slate-50 text-slate-900 theme-light';
    }
  };

  const currentThemeMeta = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isLight,
        isDark,
        isClinicalTeal,
        themeClass: getThemeClass(),
        getThemeClass,
        currentThemeMeta,
        themeOptions: THEME_OPTIONS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

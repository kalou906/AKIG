import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Helper pour parser localStorage de manière sécurisée
const safeParse = (value, fallback) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        console.warn('[UIConfig] Invalid localStorage value, using fallback');
        return fallback;
    }
};

// Context values: theme (light|dark|genius), density (comfortable|compact), accent color, showSidebar, geniusEnabled
const UIConfigContext = createContext(null);

export const UIConfigProvider = ({ children }) => {
    const [theme, setTheme] = useLocalStorage('ui:theme', 'light');
    const [density, setDensity] = useLocalStorage('ui:density', 'comfortable');
    const [accent, setAccent] = useLocalStorage('ui:accent', 'indigo');
    const [geniusEnabled, setGeniusEnabled] = useLocalStorage('geniusMode', true);
    const [showSidebar, setShowSidebar] = useLocalStorage('ui:sidebar', true);
    const [uiMode, setUiMode] = useLocalStorage('ui:mode', 'pro'); // classic | modern | pro

    // Sync body classes
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('theme-light', 'theme-dark', 'theme-genius');
        root.classList.add(`theme-${geniusEnabled ? 'genius' : theme}`);
        root.dataset.density = density;
    }, [theme, density, geniusEnabled]);

    const toggleDensity = useCallback(() => {
        setDensity(density === 'comfortable' ? 'compact' : 'comfortable');
    }, [density, setDensity]);

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    }, [theme, setTheme]);

    const toggleSidebar = useCallback(() => setShowSidebar(v => !v), [setShowSidebar]);
    const toggleGenius = useCallback(() => setGeniusEnabled(v => !v), [setGeniusEnabled]);

    // REMOVED: Auto-force genius - laisse l'utilisateur décider
    // L'utilisateur peut activer manuellement Genius via le bouton

    const value = {
        theme,
        setTheme,
        density,
        setDensity,
        accent,
        setAccent,
        showSidebar,
        setShowSidebar,
        geniusEnabled,
        setGeniusEnabled,
        uiMode,
        setUiMode,
        toggleDensity,
        toggleTheme,
        toggleSidebar,
        toggleGenius
    };

    return (
        <UIConfigContext.Provider value={value}>{children}</UIConfigContext.Provider>
    );
};

export const useUIConfig = () => {
    const ctx = useContext(UIConfigContext);
    if (!ctx) throw new Error('useUIConfig must be used within UIConfigProvider');
    return ctx;
};

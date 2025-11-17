/**
 * 🌍 React Hook: useI18n
 * Hook personnalisé pour gestion langue et traductions
 * 
 * frontend/src/hooks/useI18n.js
 */

import { useState, useEffect, useCallback } from 'react';

const useI18n = () => {
  const [language, setLanguageState] = useState(() => {
    // Récupérer la langue sauvegardée ou utiliser 'en' par défaut
    return localStorage.getItem('language') || 'en';
  });

  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  // Charger les traductions au démarrage et quand la langue change
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/i18n/translations?lang=${language}`);
        const data = await response.json();

        if (data.success) {
          setTranslations(data.translations);
          // Sauvegarder la langue
          localStorage.setItem('language', language);
          // Mettre à jour l'attribut HTML lang
          document.documentElement.lang = language;
        }
      } catch (error) {
        console.error('Erreur chargement traductions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslations();
  }, [language]);

  /**
   * Fonction de traduction
   */
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Retourner la clé si non trouvée
      }
    }

    if (typeof value === 'string') {
      // Remplacer les paramètres
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] || match;
      });
    }

    return value || key;
  }, [translations]);

  /**
   * Changer la langue
   */
  const setLanguage = useCallback(async (newLanguage) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/i18n/set-language', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ language: newLanguage })
        });

        if (response.ok) {
          setLanguageState(newLanguage);
        }
      } else {
        // Si pas connecté, juste changer localement
        setLanguageState(newLanguage);
      }
    } catch (error) {
      console.error('Erreur changement langue:', error);
    }
  }, []);

  /**
   * Formater une devise
   */
  const formatCurrency = useCallback(async (amount, currency = 'GNF') => {
    try {
      const response = await fetch('/api/i18n/format-currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, lang: language })
      });
      const data = await response.json();
      return data.formatted;
    } catch (error) {
      console.error('Erreur formatage devise:', error);
      return `${amount} ${currency}`;
    }
  }, [language]);

  /**
   * Formater une date
   */
  const formatDate = useCallback(async (date, format = 'short') => {
    try {
      const response = await fetch('/api/i18n/format-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, format, lang: language })
      });
      const data = await response.json();
      return data.formatted;
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return new Date(date).toLocaleDateString();
    }
  }, [language]);

  /**
   * Formater un nombre
   */
  const formatNumber = useCallback(async (number, decimals = 2) => {
    try {
      const response = await fetch('/api/i18n/format-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, decimals, lang: language })
      });
      const data = await response.json();
      return data.formatted;
    } catch (error) {
      console.error('Erreur formatage nombre:', error);
      return number.toFixed(decimals);
    }
  }, [language]);

  return {
    language,
    setLanguage,
    t,
    translations,
    loading,
    formatCurrency,
    formatDate,
    formatNumber
  };
};

export default useI18n;

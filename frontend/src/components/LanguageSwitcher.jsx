/**
 * 🌍 Component: Language Switcher
 * Permet à l'utilisateur de changer la langue (FR/EN)
 * 
 * frontend/src/components/LanguageSwitcher.jsx
 */

import React from 'react';
import useI18n from '../hooks/useI18n';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ className = '' }) => {
  const { language, setLanguage, loading } = useI18n();

  const toggleLanguage = async () => {
    const newLanguage = language === 'en' ? 'fr' : 'en';
    await setLanguage(newLanguage);
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={loading}
      className={`
        flex items-center gap-2 px-3 py-2 
        bg-gradient-to-r from-blue-500 to-purple-600 
        hover:from-blue-600 hover:to-purple-700
        text-white rounded-lg font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={language === 'en' ? 'Switch to French' : 'Passer à l\'anglais'}
    >
      <Globe size={18} />
      <span className="hidden sm:inline">{language.toUpperCase()}</span>
    </button>
  );
};

export default LanguageSwitcher;

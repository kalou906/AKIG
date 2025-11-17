/**
 * Language Selector Component
 * Composant de sélection de langue avec dropdown ou boutons
 */

import React, { FC } from 'react';
import { useLanguage } from '../hooks';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons' | 'icons';
  className?: string;
  showNativeNames?: boolean;
}

/**
 * Composant sélecteur de langue
 */
export const LanguageSelector: FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  className = '',
  showNativeNames = false,
}) => {
  const { language, setLanguage, getAvailableLanguages } = useLanguage();
  const languages = getAvailableLanguages();

  if (variant === 'buttons') {
    return (
      <div className={`language-buttons ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`lang-button ${language === lang.code ? 'active' : ''}`}
            aria-label={`Select ${lang.name}`}
            title={lang.name}
          >
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'icons') {
    const flagEmojis: Record<string, string> = {
      fr: '🇫🇷',
      en: '🇬🇧',
      ar: '🇸🇦',
    };

    return (
      <div className={`language-icons ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`lang-icon ${language === lang.code ? 'active' : ''}`}
            aria-label={`Select ${lang.name}`}
            title={lang.name}
          >
            {flagEmojis[lang.code] || lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Default: dropdown
  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className={`language-select ${className}`}
      aria-label="Select language"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {showNativeNames ? lang.nativeName : lang.name}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;

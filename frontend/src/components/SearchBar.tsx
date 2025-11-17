import React, { KeyboardEvent } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * SearchBar component
 * Supports Enter key submission with optional callback
 */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Rechercher...',
  disabled = false,
  loading = false,
}: SearchBarProps): React.ReactElement {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !disabled && !loading && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value);
  };

  const handleClick = (): void => {
    if (!disabled && !loading && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="card flex items-center gap-2">
      <input
        type="text"
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Champ de recherche"
        aria-busy={loading}
      />

      {onSubmit && (
        <button
          onClick={handleClick}
          disabled={disabled || loading}
          className={`
            btn text-white px-4 py-2 rounded font-medium flex items-center gap-2
            transition-all duration-200
            ${
              disabled || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[var(--akigBlue)] hover:opacity-90 active:opacity-75'
            }
          `}
          aria-label="Lancer la recherche"
          type="button"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin">⟳</span>
              Recherche...
            </>
          ) : (
            <>
              🔎 Chercher
            </>
          )}
        </button>
      )}
    </div>
  );
}

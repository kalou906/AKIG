import React from 'react';

export interface InputPhoneProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Composant d'input pour numéro de téléphone guinéen
 * Normalise automatiquement au format +224
 *
 * @example
 * const [phone, setPhone] = useState('');
 * return <InputPhone value={phone} onChange={setPhone} />;
 */
export function InputPhone({
  value,
  onChange,
  placeholder = '+224 6XX XX XX XX',
  disabled = false,
  required = false,
  className = '',
}: InputPhoneProps) {
  function normalize(input: string): string {
    // Extraire seulement les chiffres
    const digitsOnly = input.replace(/[^\d]/g, '');

    // Si vide, retourner vide
    if (!digitsOnly) return '';

    // Ajouter le prefix +224 si pas présent
    const withPrefix = digitsOnly.startsWith('224')
      ? digitsOnly
      : digitsOnly.length > 0
        ? '224' + digitsOnly
        : '';

    // Formater: +224 XXXXXXXXX
    if (withPrefix.length === 0) return '';
    if (withPrefix.length <= 3) return '+' + withPrefix;

    const formatted = '+' + withPrefix.substring(0, 3) + ' ' + withPrefix.substring(3, 6) + ' ' + withPrefix.substring(6, 9) + ' ' + withPrefix.substring(9, 12);
    return formatted.trim();
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = normalize(e.target.value);
    onChange(normalized);
  };

  const defaultClassName = [
    'border rounded px-3 py-2',
    'focus:outline-none focus:ring-2 focus:ring-blue-500',
    'text-sm font-mono',
    disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
    className,
  ].join(' ');

  return (
    <input
      type="tel"
      className={defaultClassName}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      maxLength={16}
      title="Numéro de téléphone au format +224"
    />
  );
}

export default InputPhone;

import React from 'react';

interface FormFieldProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
}

/**
 * FormField - Champ de formulaire réutilisable
 * Gère label, input, erreurs et accessibilité
 */
export function FormField({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  disabled = false,
  required = false,
  autoComplete,
}: FormFieldProps) {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${fieldId}-error`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        className={`
          w-full px-3 py-2 border rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          transition-colors
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />

      {error && (
        <div id={errorId} className="mt-1 text-xs text-red-600 flex items-center">
          <span className="inline-block w-4 h-4 bg-red-500 rounded-full text-white text-center leading-4 mr-2 text-xs">!</span>
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * FormGroup - Wrapper pour grouper plusieurs champs
 */
export function FormGroup({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <fieldset className="border rounded-md p-4 mb-6">
      {title && <legend className="text-sm font-semibold text-gray-900 px-2">{title}</legend>}
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

/**
 * FormActions - Boutons d'actions pour formulaire
 */
export function FormActions({
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Soumettre',
  cancelLabel = 'Annuler',
}: {
  onSubmit: () => void;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}) {
  return (
    <div className="flex gap-2 justify-end mt-6">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {loading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}

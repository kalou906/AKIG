import React from 'react';

/**
 * Types pour la validation
 */
export type ValidationRule = (value: any) => string | null;

export interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  validate?: ValidationRule[];
  options?: { value: string; label: string }[];
  multiline?: boolean;
  rows?: number;
}

export interface FormConfig {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  initialValues?: Record<string, any>;
  submitText?: string;
}

/**
 * Composant Form Builder
 *
 * Exemple :
 * <FormBuilder
 *   config={{
 *     fields: [
 *       { name: 'email', label: 'Email', type: 'email', required: true },
 *       { name: 'message', label: 'Message', type: 'textarea' }
 *     ],
 *     onSubmit: (data) => console.log(data)
 *   }}
 * />
 */
export function FormBuilder({
  config,
}: {
  config: FormConfig;
}): React.ReactElement {
  const { fields, onSubmit, initialValues = {}, submitText = 'Envoyer' } = config;
  const [values, setValues] = React.useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  const validateField = (field: FormField, value: any): string | null => {
    // Validation requise
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} est obligatoire`;
    }

    // Validations personnalisées
    if (field.validate) {
      for (const rule of field.validate) {
        const error = rule(value);
        if (error) return error;
      }
    }

    return null;
  };

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues((prev) => ({ ...prev, [name]: newValue }));

    // Validation en temps réel
    const field = fields.find((f) => f.name === name);
    if (field) {
      const error = validateField(field, newValue);
      setErrors((prev) => {
        const updated = { ...prev };
        if (error) {
          updated[name] = error;
        } else {
          delete updated[name];
        }
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation de tous les champs
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const error = validateField(field, values[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <FormFieldControl
          key={field.name}
          field={field}
          value={values[field.name] ?? ''}
          error={errors[field.name]}
          onChange={handleChange}
        />
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition disabled:opacity-50"
      >
        {loading ? '...' : submitText}
      </button>
    </form>
  );
}

/**
 * Composant pour un champ de formulaire
 */
interface FormFieldProps {
  field: FormField;
  value: any;
  error?: string;
  onChange: (e: React.ChangeEvent<any>) => void;
}

function FormFieldControl({ field, value, error, onChange }: FormFieldProps): React.ReactElement {
  const baseInputClass = `w-full px-3 py-2 border rounded ${
    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
  } focus:outline-none focus:ring-2 transition`;

  switch (field.type) {
    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            name={field.name}
            value={value}
            onChange={onChange}
            placeholder={field.placeholder}
            rows={field.rows ?? 4}
            className={baseInputClass}
          />
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            name={field.name}
            value={value}
            onChange={onChange}
            className={baseInputClass}
          >
            <option value="">Sélectionner...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
      );

    case 'checkbox':
      return (
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name={field.name}
              checked={value}
              onChange={onChange}
              className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
            />
            {field.label}
          </label>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
      );

    case 'radio':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={field.name}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={onChange}
                  className="w-4 h-4 border-gray-300 focus:ring-blue-500"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
      );

    default:
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={field.type ?? 'text'}
            name={field.name}
            value={value}
            onChange={onChange}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
      );
  }
}

/**
 * Validateurs prédéfinis
 */
export const Validators = {
  email: (value: string): string | null => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Email invalide';
    }
    return null;
  },

  phone: (value: string): string | null => {
    if (!/^[\d\s\-+()]{7,}$/.test(value)) {
      return 'Téléphone invalide';
    }
    return null;
  },

  minLength: (min: number) => (value: string): string | null => {
    if (value.length < min) {
      return `Minimum ${min} caractères`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string): string | null => {
    if (value.length > max) {
      return `Maximum ${max} caractères`;
    }
    return null;
  },

  min: (min: number) => (value: number): string | null => {
    if (Number(value) < min) {
      return `Minimum ${min}`;
    }
    return null;
  },

  max: (max: number) => (value: number): string | null => {
    if (Number(value) > max) {
      return `Maximum ${max}`;
    }
    return null;
  },

  pattern: (pattern: RegExp, message: string) => (value: string): string | null => {
    if (!pattern.test(value)) {
      return message;
    }
    return null;
  },

  match: (otherField: string, otherLabel: string) => (value: string, allValues?: Record<string, any>): string | null => {
    if (allValues?.[otherField] !== value) {
      return `Ne correspond pas à ${otherLabel}`;
    }
    return null;
  },
};

/**
 * Hook pour gérer l'état d'un formulaire
 */
export function useForm(initialValues: Record<string, any> = {}) {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBlur = (e: React.FocusEvent<any>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const setFieldValue = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const setFieldError = (name: string, error: string | null) => {
    setErrors((prev) => {
      if (error === null) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: error };
    });
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    reset,
  };
}

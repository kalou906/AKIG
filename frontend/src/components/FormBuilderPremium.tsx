/**
 * 📋 FormBuilderPremium - Constructeur de formulaires avec validation et animations
 */

import React, { ReactNode, FormEvent } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: any) => string | null;
  rows?: number;
}

interface FormBuilderProps {
  fields: FormFieldConfig[];
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  submitLabel?: string;
  title?: string;
  description?: string;
}

export default function FormBuilderPremium({
  fields,
  onSubmit,
  submitLabel = 'Soumettre',
  title,
  description,
}: FormBuilderProps) {
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const validateField = (name: string, value: any) => {
    const field = fields.find(f => f.name === name);
    if (!field) return;

    let error: string | null = null;

    if (field.required && !value) {
      error = `${field.label} est requis`;
    } else if (field.validation) {
      error = field.validation(value);
    } else if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        error = 'Email invalide';
      }
    }

    setErrors(prev => ({
      ...prev,
      [name]: error || '',
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      validateField(field.name, formData[field.name]);
    });

    // Check for errors
    const hasErrors = Object.values(errors).some(err => err);
    if (hasErrors) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setFormData({});
      setTouched({});
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {description && <p className="text-gray-600 mt-2">{description}</p>}
        </div>
      )}

      <div className="space-y-6">
        {fields.map(field => (
          <div key={field.name} className="animate-slideInUp">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                name={field.name}
                placeholder={field.placeholder}
                rows={field.rows || 4}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                onBlur={() => handleBlur(field.name)}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  touched[field.name] && errors[field.name] 
                    ? 'border-red-300 focus:ring-red-500'
                    : touched[field.name] && !errors[field.name]
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-gray-300'
                }`}
              />
            ) : field.type === 'select' ? (
              <select
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                onBlur={() => handleBlur(field.name)}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  touched[field.name] && errors[field.name] 
                    ? 'border-red-300 focus:ring-red-500'
                    : touched[field.name] && !errors[field.name]
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner une option</option>
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                onBlur={() => handleBlur(field.name)}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  touched[field.name] && errors[field.name] 
                    ? 'border-red-300 focus:ring-red-500'
                    : touched[field.name] && !errors[field.name]
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-gray-300'
                }`}
              />
            )}

            {/* Error message */}
            {touched[field.name] && errors[field.name] && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm animate-slideInUp">
                <AlertCircle size={16} />
                {errors[field.name]}
              </div>
            )}

            {/* Success message */}
            {touched[field.name] && !errors[field.name] && formData[field.name] && (
              <div className="flex items-center gap-2 mt-2 text-green-600 text-sm animate-slideInUp">
                <CheckCircle size={16} />
                Valide
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Success Alert */}
      {success && (
        <div className="mt-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-center gap-2 text-green-700 animate-slideInUp">
          <CheckCircle size={20} />
          Formulaire soumis avec succès!
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-slideInUp"
      >
        {loading ? 'Traitement...' : submitLabel}
      </button>
    </form>
  );
}

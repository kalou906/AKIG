// ============================================================
// 📝 FormField Component - Reusable Form Input
// ============================================================

import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle } from 'lucide-react';

const FormField = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    onBlur,
    error,
    required = false,
    disabled = false,
    placeholder,
    helperText,
    options = [],
    rows,
    maxLength,
    className = '',
    labelClassName = '',
    inputClassName = '',
    icon: Icon,
    ...props
}) => {
    const baseStyles = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200';
    const defaultBorder = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    const errorBorder = 'border-red-500 focus:border-red-500 focus:ring-red-500';
    const disabledStyles = 'bg-gray-100 text-gray-600 cursor-not-allowed';

    const inputStyles = `${baseStyles} ${error ? errorBorder : defaultBorder} ${disabled ? disabledStyles : ''} ${inputClassName}`;

    // Text area
    if (type === 'textarea') {
        return (
            <div className={className}>
                {label && (
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={maxLength}
                    rows={rows || 4}
                    className={`${baseStyles} resize-none ${error ? errorBorder : defaultBorder} ${disabled ? disabledStyles : ''}`}
                    {...props}
                />
                {maxLength && (
                    <p className="text-xs text-gray-500 mt-1">
                        {value?.length || 0}/{maxLength}
                    </p>
                )}
                {error && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={16} /> {error}
                    </p>
                )}
                {helperText && !error && (
                    <p className="text-xs text-gray-500 mt-1">{helperText}</p>
                )}
            </div>
        );
    }

    // Select dropdown
    if (type === 'select') {
        return (
            <div className={className}>
                {label && (
                    <label htmlFor={name} className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <select
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    className={inputStyles}
                    {...props}
                >
                    <option value="">{placeholder || 'Sélectionner...'}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={16} /> {error}
                    </p>
                )}
                {helperText && !error && (
                    <p className="text-xs text-gray-500 mt-1">{helperText}</p>
                )}
            </div>
        );
    }

    // Checkbox
    if (type === 'checkbox') {
        return (
            <div className={`flex items-center ${className}`}>
                <input
                    id={name}
                    type="checkbox"
                    name={name}
                    checked={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    {...props}
                />
                {label && (
                    <label htmlFor={name} className={`ml-2 text-sm text-gray-700 cursor-pointer select-none ${labelClassName}`}>
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                {error && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={16} /> {error}
                    </p>
                )}
            </div>
        );
    }

    // Radio
    if (type === 'radio') {
        return (
            <div className={className}>
                {label && (
                    <p className={`text-sm font-medium text-gray-700 mb-2 ${labelClassName}`}>
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                )}
                <div className="space-y-2">
                    {options.map((opt) => (
                        <div key={opt.value} className="flex items-center">
                            <input
                                id={`${name}-${opt.value}`}
                                type="radio"
                                name={name}
                                value={opt.value}
                                checked={value === opt.value}
                                onChange={onChange}
                                onBlur={onBlur}
                                disabled={disabled}
                                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                {...props}
                            />
                            <label htmlFor={`${name}-${opt.value}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                                {opt.label}
                            </label>
                        </div>
                    ))}
                </div>
                {error && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={16} /> {error}
                    </p>
                )}
            </div>
        );
    }

    // Text input (default)
    return (
        <div className={className}>
            {label && (
                <label htmlFor={name} className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    id={name}
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={maxLength}
                    className={`${inputStyles} ${Icon ? 'pl-10' : ''}`}
                    {...props}
                />
            </div>
            {maxLength && (
                <p className="text-xs text-gray-500 mt-1">
                    {value?.length || 0}/{maxLength}
                </p>
            )}
            {error && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={16} /> {error}
                </p>
            )}
            {helperText && !error && (
                <p className="text-xs text-gray-500 mt-1">{helperText}</p>
            )}
        </div>
    );
};

FormField.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['text', 'email', 'password', 'number', 'tel', 'date', 'time', 'textarea', 'select', 'checkbox', 'radio']),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    error: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    placeholder: PropTypes.string,
    helperText: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })),
    rows: PropTypes.number,
    maxLength: PropTypes.number,
    className: PropTypes.string,
    labelClassName: PropTypes.string,
    inputClassName: PropTypes.string,
    icon: PropTypes.elementType
};

export default FormField;

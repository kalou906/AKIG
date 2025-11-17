/**
 * Validation utilities pour formulaires
 * Retourne null si valide, sinon message d'erreur
 */

export const v = {
  /**
   * Champ requis
   */
  required: (value: string | null | undefined): string | null => {
    return value?.trim() ? null : 'Champ requis';
  },

  /**
   * Validation email
   */
  email: (value: string | null | undefined): string | null => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Email invalide';
  },

  /**
   * Validation téléphone Guinée
   * Format: +224 6XXXXXXXX ou +224 62XXXXXXX, etc.
   */
  phoneGN: (value: string | null | undefined): string | null => {
    if (!value) return null;
    // Format: +224 + (6|62|65|66|70|80) + 7-8 chiffres
    const phoneRegex = /^\+224\s?(6|62|65|66|70|80)\d{7}$/;
    return phoneRegex.test(value) ? null : 'Téléphone Guinée invalide (ex: +224 612345678)';
  },

  /**
   * Validation longueur minimum
   */
  minLength: (min: number) => (value: string | null | undefined): string | null => {
    return value && value.length >= min ? null : `Minimum ${min} caractères`;
  },

  /**
   * Validation longueur maximum
   */
  maxLength: (max: number) => (value: string | null | undefined): string | null => {
    return !value || value.length <= max ? null : `Maximum ${max} caractères`;
  },

  /**
   * Validation nombre minimum
   */
  min: (min: number) => (value: number | null | undefined): string | null => {
    return value !== null && value !== undefined && value >= min ? null : `Minimum ${min}`;
  },

  /**
   * Validation nombre maximum
   */
  max: (max: number) => (value: number | null | undefined): string | null => {
    return value !== null && value !== undefined && value <= max ? null : `Maximum ${max}`;
  },

  /**
   * Validation pattern personnalisé
   */
  pattern: (regex: RegExp, message: string) => (value: string | null | undefined): string | null => {
    return !value || regex.test(value) ? null : message;
  },

  /**
   * Validation personnalisée
   */
  custom: (fn: (value: any) => boolean, message: string) => (value: any): string | null => {
    return fn(value) ? null : message;
  },
};

/**
 * Composeur de validateurs
 * Applique plusieurs validations en séquence
 */
export function compose(...validators: ((value: any) => string | null)[]): (value: any) => string | null {
  return (value: any) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
}

/**
 * Exemples de composition
 */
export const commonValidators = {
  // Email requis
  requiredEmail: compose(v.required, v.email),

  // Téléphone requis
  requiredPhoneGN: compose(v.required, v.phoneGN),

  // Texte court (1-100 chars)
  shortText: compose(v.required, v.minLength(1), v.maxLength(100)),

  // Texte long (1-1000 chars)
  longText: compose(v.required, v.minLength(1), v.maxLength(1000)),

  // Nombre positif
  positiveNumber: compose(
    v.required,
    v.custom((n) => !isNaN(n) && Number(n) >= 0, 'Doit être un nombre positif')
  ),
};

/**
 * Validateur de formulaire complet
 */
export function validateForm(
  data: Record<string, any>,
  schema: Record<string, (value: any) => string | null>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, validator] of Object.entries(schema)) {
    const value = data[field];
    const error = validator(value);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

/**
 * Check si les erreurs de formulaire sont vides
 */
export function isFormValid(errors: Record<string, any>): boolean {
  return Object.values(errors).every((error) => !error);
}

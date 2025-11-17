/**
 * i18n Middleware - Language detection and translation
 * Detects language from: Accept-Language header, user preferences, URL param
 */

import { Request, Response, NextFunction } from 'express';
import { I18nService } from '../services/i18n.service';

export type Language = 'fr' | 'en';

export interface I18nRequest extends Request {
  language?: Language;
  i18n?: I18nService;
  translate?: (key: string) => Promise<string>;
}

/**
 * Language detection middleware
 */
export function languageDetectionMiddleware(i18nService: I18nService) {
  return async (req: I18nRequest, res: Response, next: NextFunction) => {
    let language: Language = 'fr'; // Default to French

    // 1. Check URL parameter (?lang=en)
    if (req.query.lang && ['fr', 'en'].includes(req.query.lang as string)) {
      language = req.query.lang as Language;
    }
    // 2. Check user profile preference (if authenticated)
    else if (req.user && (req.user as any).language) {
      language = (req.user as any).language;
    }
    // 3. Check Accept-Language header
    else {
      const acceptLanguage = req.headers['accept-language'] || 'fr';

      if (acceptLanguage.includes('en')) {
        language = 'en';
      } else if (acceptLanguage.includes('fr')) {
        language = 'fr';
      }
    }

    // Attach to request
    req.language = language;
    req.i18n = i18nService;
    req.translate = async (key: string) => i18nService.translate(key, language);

    // Add to response locals for templates
    res.locals.language = language;
    res.locals.translate = req.translate;

    next();
  };
}

/**
 * Language preference header middleware
 * Adds Content-Language header to responses
 */
export function languageHeaderMiddleware(req: I18nRequest, res: Response, next: NextFunction) {
  res.setHeader('Content-Language', req.language || 'fr');
  next();
}

/**
 * Translate response middleware
 * For JSON responses, can translate specific fields
 */
export function translateResponseMiddleware(fieldsToTranslate: string[] = []) {
  return (req: I18nRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      // Only translate if there are fields to translate
      if (fieldsToTranslate.length > 0 && req.translate) {
        (async () => {
          try {
            for (const field of fieldsToTranslate) {
              if (data[field] && typeof data[field] === 'string') {
                data[field] = await req.translate!(data[field]);
              }
            }
          } catch (error) {
            console.error('Translation error:', error);
          }
          return originalJson(data);
        })();
      } else {
        return originalJson(data);
      }

      return res;
    };

    next();
  };
}

/**
 * Helper to get translated error message
 */
export async function getTranslatedError(
  code: string,
  i18nService: I18nService,
  language: Language
): Promise<string> {
  const errorMap: Record<string, Record<Language, string>> = {
    'AUTH_INVALID_CREDENTIALS': {
      fr: 'Identifiants invalides',
      en: 'Invalid credentials'
    },
    'AUTH_TOKEN_EXPIRED': {
      fr: 'Token expiré',
      en: 'Token expired'
    },
    'AUTH_PERMISSION_DENIED': {
      fr: 'Permission refusée',
      en: 'Permission denied'
    },
    'DATABASE_ERROR': {
      fr: 'Erreur base de données',
      en: 'Database error'
    },
    'NOT_FOUND': {
      fr: 'Non trouvé',
      en: 'Not found'
    },
    'VALIDATION_ERROR': {
      fr: 'Erreur de validation',
      en: 'Validation error'
    }
  };

  return errorMap[code]?.[language] || code;
}

/**
 * Format error response with translation
 */
export async function formatErrorResponse(
  code: string,
  message: string,
  i18nService: I18nService,
  language: Language
): Promise<any> {
  const translatedCode = await getTranslatedError(code, i18nService, language);

  return {
    success: false,
    error: {
      code,
      message: translatedCode,
      details: message
    }
  };
}

/**
 * Endpoint to get all translations for current language
 */
export function getTranslationsEndpoint(i18nService: I18nService) {
  return async (req: I18nRequest, res: Response) => {
    try {
      const language = req.language || 'fr';

      const translations = await i18nService.getLanguageTranslations(language);

      res.json({
        success: true,
        language,
        translations,
        count: Object.keys(translations).length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch translations'
      });
    }
  };
}

/**
 * Endpoint to update user language preference
 */
export function setUserLanguageEndpoint(i18nService: I18nService) {
  return async (req: I18nRequest, res: Response) => {
    try {
      const { language } = req.body;

      if (!['fr', 'en'].includes(language)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid language code'
        });
      }

      // Update in database (would need user_preferences table)
      // await db.query('UPDATE user_preferences SET language = $1 WHERE user_id = $2', [language, req.user.id]);

      req.language = language;

      res.json({
        success: true,
        message: 'Language preference updated',
        language
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update language preference'
      });
    }
  };
}

/**
 * Format date with language-aware locale
 */
export function formatDateByLanguage(date: Date, language: Language): string {
  const formatter = new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return formatter.format(date);
}

/**
 * Format number with language-aware locale
 */
export function formatNumberByLanguage(num: number, language: Language): string {
  const formatter = new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US');

  return formatter.format(num);
}

/**
 * Format currency with language-aware locale
 */
export function formatCurrencyByLanguage(
  amount: number,
  language: Language,
  currency = 'EUR'
): string {
  const formatter = new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency
  });

  return formatter.format(amount);
}

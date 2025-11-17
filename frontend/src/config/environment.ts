/*
 * Centralise la lecture et la validation des variables d'environnement côté frontend.
 * L'application refuse de démarrer si une configuration critique est absente.
 */

type FeatureFlagMap = Record<string, boolean>;

type EnvironmentConfig = {
  appEnv: string;
  apiBaseUrl: string;
  featureFlags: FeatureFlagMap;
  featureFlagList: string[];
  userRole: string;
  basePath: string;
  publicUrl: string;
};

const REQUIRED_KEYS = ['APP_ENV', 'API_BASE_URL', 'FEATURE_FLAGS', 'ROLE'] as const;

function readFromImportMeta(key: string): string | undefined {
  try {
    if (typeof import.meta === 'undefined') {
      return undefined;
    }

    const metaEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;

    if (!metaEnv) {
      return undefined;
    }

    return metaEnv[`VITE_${key}`] ?? metaEnv[key];
  } catch (error) {
    console.warn('[ENV] Impossible de lire import.meta.env pour', key, error);
    return undefined;
  }
}

function readFromProcessEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[`VITE_${key}`] ?? process.env[`REACT_APP_${key}`] ?? process.env[key];
  }
  return undefined;
}

function readEnv(key: typeof REQUIRED_KEYS[number]): string {
  const value = readFromImportMeta(key) ?? readFromProcessEnv(key);
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  throw new Error(`[ENV] La variable ${key} est obligatoire et doit être définie.`);
}

function parseFeatureFlags(raw: string): { map: FeatureFlagMap; list: string[] } {
  if (!raw || raw.trim() === '') {
    throw new Error('[ENV] FEATURE_FLAGS doit contenir au moins un élément.');
  }

  const trimmed = raw.trim();
  let parsed: unknown;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      throw new Error(`[ENV] FEATURE_FLAGS (JSON) invalide: ${(error as Error).message}`);
    }
  } else {
    parsed = trimmed.split(',').map((flag) => flag.trim()).filter(Boolean);
  }

  const map: FeatureFlagMap = {};

  if (Array.isArray(parsed)) {
    parsed.forEach((flag) => {
      if (typeof flag !== 'string' || flag.trim() === '') {
        throw new Error('[ENV] Chaque feature flag doit être une chaîne non vide.');
      }
      map[flag.trim()] = true;
    });
  } else if (parsed && typeof parsed === 'object') {
    Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
      if (typeof key !== 'string' || key.trim() === '') {
        throw new Error('[ENV] Les clés des feature flags doivent être des chaînes non vides.');
      }
      map[key.trim()] = Boolean(value);
    });
  } else {
    throw new Error('[ENV] FEATURE_FLAGS doit être un tableau ou un objet JSON.');
  }

  const list = Object.keys(map).filter((key) => map[key]);

  if (list.length === 0) {
    throw new Error('[ENV] Aucun feature flag actif. Activez au moins un flag.');
  }

  return { map, list };
}

function normaliseBasePath(value: string): string {
  if (!value.startsWith('/')) {
    console.warn('[ENV] BASE_URL doit commencer par "/". Valeur normalisée.');
    return `/${value}`;
  }
  return value.replace(/[\\/]+/g, '/');
}

function resolveBasePath(): string {
  const base = readFromImportMeta('BASE_URL') ?? '/';
  return normaliseBasePath(base);
}

function resolvePublicUrl(apiBaseUrl: string): string {
  try {
    const url = new URL(apiBaseUrl);
    return url.origin;
  } catch (error) {
    console.warn('[ENV] API_BASE_URL ne semble pas être une URL absolue. Utilisation telle quelle.');
    return apiBaseUrl;
  }
}

function buildConfig(): EnvironmentConfig {
  const appEnv = readEnv('APP_ENV');
  const apiBaseUrl = readEnv('API_BASE_URL');
  const userRole = readEnv('ROLE');
  const { map, list } = parseFeatureFlags(readEnv('FEATURE_FLAGS'));

  const config: EnvironmentConfig = {
    appEnv,
    apiBaseUrl,
    featureFlags: map,
    featureFlagList: list,
    userRole,
    basePath: resolveBasePath(),
    publicUrl: resolvePublicUrl(apiBaseUrl),
  };

  if (typeof window !== 'undefined') {
    (window as typeof window & { __AKIG_ENV__?: EnvironmentConfig }).__AKIG_ENV__ = config;
  }

  return config;
}

let cachedConfig: EnvironmentConfig | null = null;

export function getEnvironmentConfig(): EnvironmentConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  cachedConfig = buildConfig();
  return cachedConfig;
}

export function getFeatureFlag(flag: string): boolean {
  const config = getEnvironmentConfig();
  return Boolean(config.featureFlags[flag]);
}

export function assertFeatureFlag(flag: string): void {
  if (!getFeatureFlag(flag)) {
    throw new Error(`[FeatureFlag] Le module "${flag}" n'est pas activé.`);
  }
}

export type { EnvironmentConfig, FeatureFlagMap };

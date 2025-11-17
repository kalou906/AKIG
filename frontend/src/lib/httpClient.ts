import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosHeaders } from 'axios';
import type { EnvironmentConfig } from '../config/environment';

const CRITICAL_ENDPOINT_PATTERNS = [/\/api\/auth\/login/i, /\/api\/payments/i];
const MAX_RETRIES = 2;
let client: AxiosInstance | null = null;

function shouldRetry(url: string | undefined, method: string | undefined): boolean {
  if (!url) {
    return false;
  }
  if (method && method.toUpperCase() !== 'POST') {
    return false;
  }
  return CRITICAL_ENDPOINT_PATTERNS.some((pattern) => pattern.test(url));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function setupHttpClient(environment: EnvironmentConfig): AxiosInstance {
  if (client) {
    return client;
  }

  client = axios.create({
    baseURL: environment.publicUrl ?? environment.apiBaseUrl,
    timeout: 15_000,
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    const headers = config.headers ?? {};

    if (headers instanceof AxiosHeaders) {
      headers.set('X-Requested-With', 'XMLHttpRequest');
    } else {
      (headers as Record<string, unknown>)['X-Requested-With'] = 'XMLHttpRequest';
    }

    config.headers = headers;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = (error.config || {}) as AxiosRequestConfig & { __akigRetryCount?: number };
      const attemptedUrl = config.url || '';
      const retryCount = config.__akigRetryCount || 0;
      const shouldAttemptRetry = shouldRetry(attemptedUrl, config.method);

      if (!error.response) {
        console.error(`[axios] Erreur réseau sur ${config.method?.toUpperCase()} ${attemptedUrl}:`, error.message);
      } else if (error.response.status >= 500) {
        console.error(`[axios] ${attemptedUrl} → HTTP ${error.response.status}`);
      }

      if (shouldAttemptRetry && retryCount < MAX_RETRIES) {
        const nextRetryCount = retryCount + 1;
        const backoffDelay = Math.pow(2, retryCount) * 300;
        console.warn(`[axios] Nouvelle tentative (${nextRetryCount}/${MAX_RETRIES + 1}) pour ${attemptedUrl} dans ${backoffDelay}ms.`);
        config.__akigRetryCount = nextRetryCount;
        await delay(backoffDelay);
        return client!(config);
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export function getHttpClient(): AxiosInstance {
  if (!client) {
    throw new Error('HTTP client non initialisé. Appelez setupHttpClient avant.');
  }
  return client;
}

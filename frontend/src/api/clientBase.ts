/**
 * Minimal HTTP wrapper used by domain API modules
 */

export interface HttpOptions extends RequestInit {
  timeout?: number;
}

// CSRF Token cache
let csrfToken: string | null = null;

// Fetch CSRF token from backend
async function fetchCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  
  try {
    const base = import.meta.env.VITE_API_URL || '/api';
    const res = await fetch(`${base}/csrf-token`, { credentials: 'include' });
    const data = await res.json();
    csrfToken = data.csrfToken || '';
    return csrfToken || '';
  } catch (error) {
    console.error('[AKIG][CSRF] Failed to fetch token:', error);
    return '';
  }
}

export async function http<T = any>(path: string, options: HttpOptions = {}): Promise<T> {
  const { timeout = 10000, headers, ...init } = options;
  const base = import.meta.env.VITE_API_URL || '/api';
  const url = `${base}${path}`;

  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeout);

  // Fetch CSRF token for mutations
  const needsCsrf = init.method && !['GET', 'HEAD', 'OPTIONS'].includes(init.method);
  const token = needsCsrf ? await fetchCsrfToken() : '';

  const mergedHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'X-CSRF-Token': token }),
    ...(headers || {}),
  };

  try {
    const start = performance.now();
    const res = await fetch(url, {
      credentials: 'include',
      ...init,
      headers: mergedHeaders,
      signal: controller.signal,
    });
    const duration = Math.round(performance.now() - start);
    if (duration > 2000) {
      console.warn(`[AKIG][SLOW] ${init.method || 'GET'} ${path} ${duration}ms`);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      // Gestion 401 → purge token locale
      if (res.status === 401) {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch { /* ignore */ }
      }
      throw new Error(`${init.method || 'GET'} ${path} failed (${res.status}): ${body}`);
    }
    // If no content
    if (res.status === 204) return undefined as unknown as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(to);
  }
}

export default http;

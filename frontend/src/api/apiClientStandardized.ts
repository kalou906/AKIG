/**
 * ============================================================
 * apiClient.ts - Client API centralisé avec auth header injection
 * Standardise la clé token à 'akig_token'
 * ============================================================
 */

let API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

interface FetchOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

/**
 * Récupère le token depuis localStorage (akig_token prioritaire)
 */
function getAuthToken(): string | null {
  return localStorage.getItem('akig_token') || localStorage.getItem('token');
}

/**
 * Construit les headers avec authentification
 */
function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Wrapper centralisé pour fetch avec gestion erreurs
 */
async function fetchAPI(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const {
    method = 'GET',
    body = null,
    headers = {},
    skipAuth = false,
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  const finalHeaders = getHeaders(skipAuth ? {} : headers);

  const fetchOptions: any = {
    method,
    headers: finalHeaders,
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    console.log(`[apiClient] ${method} ${endpoint}`);

    const response = await fetch(url, fetchOptions);

    // Gestion 401 Unauthorized - token expiré
    if (response.status === 401) {
      console.warn('[apiClient] Token expiré - redirection vers /login');
      localStorage.removeItem('akig_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      const error: any = new Error(
        errorData.message || `API Error: ${response.status}`
      );
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Certains endpoints retournent pas de body (204 No Content)
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[apiClient] Erreur ${method} ${endpoint}:`, error);
    throw error;
  }
}

// Exports des méthodes HTTP
export const apiClient = {
  get: (endpoint: string, options: FetchOptions = {}) =>
    fetchAPI(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, body: any, options: FetchOptions = {}) =>
    fetchAPI(endpoint, { ...options, method: 'POST', body }),

  put: (endpoint: string, body: any, options: FetchOptions = {}) =>
    fetchAPI(endpoint, { ...options, method: 'PUT', body }),

  patch: (endpoint: string, body: any, options: FetchOptions = {}) =>
    fetchAPI(endpoint, { ...options, method: 'PATCH', body }),

  delete: (endpoint: string, options: FetchOptions = {}) =>
    fetchAPI(endpoint, { ...options, method: 'DELETE' }),

  setBaseURL: (url: string) => {
    API_BASE_URL = url;
  },

  getToken: getAuthToken,
};

export default apiClient;

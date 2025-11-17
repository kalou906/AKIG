/**
 * ============================================================
 * src/lib/apiClient.js - Client API qui refuse erreurs silencieuses
 * Toute erreur est loguée et propagée
 * ============================================================
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Classe pour gérer les erreurs API
 */
class ApiError extends Error {
  constructor(endpoint, status, message, details = {}) {
    super(`API Error [${status}] ${endpoint}: ${message}`);
    this.endpoint = endpoint;
    this.status = status;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Effectuer un appel API avec gestion d'erreur robuste
 */
async function apiCall(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = 30000,
  } = options;

  const token = localStorage.getItem('akig_token');
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[${requestId}] ${method} ${endpoint}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Lire la réponse
    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Gestion des erreurs HTTP
    if (!response.ok) {
      const errorMessage = responseData?.message || responseData?.error || 'Erreur inconnue';
      console.error(`[${requestId}] ❌ ${response.status}: ${errorMessage}`);

      throw new ApiError(
        endpoint,
        response.status,
        errorMessage,
        responseData
      );
    }

    console.log(`[${requestId}] ✅ ${response.status} OK`);
    return responseData;

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Erreurs réseau, timeout, etc.
    const isTimeout = error.name === 'AbortError';
    const isNetworkError = error instanceof TypeError;

    if (isTimeout) {
      console.error(`[${requestId}] ⏱️  TIMEOUT (${timeout}ms): ${endpoint}`);
      throw new ApiError(endpoint, 'TIMEOUT', `Requête expirée après ${timeout}ms`);
    }

    if (isNetworkError) {
      console.error(`[${requestId}] 🌐 NETWORK ERROR: ${error.message}`);
      throw new ApiError(endpoint, 'NETWORK', 'Erreur réseau. Vérifiez votre connexion.');
    }

    console.error(`[${requestId}] ❌ UNKNOWN ERROR:`, error);
    throw new ApiError(endpoint, 'UNKNOWN', error.message);
  }
}

/**
 * GET - Lire des données
 */
export async function get(endpoint) {
  return apiCall(endpoint, { method: 'GET' });
}

/**
 * POST - Créer des données
 */
export async function post(endpoint, body) {
  return apiCall(endpoint, { method: 'POST', body });
}

/**
 * PUT - Mettre à jour des données
 */
export async function put(endpoint, body) {
  return apiCall(endpoint, { method: 'PUT', body });
}

/**
 * DELETE - Supprimer des données
 */
export async function del(endpoint) {
  return apiCall(endpoint, { method: 'DELETE' });
}

/**
 * Hook React pour afficher erreurs API UI
 */
export function useApiError() {
  const [error, setError] = React.useState(null);

  const clearError = () => setError(null);

  const handleApiError = (err) => {
    if (err instanceof ApiError) {
      setError(err.message);
    } else {
      setError('Erreur inconnue');
    }
  };

  return { error, clearError, handleApiError };
}

export const apiClient = {
  get,
  post,
  put,
  delete: del,
  ApiError,
};

export default apiClient;

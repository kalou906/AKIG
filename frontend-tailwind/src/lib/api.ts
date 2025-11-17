export type ApiOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  authenticated?: boolean;
};

export type ApiError = {
  status: number;
  message: string;
  code?: string;
};

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4002/api';

export async function apiRequest<T>(
  path: string,
  token: string | null,
  { method = 'GET', headers = {}, body, signal, authenticated = true }: ApiOptions = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const requestHeaders: Record<string, string> = {
    ...DEFAULT_HEADERS,
    ...headers,
  };

  if (authenticated && token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: isJson ? payload?.error || payload?.message || 'API error' : payload || 'API error',
      code: isJson ? payload?.code : undefined,
    };

    throw error;
  }

  return (isJson ? payload : { data: payload }) as T;
}

export function createApiClient(token: string | null) {
  return {
    get<T>(path: string, options: Omit<ApiOptions, 'method'> = {}) {
      return apiRequest<T>(path, token, { ...options, method: 'GET' });
    },
    post<T>(path: string, body?: unknown, options: Omit<ApiOptions, 'method' | 'body'> = {}) {
      return apiRequest<T>(path, token, { ...options, method: 'POST', body });
    },
    put<T>(path: string, body?: unknown, options: Omit<ApiOptions, 'method' | 'body'> = {}) {
      return apiRequest<T>(path, token, { ...options, method: 'PUT', body });
    },
    del<T>(path: string, options: Omit<ApiOptions, 'method'> = {}) {
      return apiRequest<T>(path, token, { ...options, method: 'DELETE' });
    },
  };
}

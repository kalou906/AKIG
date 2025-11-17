/**
 * Client API avec gestion d'erreurs et cache
 * frontend/src/api/http-client.ts
 */

import type { ApiError } from '../types/index';

interface RequestOptions {
  timeout?: number;
  cache?: 'no-store' | 'default' | 'force-cache';
  headers?: Record<string, string>;
}

class HttpClient {
  private baseUrl: string;
  private token: string | null = null;
  private cache: Map<string, { data: any; expires: number }> = new Map();

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '') + '/api';
    this.loadToken();
  }

  /**
   * Charge le token depuis localStorage
   */
  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  /**
   * Définit le token d'authentification
   */
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Construit les headers de la requête
   */
  private getHeaders(customHeaders?: any): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (customHeaders && typeof customHeaders === 'object') {
      Object.assign(headers, customHeaders);
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Gère les erreurs de réponse
   */
  private async handleError(response: Response): Promise<never> {
    const data = await response.json().catch(() => ({}));

    const error: ApiError = {
      code: data.error?.code || 'UNKNOWN_ERROR',
      message: data.error?.message || data.message || 'Une erreur est survenue',
      statusCode: response.status,
      details: data.error?.details,
    };

    throw error;
  }

  /**
   * Requête GET
   */
  async get<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    // Vérifier le cache
    const cacheKey = `GET:${path}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const url = `${this.baseUrl}${path}`;
    const headers = this.getHeaders(options.headers);
    const timeout = options.timeout || 10000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json();
      const result = data.data || data;

      // Cacher le résultat (5 minutes par défaut)
      this.cache.set(cacheKey, {
        data: result,
        expires: Date.now() + 5 * 60 * 1000,
      });

      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Requête POST
   */
  async post<T = any>(path: string, body?: any, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getHeaders(options.headers);
    const timeout = options.timeout || 10000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json();
      return data.data || data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Requête PUT
   */
  async put<T = any>(path: string, body?: any, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getHeaders(options.headers);
    const timeout = options.timeout || 10000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json();
      return data.data || data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Requête DELETE
   */
  async delete<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getHeaders(options.headers);
    const timeout = options.timeout || 10000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json();
      return data.data || data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Invalidate cache
   */
  invalidateCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

export const httpClient = new HttpClient();

/**
 * Contexte API pour les composants
 */
export const useApi = () => {
  return {
    // Auth
    login: (email: string, password: string) =>
      httpClient.post('/auth/login', { email, password }),
    register: (data: any) =>
      httpClient.post('/auth/register', data),
    logout: () =>
      httpClient.post('/auth/logout'),
    getMe: () =>
      httpClient.get('/auth/me'),

    // Contracts
    getContracts: (params?: any) =>
      httpClient.get(`/contracts${params ? '?' + new URLSearchParams(params) : ''}`),
    getContract: (id: number) =>
      httpClient.get(`/contracts/${id}`),
    createContract: (data: any) =>
      httpClient.post('/contracts', data),
    updateContract: (id: number, data: any) =>
      httpClient.put(`/contracts/${id}`, data),
    deleteContract: (id: number) =>
      httpClient.delete(`/contracts/${id}`),

    // Payments
    getPayments: (params?: any) =>
      httpClient.get(`/payments${params ? '?' + new URLSearchParams(params) : ''}`),
    getPayment: (id: number) =>
      httpClient.get(`/payments/${id}`),
    createPayment: (data: any) =>
      httpClient.post('/payments', data),
    updatePayment: (id: number, data: any) =>
      httpClient.put(`/payments/${id}`, data),
    deletePayment: (id: number) =>
      httpClient.delete(`/payments/${id}`),

    // Tenants
    getTenants: (params?: any) =>
      httpClient.get(`/tenants${params ? '?' + new URLSearchParams(params) : ''}`),
    getTenant: (id: number) =>
      httpClient.get(`/tenants/${id}`),
    createTenant: (data: any) =>
      httpClient.post('/tenants', data),
    updateTenant: (id: number, data: any) =>
      httpClient.put(`/tenants/${id}`, data),
    deleteTenant: (id: number) =>
      httpClient.delete(`/tenants/${id}`),

    // Dashboard
    getDashboardStats: () =>
      httpClient.get('/dashboard'),

    // Audit
    getAuditLogs: (params?: any) =>
      httpClient.get(`/audit${params ? '?' + new URLSearchParams(params) : ''}`),
  };
};

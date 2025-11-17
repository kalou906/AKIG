import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { getSession, refreshToken } from './auth';

class APIClient {
  private client: AxiosInstance;
  private refreshingToken = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: ajoute token automatiquement
    this.client.interceptors.request.use(
      async (config) => {
        const session = await getSession();
        
        if (session?.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }

        // Request ID pour tracing
        config.headers['X-Request-ID'] = this.generateRequestId();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: gère refresh token automatique
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Si 401 et pas encore retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshingToken) {
            // Attendre que le refresh en cours se termine
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers!.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.refreshingToken = true;

          try {
            const newToken = await refreshToken();
            
            // Notifier tous les subscribers
            this.refreshSubscribers.forEach((cb) => cb(newToken));
            this.refreshSubscribers = [];
            this.refreshingToken = false;

            originalRequest.headers!.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.refreshingToken = false;
            this.refreshSubscribers = [];
            
            // Rediriger vers login si refresh échoue
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  // Méthodes HTTP typées
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new APIClient();

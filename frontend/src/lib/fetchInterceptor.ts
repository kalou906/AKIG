let installed = false;

export function installFetchInterceptor(): void {
  if (installed || typeof window === 'undefined' || typeof window.fetch !== 'function') {
    installed = true;
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const [resource, config] = args;
    const method = (config?.method || 'GET').toUpperCase();
    const url = typeof resource === 'string' ? resource : resource instanceof URL ? resource.toString() : resource.url;

    try {
      const response = await originalFetch(resource as RequestInfo, config);
      if (!response.ok) {
        console.error(`[fetch] ${method} ${url} → HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      console.error(`[fetch] Échec réseau ${method} ${url}:`, error);
      throw error;
    }
  };

  installed = true;
}

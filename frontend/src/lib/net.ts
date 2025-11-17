/**
 * Network utilities avec retry logic
 */

/**
 * Fetch avec retry automatique et backoff exponentiel
 * @param url URL à récupérer
 * @param init Options fetch standard
 * @param retries Nombre de tentatives restantes
 * @param backoffMs Délai en ms avant la prochaine tentative (double à chaque retry)
 * @returns Response
 * @throws Error si toutes les tentatives échouent
 */
export async function fetchRetry(
  url: string,
  init?: RequestInit,
  retries = 2,
  backoffMs = 500
): Promise<Response> {
  try {
    const response = await fetch(url, init);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    // Si pas de retry restant, relancer l'erreur
    if (retries <= 0) {
      throw error;
    }

    // Attendre le backoff puis réessayer
    await new Promise((resolve) => setTimeout(resolve, backoffMs));

    // Retry avec backoff doublé
    return fetchRetry(url, init, retries - 1, backoffMs * 2);
  }
}

/**
 * Delay helper - attendre X ms
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check si l'utilisateur est online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Attend la reconnexion réseau
 */
export async function waitForOnline(maxWaitMs = 30000): Promise<boolean> {
  if (isOnline()) return true;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('online', handleOnline);
      resolve(false);
    }, maxWaitMs);

    const handleOnline = () => {
      clearTimeout(timeout);
      window.removeEventListener('online', handleOnline);
      resolve(true);
    };

    window.addEventListener('online', handleOnline);
  });
}

/**
 * Fetch avec gestion offline
 * Attend la reconnexion si offline, puis réessaye
 */
export async function fetchWithOfflineSupport(
  url: string,
  init?: RequestInit,
  maxOfflineWaitMs = 30000
): Promise<Response> {
  // Si online, faire le fetch normal
  if (isOnline()) {
    return fetchRetry(url, init);
  }

  // Si offline, attendre la reconnexion
  const reconnected = await waitForOnline(maxOfflineWaitMs);
  if (!reconnected) {
    throw new Error('Timeout: Still offline after waiting');
  }

  // Réessayer après reconnexion
  return fetchRetry(url, init);
}

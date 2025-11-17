import { useEffect, useState, useRef } from 'react';
import { withRetry } from '../api/httpRetry';

type UseQueryOptions = {
  retry?: number;          // nombre de tentatives (défaut 0 = pas de retry)
  delayMs?: number;        // délai initial entre tentatives
  enabled?: boolean;       // si false, ne lance pas la requête
  deps?: any[];            // dépendances supplémentaires pour relancer
};

export function useQuery<T>(fetcher: () => Promise<T>, opts: UseQueryOptions = {}) {
  const { retry = 0, delayMs = 300, enabled = true, deps = [] } = opts;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let canceled = false;
    attemptRef.current = 0; // Reset compteur à chaque nouvelle exécution
    setLoading(true);
    setError(null);
    const exec = () => withRetry(fetcher, retry, delayMs)
      .then(res => { if (!canceled) setData(res); })
      .catch(e => { if (!canceled) setError(e instanceof Error ? e.message : 'Erreur inconnue'); })
      .finally(() => { if (!canceled) setLoading(false); });
    attemptRef.current += 1;
    exec();
    return () => { canceled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetcher, retry, delayMs, ...deps]);

  return { data, loading, error, attempts: attemptRef.current };
}

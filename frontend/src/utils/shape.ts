// Utilitaires de normalisation de formes de données
export function ensureItems<T>(data: any): { items: T[] } {
  if (!data) return { items: [] };
  if (Array.isArray(data)) return { items: data };
  if (Array.isArray(data.items)) return { items: data.items };
  return { items: [] };
}

export function ensureNumber(n: any, fallback = 0): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

export function ensureStats(data: any): { stats: any[] } {
  if (!data) return { stats: [] };
  if (Array.isArray(data)) return { stats: data };
  if (Array.isArray(data.stats)) return { stats: data.stats };
  return { stats: [] };
}
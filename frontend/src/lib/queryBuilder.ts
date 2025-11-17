/**
 * Build query strings with parameter filtering
 */

export function buildQuery(
  base: string,
  params: Record<string, any>
): string {
  const q = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    // Only add non-empty, non-null, non-undefined values
    if (v !== undefined && v !== '' && v !== null) {
      q.set(k, String(v));
    }
  });

  const queryString = q.toString();
  return queryString ? `${base}?${queryString}` : base;
}

/**
 * Parse query string into object
 */
export function parseQuery(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

/**
 * Merge query parameters
 */
export function mergeQueryParams(
  base: Record<string, any>,
  overrides: Record<string, any>
): Record<string, any> {
  return { ...base, ...overrides };
}

/**
 * Remove empty parameters
 */
export function cleanParams(
  params: Record<string, any>
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== '' && v !== null
    )
  );
}

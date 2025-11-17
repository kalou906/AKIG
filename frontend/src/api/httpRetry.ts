// Retry exponentiel simple pour appels API instables
export async function withRetry<T>(fn: () => Promise<T>, attempts = 2, delayMs = 300): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (attempts <= 0) throw e;
    await new Promise(r => setTimeout(r, delayMs));
    return withRetry(fn, attempts - 1, Math.round(delayMs * 1.5));
  }
}
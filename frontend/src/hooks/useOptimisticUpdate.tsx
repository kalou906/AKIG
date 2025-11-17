import { useState, useCallback } from 'react';

interface UseOptimisticUpdateReturn<T> {
  state: T;
  setState: React.Dispatch<React.SetStateAction<T>>;
  update: (promise: Promise<unknown>, nextState: Partial<T>) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for optimistic updates
 * Immediately updates UI, reverts on error
 * @param initial Initial state
 * @returns State, setState, update function, reset function
 */
export function useOptimisticUpdate<T>(
  initial: T
): UseOptimisticUpdateReturn<T> {
  const [state, setState] = useState<T>(initial);

  const update = useCallback(
    async (promise: Promise<unknown>, nextState: Partial<T>) => {
      const previous = state;

      // Optimistic update
      setState((prevState) => ({ ...prevState, ...nextState } as T));

      try {
        // Wait for API call
        await promise;
      } catch (error) {
        // Revert on error
        console.error('Optimistic update failed, reverting:', error);
        setState(previous);
        throw error;
      }
    },
    [state]
  );

  const reset = useCallback(() => {
    setState(initial);
  }, [initial]);

  return { state, setState, update, reset };
}

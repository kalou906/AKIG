import React, { useCallback, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface UseToastReturn {
  toasts: ToastMessage[];
  show: (message: string, type?: ToastType, duration?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

let toastId = 0;

/**
 * Hook for managing toast notifications
 * @returns Object with toasts array, show function, remove function, and clear function
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback(
    (message: string, type: ToastType = 'info', duration = 3500) => {
      const id = `toast-${toastId++}`;

      setToasts((prev) => [...prev, { id, message, type, duration }]);

      // Auto-remove after duration
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);

      return () => clearTimeout(timer);
    },
    []
  );

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return { toasts, show, remove, clear };
}

/**
 * Toast display component
 * Should be used with useToast hook
 */
interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove?: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => {
        const bgColor = {
          success: 'bg-green-500',
          error: 'bg-[var(--akigRed)]',
          info: 'bg-[var(--akigBlue)]',
          warning: 'bg-yellow-500',
        }[toast.type];

        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`animate-fade-in rounded-lg px-4 py-2 text-white shadow-lg ${bgColor}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{toast.message}</span>
              {onRemove && (
                <button
                  onClick={() => onRemove(toast.id)}
                  className="text-white hover:opacity-80"
                  aria-label="Fermer"
                  type="button"
                >
                  ✖
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

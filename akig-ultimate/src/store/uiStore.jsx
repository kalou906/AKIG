import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const UIStoreContext = createContext(null);
let nextId = 0;

export function UIStoreProvider({ children }) {
  const timeoutIds = useRef(new Map());
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timeoutId = timeoutIds.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutIds.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    ({ type = "info", message }) => {
      const toast = { id: ++nextId, type, message };
      setToasts((current) => current.concat(toast));
      if (typeof window !== "undefined") {
        const timeoutId = window.setTimeout(() => removeToast(toast.id), 4000);
        timeoutIds.current.set(toast.id, timeoutId);
      }
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({ toasts, pushToast, removeToast }),
    [toasts, pushToast, removeToast]
  );

  return <UIStoreContext.Provider value={value}>{children}</UIStoreContext.Provider>;
}

export function useUIStore() {
  const context = useContext(UIStoreContext);
  if (!context) {
    throw new Error("useUIStore must be used within a UIStoreProvider");
  }
  return context;
}

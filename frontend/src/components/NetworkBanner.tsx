import React, { useEffect, useState } from 'react';

/**
 * Banner affichant le statut de la connexion réseau
 * Affiche une notification jaune quand offline
 */
export function NetworkBanner() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-sm px-4 py-2 text-center z-50"
    >
      ⚠️ Hors ligne — certaines fonctions sont limitées
    </div>
  );
}

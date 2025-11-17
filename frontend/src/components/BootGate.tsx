import React from 'react';

interface BootGateProps {
  status: 'checking' | 'ok' | 'degraded';
  message?: string;
  retrying?: boolean;
}

export function BootGate({ status, message = 'Initialisation du système…', retrying = false }: BootGateProps) {
  const subtitle =
    status === 'checking'
      ? 'Connexion à l’API et vérification des modules actifs.'
      : retrying
      ? 'Nouvelle tentative de connexion en cours…'
      : 'Chargement en cours…';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-emerald-500/10">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <svg
              className="h-6 w-6 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">AKIG se prépare</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">{message}</h1>
          </div>
        </div>
        <p className="mt-6 text-sm text-slate-300/80">{subtitle}</p>
        <div className="mt-8 space-y-2 text-xs text-slate-400">
          <p>✔️ Vérification de la base de données</p>
          <p>✔️ Synchronisation des modules (paiements, SMS, impayés)</p>
          <p>✔️ Activation des protections contre les pages blanches</p>
        </div>
      </div>
    </div>
  );
}

export default BootGate;

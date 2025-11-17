import React from 'react';

const steps = [
  'Sélectionnez un contrat ou créez un locataire test en un clic.',
  'Saisissez le montant, la période et validez le paiement.',
  'Générez automatiquement le reçu PDF et archivez-le dans Akig.',
];

export default function PaymentsQuickAction(): React.ReactElement {
  return (
    <div className="rounded-2xl bg-slate-900/80 p-6 shadow-lg shadow-black/20 ring-1 ring-white/10">
      <header className="flex items-center gap-3 text-emerald-300">
        <span className="text-3xl" role="img" aria-label="Paiements">
          💳
        </span>
        <div>
          <h3 className="text-xl font-semibold text-white">Paiements en 2 minutes</h3>
          <p className="text-sm text-slate-300">Réduisez les erreurs et gardez un suivi clair pour votre équipe.</p>
        </div>
      </header>
      <ol className="mt-6 space-y-4 text-sm text-slate-200">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-slate-900">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <footer className="mt-6 text-xs text-slate-400">
        Les écritures sont automatiquement synchronisées dans le tableau de bord financier.
      </footer>
    </div>
  );
}

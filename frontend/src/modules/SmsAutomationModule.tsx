import React from 'react';

const smsExamples = [
  {
    title: 'Confirmation automatique',
    message: 'Bonjour Mme Diallo, nous confirmons la réception de 3 200 000 GNF pour le bail #AK-984. Merci.'
  },
  {
    title: 'Relance courtoise',
    message: 'Bonjour M. Camara, votre loyer du 05/10 est en attente. Merci de régulariser avant le 12/10.'
  },
  {
    title: 'Rappel d’échéance',
    message: 'Bonjour Mme Bah, votre loyer arrive à échéance dans 3 jours. Réglez directement par virement BCRG.'
  }
];

export default function SmsAutomationModule(): React.ReactElement {
  return (
    <div className="rounded-2xl bg-slate-900/80 p-6 shadow-lg shadow-black/20 ring-1 ring-white/10">
      <header className="flex items-start gap-3 text-cyan-300">
        <span className="text-3xl" role="img" aria-label="SMS">
          📨
        </span>
        <div>
          <h3 className="text-xl font-semibold text-white">SMS automatiques aux propriétaires</h3>
          <p className="text-sm text-slate-300">
            Maintenez la confiance et la transparence sans quitter AKIG.
          </p>
        </div>
      </header>
      <div className="mt-6 space-y-4">
        {smsExamples.map((example) => (
          <article key={example.title} className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4">
            <h4 className="text-sm font-semibold text-cyan-200">{example.title}</h4>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-200">{example.message}</p>
          </article>
        ))}
      </div>
      <footer className="mt-6 text-xs text-slate-400">
        Historique centralisé, heure d’envoi tracée, accusés consultables dans le panneau Diagnostics.
      </footer>
    </div>
  );
}

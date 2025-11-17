import React from 'react';

const arrearsData = [
  { zone: 'Lambagni', amount: 3800000, tenants: 4 },
  { zone: 'Ratoma', amount: 5200000, tenants: 6 },
  { zone: 'Matoto', amount: 2100000, tenants: 3 },
];

export default function ArrearsDashboardModule(): React.ReactElement {
  const totalAmount = arrearsData.reduce((total, item) => total + item.amount, 0);

  return (
    <div className="rounded-2xl bg-slate-900/80 p-6 shadow-lg shadow-black/20 ring-1 ring-white/10">
      <header className="flex items-start gap-3 text-amber-300">
        <span className="text-3xl" role="img" aria-label="Impayés">
          📊
        </span>
        <div>
          <h3 className="text-xl font-semibold text-white">Tableau des impayés en temps réel</h3>
          <p className="text-sm text-slate-300">
            Priorisez les relances par zone et identifiez les dossiers critiques en un coup d’œil.
          </p>
        </div>
      </header>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-amber-500/30 bg-slate-900/60 p-4">
          <h4 className="text-sm font-semibold text-amber-200">Total impayés</h4>
          <p className="mt-2 text-3xl font-bold text-amber-400">
            {totalAmount.toLocaleString('fr-FR')} GNF
          </p>
          <p className="text-xs text-slate-400">Mise à jour automatique toutes les heures.</p>
        </article>
        <article className="rounded-xl border border-amber-500/30 bg-slate-900/60 p-4">
          <h4 className="text-sm font-semibold text-amber-200">Actions immédiates</h4>
          <ul className="mt-2 space-y-2 text-sm text-slate-200">
            <li>• Relancer les 3 dossiers &gt; 1,5M GNF</li>
            <li>• Programmer une visite sur Lambagni</li>
            <li>• Envoyer un plan de paiement par SMS</li>
          </ul>
        </article>
      </div>
      <table className="mt-6 w-full text-left text-sm text-slate-200">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-slate-400">
            <th className="pb-2">Zone</th>
            <th className="pb-2">Montant</th>
            <th className="pb-2">Locataires concernés</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {arrearsData.map((item) => (
            <tr key={item.zone}>
              <td className="py-2 font-semibold text-white">{item.zone}</td>
              <td className="py-2">{item.amount.toLocaleString('fr-FR')} GNF</td>
              <td className="py-2">{item.tenants}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useApiClient } from '../context/AuthContext';

type Contract = {
  id: number;
  title?: string;
  party?: string;
  site?: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  amount?: number | null;
};

function formatAmount(amount?: number | null) {
  if (!amount) return '—';
  return `GNF ${amount.toLocaleString('fr-GN')}`;
}

function contractStatusLabel(status?: string) {
  switch (status) {
    case 'active':
      return { label: 'Actif', badgeClass: 'bg-emerald-100 text-emerald-700' };
    case 'pending':
      return { label: 'En attente', badgeClass: 'bg-amber-100 text-amber-700' };
    case 'terminated':
      return { label: 'Résilié', badgeClass: 'bg-red-100 text-red-700' };
    default:
      return { label: status ?? 'Indéterminé', badgeClass: 'bg-slate-100 text-slate-700' };
  }
}

export default function ContractsPage(): JSX.Element {
  const api = useApiClient();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .get<Contract[]>('/contracts', { signal: controller.signal })
      .then((data) => {
        setContracts(data ?? []);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Unable to load contracts', err);
        setError((err as any)?.message ?? 'Chargement des contrats impossible.');
        setContracts([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [api]);

  const metrics = useMemo(() => {
    const activeContracts = contracts.filter((contract) => contract.status === 'active');
    const totalAmount = activeContracts.reduce((acc, contract) => acc + (contract.amount ?? 0), 0);

    const expiringSoon = contracts.filter((contract) => {
      if (!contract.end_date) return false;
      const end = new Date(contract.end_date);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 90;
    }).length;

    return {
      activeCount: activeContracts.length,
      expiringSoon,
      totalAmount,
    };
  }, [contracts]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-akig-blue/70">Contrats actifs</p>
          <p className="mt-2 text-3xl font-bold text-akig-blue">{metrics.activeCount}</p>
          <p className="text-sm text-akig-blue/60">Portefeuille AKIG Première</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-akig-blue/70">Renouvellements 90 j</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{metrics.expiringSoon}</p>
          <p className="text-sm text-akig-blue/60">Mises à jour juridiques requises</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-akig-blue/70">Valeur mensuelle</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{formatAmount(metrics.totalAmount)}</p>
          <p className="text-sm text-akig-blue/60">Flux locatif consolidé</p>
        </div>
      </div>

      <div className="glass-card shadow-premium">
        <div className="flex items-center justify-between border-b border-white/40 bg-white/60 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-akig-blue">Cycle contractuel</h2>
            <p className="text-sm text-akig-blue/60">Analyse proactive des renouvellements et ajustements de loyers.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-akig-blue px-4 py-2 text-sm font-semibold text-white shadow"
          >
            ✍️ Générer un avenant
          </button>
        </div>

        {loading && <div className="px-6 py-6 text-sm text-akig-blue/60">Chargement des contrats…</div>}
        {error && !loading && (
          <div className="px-6 py-6 text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && (
          <ul className="divide-y divide-akig-blue/10">
            {contracts.map((contract) => {
              const status = contractStatusLabel(contract.status);
              return (
                <li key={contract.id} className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-akig-blue">Contrat #{contract.id}</p>
                    <p className="text-base font-semibold text-akig-blue">{contract.party ?? contract.title ?? '—'}</p>
                    <p className="text-sm text-akig-blue/60">
                      {contract.site ?? 'Site non renseigné'} · Début {contract.start_date?.slice(0, 10) ?? 'n/a'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex rounded-full bg-akig-blue/10 px-3 py-1 font-semibold text-akig-blue/80">
                      {formatAmount(contract.amount)}
                    </span>
                    <span className={`inline-flex rounded-full px-3 py-1 font-semibold ${status.badgeClass}`}>
                      {status.label}
                    </span>
                    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700">
                      Échéance {contract.end_date?.slice(0, 10) ?? 'n/a'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

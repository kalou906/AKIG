import { useEffect, useMemo, useState } from 'react';
import { useApiClient } from '../context/AuthContext';

type Tenant = {
  id: number;
  full_name: string;
  phone?: string | null;
  owner?: string | null;
  site?: string | null;
  monthly_rent?: number | null;
  arrears_amount?: number | null;
  arrears_months?: number | null;
  status?: string | null;
};

type Filters = {
  query: string;
  year: number;
  status: string;
};

type ApiResponse = {
  items: Tenant[];
  total: number;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatStatus(tenant: Tenant): { label: string; tone: 'success' | 'warning' | 'danger' } {
  if ((tenant.arrears_months ?? 0) === 0) {
    return { label: 'À jour', tone: 'success' };
  }

  if ((tenant.arrears_months ?? 0) > 2) {
    return { label: 'Retard', tone: 'danger' };
  }

  return { label: 'En alerte', tone: 'warning' };
}

export default function TenantsPage(): JSX.Element {
  const api = useApiClient();
  const [filters, setFilters] = useState<Filters>({
    query: '',
    year: new Date().getFullYear(),
    status: '',
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    if (filters.status) params.set('status', filters.status);
    params.set('year', String(filters.year));

    api
      .get<ApiResponse>(`/tenants?${params.toString()}`, { signal: controller.signal })
      .then((response) => {
        setTenants(response.items ?? []);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Unable to load tenants', err);
        setError((err as any)?.message ?? "Chargement impossible." );
        setTenants([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [api, filters]);

  const metrics = useMemo(() => {
    const totalRent = tenants.reduce((acc, tenant) => acc + (tenant.monthly_rent ?? 0), 0);
    const totalArrears = tenants.reduce((acc, tenant) => acc + (tenant.arrears_amount ?? 0), 0);
    const complianceRate = Math.round(((totalRent - totalArrears) / (totalRent || 1)) * 100);

    return {
      totalRent,
      totalArrears,
      complianceRate,
      tenantsCount: tenants.length,
    };
  }, [tenants]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-sm font-semibold text-akig-blue/70 uppercase tracking-wide">Loyer cumulé</p>
          <p className="mt-2 text-2xl font-bold text-akig-blue">{formatCurrency(metrics.totalRent)}</p>
          <p className="text-sm text-akig-blue/60">{metrics.tenantsCount} locataires actifs</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-semibold text-akig-blue/70 uppercase tracking-wide">Impayés actuels</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{formatCurrency(metrics.totalArrears)}</p>
          <p className="text-sm text-akig-blue/60">Suivi rapproché AKIG Première</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-semibold text-akig-blue/70 uppercase tracking-wide">Taux de recouvrement</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{metrics.complianceRate}%</p>
          <p className="text-sm text-akig-blue/60">Projection consolidée</p>
        </div>
      </div>

      <div className="glass-card shadow-premium overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/40 bg-white/60 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-akig-blue">Portefeuille locataires</h2>
            <p className="text-sm text-akig-blue/60">Synchronisation automatique des profils et contrats liés.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="search"
              placeholder="Rechercher un locataire"
              value={filters.query}
              onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              className="rounded-full border border-akig-blue/20 bg-white/80 px-4 py-2 text-akig-blue outline-none ring-akig-blue/20 focus:ring-2"
            />
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="rounded-full border border-akig-blue/20 bg-white/80 px-4 py-2 text-akig-blue outline-none ring-akig-blue/20 focus:ring-2"
            >
              <option value="">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="terminated">Résiliés</option>
            </select>
            <select
              value={filters.year}
              onChange={(event) => setFilters((prev) => ({ ...prev, year: Number(event.target.value) }))}
              className="rounded-full border border-akig-blue/20 bg-white/80 px-4 py-2 text-akig-blue outline-none ring-akig-blue/20 focus:ring-2"
            >
              {[0, 1, 2].map((offset) => {
                const year = new Date().getFullYear() - offset;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {loading && (
          <div className="px-6 py-10 text-center text-sm text-akig-blue/60">Chargement des locataires…</div>
        )}

        {error && !loading && (
          <div className="px-6 py-4 text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-akig-blue/10 text-sm">
              <thead className="bg-akig-blue/5 text-left uppercase tracking-wide text-akig-blue/70">
                <tr>
                  <th className="px-6 py-3 font-semibold">Locataire</th>
                  <th className="px-6 py-3 font-semibold">Site</th>
                  <th className="px-6 py-3 font-semibold">Contact</th>
                  <th className="px-6 py-3 font-semibold">Statut</th>
                  <th className="px-6 py-3 font-semibold text-right">Loyer</th>
                  <th className="px-6 py-3 font-semibold text-right">Impayés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-akig-blue/10 bg-white/70">
                {tenants.map((tenant) => {
                  const status = formatStatus(tenant);
                  return (
                    <tr key={tenant.id} className="transition hover:bg-akig-blue/5">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-akig-blue">{tenant.full_name}</p>
                        <p className="text-xs text-akig-blue/50">Contrat #{tenant.id}</p>
                      </td>
                      <td className="px-6 py-4 text-akig-blue/70">{tenant.site ?? '—'}</td>
                      <td className="px-6 py-4 text-akig-blue/70">{tenant.phone ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            status.tone === 'success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : status.tone === 'danger'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-akig-blue/80">
                        {tenant.monthly_rent ? formatCurrency(tenant.monthly_rent) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-red-600">
                        {tenant.arrears_amount ? formatCurrency(tenant.arrears_amount) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

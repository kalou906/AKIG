import { useEffect, useMemo, useState } from 'react';
import { useApiClient } from '../context/AuthContext';

type PaymentPerformance = {
  period: {
    month: number;
    year: number;
  };
  statistics: {
    total_due: number | string | null;
    paid_count: number | string | null;
    partial_count: number | string | null;
    pending_count: number | string | null;
    overdue_count: number | string | null;
    payment_rate: number | string | null;
    total_due_amount: number | string | null;
    total_paid_amount: number | string | null;
    total_balance: number | string | null;
  };
};

type RevenueAnalytics = {
  summary?: {
    total_revenue?: number | string | null;
    payment_count?: number | string | null;
    avg_payment?: number | string | null;
  };
  monthlyRevenue?: Array<{
    month: string;
    revenue: number | string | null;
    transaction_count: number | string | null;
  }>;
  propertyRevenue?: Array<{
    id?: number | null;
    name?: string | null;
    revenue?: number | string | null;
    payment_count?: number | string | null;
    tenant_count?: number | string | null;
  }>;
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
}

function formatMonth(monthIso: string): string {
  const date = new Date(monthIso);
  if (Number.isNaN(date.getTime())) {
    return 'Période inconnue';
  }
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function ChargesPage(): JSX.Element {
  const api = useApiClient();
  const [performance, setPerformance] = useState<PaymentPerformance | null>(null);
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'GNF',
        maximumFractionDigits: 0,
      }),
    []
  );

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const [perf, rev] = await Promise.all([
          api.get<PaymentPerformance>('/analytics/payment-performance', { signal: controller.signal }),
          api.get<RevenueAnalytics>('/analytics/revenue', { signal: controller.signal }),
        ]);

        if (cancelled) {
          return;
        }

        setPerformance(perf);
        setRevenue(rev);
      } catch (err) {
        if (cancelled) {
          return;
        }
        if ((err as { name?: string }).name === 'AbortError') {
          return;
        }
        setError('Impossible de charger les indicateurs de charges AKIG.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [api]);

  const statistics = performance?.statistics;
  const totalDueAmount = statistics ? toNumber(statistics.total_due_amount) : 0;
  const totalPaidAmount = statistics ? toNumber(statistics.total_paid_amount) : 0;
  const outstandingBalance = statistics ? toNumber(statistics.total_balance) : 0;
  const paymentRate = statistics ? toNumber(statistics.payment_rate) : 0;
  const paidCount = statistics ? toNumber(statistics.paid_count) : 0;
  const pendingCount = statistics ? toNumber(statistics.pending_count) : 0;
  const overdueCount = statistics ? toNumber(statistics.overdue_count) : 0;

  const cards = [
    {
      title: 'Encaissements réalisés',
      value: currencyFormatter.format(totalPaidAmount),
      detail: `${paidCount} paiements confirmés`,
      tone: 'positive' as const,
    },
    {
      title: 'Charges exigibles',
      value: currencyFormatter.format(totalDueAmount),
      detail: `Taux de collecte ${numberFormatter.format(paymentRate)}%`,
      tone: 'info' as const,
    },
    {
      title: 'Solde à recouvrer',
      value: currencyFormatter.format(outstandingBalance),
      detail: `${pendingCount + overdueCount} échéances à sécuriser`,
      tone: outstandingBalance > 0 ? ('warning' as const) : ('positive' as const),
    },
  ];

  const monthlyHighlights = revenue?.monthlyRevenue?.slice(0, 4) ?? [];
  const topProperties = revenue?.propertyRevenue?.slice(0, 4) ?? [];

  if (loading) {
    return (
      <div className="glass-card p-6 text-sm text-akig-blue/70">
        Synchronisation des indicateurs financiers AKIG…
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card border border-akig-red/30 bg-white/80 p-6 text-sm text-akig-red">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="glass-card space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-akig-blue/60">{card.title}</p>
            <p className="text-3xl font-bold text-akig-blue">{card.value}</p>
            <p
              className={`text-sm font-semibold ${
                card.tone === 'warning'
                  ? 'text-akig-red'
                  : card.tone === 'positive'
                    ? 'text-emerald-600'
                    : 'text-akig-blue/70'
              }`}
            >
              {card.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-akig-blue">Flux d'encaissements</h2>
          <p className="mt-2 text-sm text-akig-blue/70">Performance mensuelle des paiements AKIG.</p>

          <ul className="mt-6 space-y-3 text-sm">
            {monthlyHighlights.length === 0 ? (
              <li className="rounded-2xl border border-akig-blue/10 bg-white/80 p-4 text-akig-blue/70">
                Aucun flux disponible pour la période sélectionnée.
              </li>
            ) : (
              monthlyHighlights.map((item) => (
                <li key={item.month} className="rounded-2xl border border-akig-blue/10 bg-white/80 p-4">
                  <p className="font-semibold text-akig-blue">{formatMonth(item.month)}</p>
                  <p className="text-xs uppercase tracking-wide text-akig-blue/50">
                    {toNumber(item.transaction_count)} transactions
                  </p>
                  <div className="mt-2 flex items-center justify-between text-akig-blue/70">
                    <span>Encaissements</span>
                    <span className="font-semibold text-akig-blue">
                      {currencyFormatter.format(toNumber(item.revenue))}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <aside className="glass-card space-y-4 p-6">
          <div>
            <h3 className="text-base font-semibold text-akig-blue">Meilleures contributions</h3>
            <p className="text-sm text-akig-blue/60">Top propriétés par revenus ce trimestre.</p>
          </div>
          <ul className="space-y-3 text-sm">
            {topProperties.length === 0 ? (
              <li className="rounded-2xl border border-akig-blue/10 bg-white/80 p-4 text-akig-blue/70">
                Pas encore de revenus enregistrés.
              </li>
            ) : (
              topProperties.map((property) => (
                <li key={`${property.id ?? 'property'}-${property.name ?? 'unknown'}`} className="rounded-2xl border border-akig-blue/10 bg-white/80 p-4">
                  <p className="font-semibold text-akig-blue">{property.name ?? 'Propriété sans nom'}</p>
                  <p className="text-xs uppercase tracking-wide text-akig-blue/50">
                    {toNumber(property.payment_count)} règlements | {toNumber(property.tenant_count)} locataires
                  </p>
                  <div className="mt-2 flex items-center justify-between text-akig-blue/70">
                    <span>Revenus</span>
                    <span className="font-semibold text-akig-blue">
                      {currencyFormatter.format(toNumber(property.revenue))}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}

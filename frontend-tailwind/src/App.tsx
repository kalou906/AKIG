import { useEffect, useMemo, useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import TenantsPage from './pages/TenantsPage';
import ContractsPage from './pages/ContractsPage';
import BuildingsPage from './pages/BuildingsPage';
import ChargesPage from './pages/ChargesPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import { useAuth, useApiClient } from './context/AuthContext';

export type TabKey = 'tenants' | 'contracts' | 'buildings' | 'charges' | 'contact';

type NavItem = {
  key: TabKey;
  label: string;
  icon: string;
  description: string;
};

type KpiCard = {
  id: string;
  title: string;
  value: string;
  delta: string;
  direction: 'up' | 'down';
  tone: 'primary' | 'danger' | 'outline';
};

const NAV_ITEMS: NavItem[] = [
  {
    key: 'tenants',
    label: 'Locataires',
    icon: '👥',
    description: 'Suivi premium des profils locataires et contrôle des impayés clés.'
  },
  {
    key: 'contracts',
    label: 'Contrats',
    icon: '📑',
    description: 'Gestion proactive des baux, renouvellements et avenants stratégiques.'
  },
  {
    key: 'buildings',
    label: 'Immeubles',
    icon: '🏢',
    description: 'Cartographie du patrimoine AKIG et pilotage des rénovations prioritaires.'
  },
  {
    key: 'charges',
    label: 'Charges',
    icon: '💸',
    description: 'Analyse cash-flow, charges récupérables et optimisation budgétaire.'
  },
  {
    key: 'contact',
    label: 'Contact',
    icon: '🤝',
    description: 'Accès direct à l’équipe AKIG Première et aux services exclusifs.'
  }
];

const DEFAULT_KPIS: KpiCard[] = [
  {
    id: 'occupancy',
    title: "Taux d'occupation",
    value: '—',
    delta: 'En attente des données',
    direction: 'up',
    tone: 'primary',
  },
  {
    id: 'arrears',
    title: 'Risque impayés maîtrisé',
    value: '—',
    delta: 'Synchronisation en cours',
    direction: 'down',
    tone: 'danger',
  },
  {
    id: 'cashflow',
    title: 'Flux de trésorerie',
    value: '—',
    delta: 'Prévisions indisponibles',
    direction: 'up',
    tone: 'outline',
  },
];

const QUICK_ACTIONS = [
  { icon: '✍️', label: 'Créer un bail corporate' },
  { icon: '📨', label: 'Envoyer rappel de paiement' },
  { icon: '🧾', label: 'Publier un rapport trimestriel' },
  { icon: '🛠️', label: 'Lancer une intervention technique' }
];

function renderTabContent(tab: TabKey): JSX.Element {
  switch (tab) {
    case 'tenants':
      return <TenantsPage />;
    case 'contracts':
      return <ContractsPage />;
    case 'buildings':
      return <BuildingsPage />;
    case 'charges':
      return <ChargesPage />;
    case 'contact':
      return <ContactPage />;
    default:
      return <TenantsPage />;
  }
}

export default function App(): JSX.Element {
  const { user, loading, logout } = useAuth();
  const api = useApiClient();
  const [tab, setTab] = useState<TabKey>('tenants');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [kpis, setKpis] = useState<KpiCard[]>(DEFAULT_KPIS);

  useEffect(() => {
    let cancelled = false;

    async function fetchMetrics() {
      if (!user) return;

      try {
        const [occupancy, financial, tenants] = await Promise.allSettled([
          api.get<{ data: { occupancy_rate: number; occupied: number; vacant: number } }>('/metrics/occupancy'),
          api.get<{ data: { collected: number; arrears: number; collection_rate: number } }>('/metrics/financial'),
          api.get<{ data: { total?: number; in_default?: number } }>('/metrics/tenants'),
        ]);

        if (cancelled) return;

        setKpis([
          {
            id: 'occupancy',
            title: "Taux d'occupation",
            value:
              occupancy.status === 'fulfilled' && occupancy.value.data.occupancy_rate !== null
                ? `${occupancy.value.data.occupancy_rate ?? 0}%`
                : '—',
            delta:
              occupancy.status === 'fulfilled'
                ? `${occupancy.value.data.occupied ?? 0} unités occupées`
                : 'Données indisponibles',
            direction: 'up',
            tone: 'primary',
          },
          {
            id: 'arrears',
            title: 'Risque impayés maîtrisé',
            value:
              tenants.status === 'fulfilled'
                ? `${tenants.value.data.in_default ?? 0} dossiers`
                : '—',
            delta:
              tenants.status === 'fulfilled'
                ? `${tenants.value.data.total ?? 0} locataires actifs`
                : 'Synchronisation en cours',
            direction: 'down',
            tone: 'danger',
          },
          {
            id: 'cashflow',
            title: 'Flux de trésorerie',
            value:
              financial.status === 'fulfilled'
                ? `GNF ${(financial.value.data.collected ?? 0).toLocaleString('fr-GN')}`
                : '—',
            delta:
              financial.status === 'fulfilled'
                ? `Arriérés: GNF ${(financial.value.data.arrears ?? 0).toLocaleString('fr-GN')}`
                : 'Prévisions indisponibles',
            direction: 'up',
            tone: 'outline',
          },
        ]);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load metrics', error);
          setKpis(DEFAULT_KPIS);
        }
      }
    }

    fetchMetrics();

    return () => {
      cancelled = true;
    };
  }, [api, user]);

  const activeNav = useMemo(() => NAV_ITEMS.find((item) => item.key === tab), [tab]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-akig-bg text-akig-blue">
        <div className="glass-card flex items-center gap-3 px-6 py-4 text-sm font-semibold">
          <span className="text-lg">⏳</span>
          Initialisation de votre session AKIG…
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-akig-bg to-white">
      <aside
        className={`brand-gradient fixed inset-y-0 left-0 z-30 flex w-72 transform flex-col gap-6 px-6 py-8 text-white shadow-premium transition duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-akig-red to-akig-gold text-lg font-bold shadow">
              AK
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/80">Alliance Kaba</p>
              <p className="text-lg font-semibold">AKIG Première</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full bg-white/10 p-2 text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-2" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setTab(item.key);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-white/15 ${
                tab === item.key ? 'bg-white/20 shadow-lg backdrop-blur-sm' : 'bg-transparent'
              }`}
              aria-current={tab === item.key ? 'page' : undefined}
            >
              <span aria-hidden className="text-lg">{item.icon}</span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-xs text-white/70">{item.description}</span>
              </div>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-3xl bg-white/10 p-4 shadow-lg backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Conciergerie</p>
            <p className="mt-2 text-lg font-semibold">AKIG Première</p>
            <p className="text-sm text-white/70">Accès direct aux experts fonciers et juridiques.</p>
            <button
              type="button"
              className="mt-4 w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-akig-blue shadow"
            >
              Contacter un expert
            </button>
          </div>
          <div className="flag-strip" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:ml-0">
        <header className="sticky top-0 z-20 border-b border-akig-blue/10 bg-white/90 px-4 py-4 backdrop-blur lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-akig-blue/10 bg-white p-2 text-akig-blue shadow lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Ouvrir la navigation"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-akig-blue/40">🔍</span>
                <input
                  type="search"
                  placeholder="Rechercher un locataire, un contrat ou un site..."
                  className="w-full rounded-full border border-akig-blue/15 bg-white py-2 pl-10 pr-4 text-sm text-akig-blue shadow focus:border-akig-blue focus:outline-none focus:ring-2 focus:ring-akig-blue/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-akig-red/10 px-3 py-1 text-sm font-semibold text-akig-red">
                🔔 3 alertes
              </span>
              <div className="flex items-center gap-2">
                <span className="hidden text-right text-xs text-akig-blue/60 sm:block">
                  {user.name || user.email}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-akig-blue text-sm font-semibold text-white shadow transition hover:opacity-90"
                  title="Se déconnecter"
                >
                  {user.name?.slice(0, 2).toUpperCase() ?? 'AK'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-akig-blue/70 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide">Navigation rapide</p>
            <div className="flex flex-wrap gap-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    tab === item.key
                      ? 'border-akig-blue bg-akig-blue text-white'
                      : 'border-akig-blue/20 bg-white text-akig-blue'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-8 px-4 py-8 lg:px-10">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-akig-blue">Tableau de bord AKIG</h1>
              <p className="text-sm text-akig-blue/70">Gestion premium du patrimoine immobilier guinéen.</p>
            </div>
            <span className="rounded-full border border-akig-blue/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-akig-blue/70">
              Programme Première
            </span>
          </section>

          <p className="text-sm text-akig-blue/70">{activeNav?.description}</p>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kpis.map((card) => (
              <div
                key={card.id}
                className={`rounded-2xl border p-5 shadow transition ${
                  card.tone === 'primary'
                    ? 'border-transparent bg-gradient-to-br from-akig-blue to-akig-blueDark text-white'
                    : card.tone === 'danger'
                      ? 'border-transparent bg-gradient-to-br from-akig-red to-rose-500 text-white'
                      : 'border-akig-blue/15 bg-white/80 text-akig-blue'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide">{card.title}</p>
                <p className="mt-3 text-3xl font-bold">{card.value}</p>
                <p className="mt-2 text-sm font-semibold">
                  {card.direction === 'up' ? '▲' : '▼'} {card.delta}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-akig-blue/10 bg-white/80 p-6 shadow">
            <header className="flex flex-col gap-4 border-b border-akig-blue/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-akig-blue">Gestion en temps réel</h2>
                <p className="text-sm text-akig-blue/70">{activeNav?.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 rounded-full border border-akig-blue/15 bg-akig-blue/5 p-2">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                      tab === item.key
                        ? 'bg-akig-blue text-white shadow'
                        : 'text-akig-blue hover:bg-white'
                    }`}
                    aria-pressed={tab === item.key}
                  >
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </header>

            <div className="pt-6">{renderTabContent(tab)}</div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-3xl border border-akig-blue/10 bg-white/80 p-6 shadow">
              <header className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-akig-blue">Actions rapides Premium</h2>
                <p className="text-sm text-akig-blue/70">Accédez aux workflows les plus utilisés par les gestionnaires AKIG.</p>
              </header>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="flex items-center gap-3 rounded-2xl border border-akig-blue/15 bg-white px-4 py-4 text-left text-sm font-semibold text-akig-blue shadow transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-akig-blue/10 text-lg">
                      {action.icon}
                    </span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <aside className="brand-gradient flex flex-col gap-3 rounded-3xl p-6 text-white shadow-premium">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Guinée</p>
              <h3 className="text-xl font-semibold">Allié stratégique du foncier</h3>
              <p className="text-sm text-white/80">
                Nos analystes affaires publiques surveillent l’évolution réglementaire pour sécuriser vos acquisitions.
              </p>
              <button
                type="button"
                className="mt-auto inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-akig-blue shadow"
              >
                Consulter le brief marché
              </button>
            </aside>
          </section>

          <div className="flag-strip">
            <span />
            <span />
            <span />
          </div>
        </main>
      </div>
    </div>
  );
}

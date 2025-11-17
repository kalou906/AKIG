import { useEffect, useMemo, useState } from 'react';
import { useApiClient } from '../context/AuthContext';

type Property = {
  id: number;
  name: string;
  address: string;
  city: string;
  property_type?: string;
  owner_name?: string;
  status?: string;
  total_units?: number | string | null;
  rented_units?: number | string | null;
  available_units?: number | string | null;
};

type PropertiesResponse = {
  items?: Property[];
  total?: number;
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
}

function formatOccupancy(rented: number, total: number): string {
  if (total === 0) {
    return '—';
  }
  return `${Math.round((rented / total) * 100)}%`;
}

export default function BuildingsPage(): JSX.Element {
  const api = useApiClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadProperties() {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<PropertiesResponse>(
          '/properties?pageSize=9&status=active',
          { signal: controller.signal }
        );

        if (cancelled) {
          return;
        }

        setProperties(response.items ?? []);
      } catch (err) {
        if (cancelled) {
          return;
        }
        if ((err as { name?: string }).name === 'AbortError') {
          return;
        }
        setError('Impossible de charger les immeubles AKIG.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProperties();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [api]);

  const summary = useMemo(() => {
    if (properties.length === 0) {
      return {
        totalProperties: 0,
        totalUnits: 0,
        rentedUnits: 0,
        availableUnits: 0,
        averageOccupancy: 0,
      };
    }

    const totals = properties.reduce(
      (acc, property) => {
        const totalUnits = toNumber(property.total_units);
        const rentedUnits = toNumber(property.rented_units);
        const availableUnits = toNumber(property.available_units);

        acc.totalUnits += totalUnits;
        acc.rentedUnits += rentedUnits;
        acc.availableUnits += availableUnits;
        acc.totalOccupancy += totalUnits > 0 ? rentedUnits / totalUnits : 0;
        return acc;
      },
      { totalUnits: 0, rentedUnits: 0, availableUnits: 0, totalOccupancy: 0 }
    );

    return {
      totalProperties: properties.length,
      totalUnits: totals.totalUnits,
      rentedUnits: totals.rentedUnits,
      availableUnits: totals.availableUnits,
      averageOccupancy: properties.length > 0 ? Math.round((totals.totalOccupancy / properties.length) * 100) : 0,
    };
  }, [properties]);

  if (loading) {
    return (
      <div className="glass-card p-6 text-sm text-akig-blue/70">
        Chargement des actifs patrimoniaux AKIG…
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

  if (properties.length === 0) {
    return (
      <div className="glass-card p-6 text-sm text-akig-blue/70">
        Aucun immeuble actif n'a encore été synchronisé.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => {
          const totalUnits = toNumber(property.total_units);
          const rentedUnits = toNumber(property.rented_units);
          const availableUnits = toNumber(property.available_units);

          return (
            <article key={property.id} className="glass-card flex flex-col gap-4 p-6">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-akig-blue/60">{property.id}</p>
                  <h3 className="text-xl font-semibold text-akig-blue">{property.name}</h3>
                  <p className="text-sm text-akig-blue/60">{property.address}, {property.city}</p>
                </div>
                <span className="brand-gradient rounded-full px-4 py-2 text-sm font-semibold text-white shadow">
                  {formatOccupancy(rentedUnits, totalUnits)}
                </span>
              </header>

              <div className="space-y-2 text-sm text-akig-blue/80">
                <p className="font-semibold text-akig-blue">Profil patrimonial</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-akig-blue/10 px-3 py-1 text-xs font-semibold text-akig-blue/80">
                    {property.property_type ?? 'Type non défini'}
                  </span>
                  {property.owner_name ? (
                    <span className="rounded-full bg-akig-blue/10 px-3 py-1 text-xs font-semibold text-akig-blue/80">
                      {property.owner_name}
                    </span>
                  ) : null}
                  {property.status ? (
                    <span className="rounded-full bg-akig-blue/10 px-3 py-1 text-xs font-semibold text-akig-blue/80">
                      Statut: {property.status}
                    </span>
                  ) : null}
                </div>
              </div>

              <footer className="mt-auto grid gap-1 rounded-2xl border border-akig-blue/10 bg-white/70 p-4 text-xs text-akig-blue/70">
                <div className="flex items-center justify-between">
                  <span>Total unités</span>
                  <span className="font-semibold text-akig-blue">{totalUnits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Occupées</span>
                  <span className="font-semibold text-akig-blue">{rentedUnits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Disponibles</span>
                  <span className="font-semibold text-akig-blue">{availableUnits}</span>
                </div>
              </footer>
            </article>
          );
        })}
      </div>

      <div className="glass-card space-y-4 p-6">
        <h2 className="text-lg font-semibold text-akig-blue">Vision portefeuille AKIG</h2>
        <p className="text-sm text-akig-blue/70">
          {summary.totalProperties} immeubles actifs couvrant {summary.totalUnits} unités, avec un taux d'occupation moyen de {summary.averageOccupancy}%.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-akig-blue/10 bg-white/70 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-akig-blue/60">Unités occupées</p>
            <p className="mt-2 text-2xl font-bold text-akig-blue">{summary.rentedUnits}</p>
            <p className="text-akig-blue/60">Locataires sécurisés</p>
          </div>
          <div className="rounded-2xl border border-akig-blue/10 bg-white/70 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-akig-blue/60">Disponibilités</p>
            <p className="mt-2 text-2xl font-bold text-akig-blue">{summary.availableUnits}</p>
            <p className="text-akig-blue/60">Unités prêtes à commercialiser</p>
          </div>
          <div className="rounded-2xl border border-akig-blue/10 bg-white/70 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-akig-blue/60">Occupancy Moyen</p>
            <p className="mt-2 text-2xl font-bold text-akig-blue">{summary.averageOccupancy}%</p>
            <p className="text-akig-blue/60">Performance portefeuille</p>
          </div>
        </div>
      </div>
    </div>
  );
}

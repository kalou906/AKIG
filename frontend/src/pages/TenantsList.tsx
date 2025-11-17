import React, { useCallback, useEffect, useState } from 'react';
import { DataGrid, GridColumn, exportDataGridCsv } from '../components/DataGrid';
import { FiltersBar, Filters } from '../components/FiltersBar';
import { StatusBadge } from '../components/StatusBadge';
// import { Alerts } from '../components/Alerts';
import { FR, formatGNF } from '../i18n/fr';

/**
 * Interface pour les données de locataire
 */
interface Tenant {
  id: string;
  full_name: string;
  name?: string;
  phone?: string;
  owner?: string;
  site?: string;
  monthly_rent: number;
  arrears_amount: number;
  arrears_months: number;
  status: 'active' | 'terminated' | 'overdue';
}

/**
 * Page TenantsList
 * Affiche la liste de tous les locataires avec filtrage et tri
 *
 * Fonctionnalités :
 * - Filtrage par recherche, année, statut
 * - Tri par colonne
 * - Export CSV
 * - Alertes sur impayés
 * - Clic sur une ligne pour voir les détails
 */
export default function TenantsList(): React.ReactElement {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    year: new Date().getFullYear(),
    query: '',
    status: '',
  });

  /**
   * Charger les locataires depuis l'API
   */
  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query: filters.query || '',
        status: filters.status || '',
        year: String(filters.year || new Date().getFullYear()),
      });

      const response = await fetch(`/api/tenants?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des locataires');
      }

      const data = await response.json();
      setTenants(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, [filters.query, filters.status, filters.year]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  /**
   * Colonnes du tableau
   */
  const columns: GridColumn[] = [
    {
      key: 'full_name',
      header: FR.table.name,
      sortable: true,
      render: (row: Tenant) => (
        <div className="font-medium text-gray-900">{row.full_name}</div>
      ),
    },
    {
      key: 'phone',
      header: FR.table.phone,
      render: (row: Tenant) => <span className="text-gray-600">{row.phone || '—'}</span>,
    },
    {
      key: 'owner',
      header: FR.table.owner,
      sortable: true,
      render: (row: Tenant) => <span className="text-gray-600">{row.owner || '—'}</span>,
    },
    {
      key: 'site',
      header: FR.table.site,
      sortable: true,
      render: (row: Tenant) => <span className="text-gray-600">{row.site || '—'}</span>,
    },
    {
      key: 'monthly_rent',
      header: FR.table.rent,
      sortable: true,
      render: (row: Tenant) => (
        <span className="font-semibold text-blue-600">{formatGNF(row.monthly_rent)}</span>
      ),
    },
    {
      key: 'status',
      header: FR.common.status,
      sortable: true,
      render: (row: Tenant) => (
        <StatusBadge
          arrears_amount={row.arrears_amount}
          arrears_months={row.arrears_months}
        />
      ),
    },
  ];

  /**
   * Gérer le clic sur une ligne
   */
  function handleRowClick(tenant: Tenant) {
    window.location.href = `/tenant/${tenant.id}`;
  }

  /**
   * Réinitialiser les filtres
   */
  function handleResetFilters() {
    setFilters({
      year: new Date().getFullYear(),
      query: '',
      status: '',
    });
  }

  /**
   * Exporter en CSV
   */
  function handleExportCsv() {
    const filename = `locataires_${filters.year}.csv`;
    exportDataGridCsv(filename, tenants, columns);
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{FR.tenantsListYear.title}</h1>
        <p className="text-gray-600 mt-1">
          {tenants.length} locataire(s) pour l'année {filters.year}
        </p>
      </div>

      {/* Alertes - Commented out */}
      {/* {tenants.length > 0 && (
        <Alerts tenants={tenants as any} year={filters.year} />
      )} */}

      {/* Filtres */}
      <FiltersBar
        value={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        showSite={false}
        showOwner={false}
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExportCsv}
          disabled={tenants.length === 0}
          className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>📥</span>
          <span>{FR.common.export} CSV</span>
        </button>
        <button
          onClick={loadTenants}
          className="btn flex items-center gap-2"
        >
          <span>🔄</span>
          <span>{FR.common.search}</span>
        </button>
      </div>

      {/* État de chargement */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-gray-600">{FR.common.loading}</div>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded border border-red-300 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-semibold">{FR.common.error}</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Tableau */}
      {!loading && tenants.length > 0 && (
        <DataGrid
          data={tenants}
          columns={columns}
          onRowClick={handleRowClick}
          // onSort={(key, dir) => setSort({ key, dir })}
          striped={true}
          hoverable={true}
          emptyMessage={FR.table.noData}
        />
      )}

      {/* État vide */}
      {!loading && tenants.length === 0 && !error && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-gray-600">{FR.tenantsListYear.noTenantsFound}</div>
          <button
            onClick={handleResetFilters}
            className="btn btn-primary mt-4"
          >
            🔄 {FR.common.cancel}
          </button>
        </div>
      )}

      {/* Résumé des statistiques */}
      {!loading && tenants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6 pt-4 border-t border-gray-200">
          <div className="card p-3">
            <div className="text-xs text-gray-600">{FR.common.rent} total</div>
            <div className="text-lg font-bold text-blue-600">
              {formatGNF(
                tenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0)
              )}
            </div>
          </div>
          <div className="card p-3">
            <div className="text-xs text-gray-600">Total impayés</div>
            <div className="text-lg font-bold text-red-600">
              {formatGNF(
                tenants.reduce((sum, t) => sum + (t.arrears_amount || 0), 0)
              )}
            </div>
          </div>
          <div className="card p-3">
            <div className="text-xs text-gray-600">Locataires à jour</div>
            <div className="text-lg font-bold text-green-600">
              {tenants.filter((t) => t.arrears_months === 0).length}
            </div>
          </div>
          <div className="card p-3">
            <div className="text-xs text-gray-600">Taux recouvrement</div>
            <div className="text-lg font-bold text-purple-600">
              {Math.round(
                ((tenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0) -
                  tenants.reduce((sum, t) => sum + (t.arrears_amount || 0), 0)) /
                  (tenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0) || 1)) *
                  100
              )}
              %
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

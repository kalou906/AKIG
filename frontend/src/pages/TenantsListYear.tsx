import React, { useEffect, useState } from 'react';
import { StatusBadgeYear } from '../components/StatusBadgeYear';
import { Pagination } from '../components/Pagination';
import { SearchBar } from '../components/SearchBar';
import { FiltersRow } from '../components/FiltersRow';
import { api } from '../api/client';

/**
 * TenantsListYear - List tenants with payment status by year
 *
 * Features:
 * - Filter by year (2015-present)
 * - Search by tenant name or phone
 * - Filter by owner, site, status
 * - Shows payment arrears and pressure levels
 * - Mini payment list for each tenant
 * - Pagination with 20 items per page
 */
export default function TenantsListYear() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  /**
   * Load tenants list with applied filters
   */
  async function load() {
    setLoading(true);
    try {
      const response = await api.tenants.list(query, page, 20, {
        site: filters.site || '',
        owner: filters.owner || '',
        status: filters.status || '',
        year,
      });

      if (response && response.items) {
        setItems(response.items);
        setTotal(response.total);
        setPages(Math.max(1, Math.ceil(response.total / 20)));
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // Reload when filters, query, page, or year changes
  useEffect(() => {
    load();
  }, [query, filters, page, year]);

  // Generate year options (2015 to current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2015 + 1 }).map((_, i) => {
    const y = 2015 + i;
    return { value: y, label: String(y) };
  });

  return (
    <div className="space-y-3">
      {/* Search and Year Filter */}
      <div className="card flex items-center gap-2">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={load}
            placeholder="Nom, téléphone…"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Année
          </label>
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setPage(1); // Reset to first page
            }}
          >
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters */}
      <FiltersRow filters={filters} onChange={setFilters} />

      {/* Tenants Grid */}
      <div className="card">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun locataire trouvé
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((tenant: any) => (
              <div
                key={tenant.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition"
              >
                {/* Tenant Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      {tenant.full_name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {tenant.phone || '—'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <div>{tenant.owner || '—'}</div>
                      <div>{tenant.site || '—'}</div>
                    </div>
                  </div>
                  <div className="ml-2">
                    <StatusBadgeYear
                      arrears_amount={Number(tenant.arrears_amount || 0)}
                      arrears_months={Number(tenant.arrears_months || 0)}
                    />
                  </div>
                </div>

                {/* Monthly Rent Info */}
                {tenant.monthly_rent && (
                  <div className="text-xs text-gray-600 border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span>Loyer mensuel:</span>
                      <strong>
                        {Intl.NumberFormat('fr-GN').format(
                          Number(tenant.monthly_rent)
                        )}{' '}
                        GNF
                      </strong>
                    </div>
                    {tenant.arrears_amount > 0 && (
                      <div className="flex justify-between text-red-700 font-medium">
                        <span>Impayés:</span>
                        <strong>
                          {Intl.NumberFormat('fr-GN').format(
                            Number(tenant.arrears_amount)
                          )}{' '}
                          GNF
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Payments Mini List */}
                {tenant.contract_id && (
                  <PaymentsMiniYear
                    contractId={tenant.contract_id}
                    year={year}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <Pagination page={page} pages={pages} onPage={setPage} />
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-xs text-gray-600 text-center">
        Affichage {items.length > 0 ? (page - 1) * 20 + 1 : 0}-
        {Math.min(page * 20, total)} de {total} locataires
      </div>
    </div>
  );
}

/**
 * PaymentsMiniYear - Mini list of recent payments for a contract
 * Shows up to 5 most recent payments in the specified year
 */
function PaymentsMiniYear({
  contractId,
  year,
}: {
  contractId: number;
  year: number;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.reports
      .getContractPayments(contractId, year)
      .then(setData)
      .catch((error) => {
        console.error('Failed to load payments:', error);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [contractId, year]);

  if (loading) {
    return (
      <div className="mt-2 text-xs">
        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="mt-2 text-xs text-gray-500 border-t border-gray-200 pt-2">
        <b>Paiements {year}:</b> Aucun
      </div>
    );
  }

  return (
    <div className="mt-2 border-t border-gray-200 pt-2">
      <div className="text-xs font-semibold text-gray-700 mb-1">
        Paiements {year}:
      </div>
      <ul className="space-y-1">
        {data.slice(0, 5).map((payment: any, idx: number) => (
          <li key={idx} className="flex justify-between items-start text-xs">
            <span className="text-gray-600">
              {new Date(payment.paid_at).toLocaleDateString('fr-GN')}
              {payment.mode && ` • ${payment.mode}`}
              {payment.allocation && ` • ${payment.allocation}`}
            </span>
            <span className="font-medium text-gray-700 ml-2 flex-shrink-0">
              {Intl.NumberFormat('fr-GN').format(Number(payment.amount))} GNF
            </span>
          </li>
        ))}
        {data.length > 5 && (
          <li className="text-gray-500 italic">
            +{data.length - 5} autre{data.length - 6 === 0 ? '' : 's'}
          </li>
        )}
      </ul>
    </div>
  );
}

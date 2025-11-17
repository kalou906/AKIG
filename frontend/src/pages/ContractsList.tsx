import React from 'react';
import { api } from '../api/client';
import { usePagedSearch } from '../hooks/usePagedSearch';
import { SearchBar } from '../components/SearchBar';
import { FiltersRow } from '../components/FiltersRow';
import { Pagination } from '../components/Pagination';
import { formatGNF } from '../lib/format';

interface Contract {
  id: number;
  tenant_name: string;
  property_name: string;
  ref: string;
  status?: string;
  rent?: number;
  due_date: string;
}

export default function ContractsList() {
  const { query, setQuery, filters, setFilters, page, setPage, pageSize, setPageSize, items, pages, loading } =
    usePagedSearch<Contract>((q: string, p: number, ps: number, f: Record<string, any>) => api.contracts.list(q, p, ps, f));

  return (
    <div className="space-y-3">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Rechercher un contrat (locataire, bien, référence)..."
      />
      <FiltersRow filters={filters} onChange={setFilters} />

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <b>Contrats</b>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="rounded border px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded border p-3">
                <div className="mb-2 h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                <div className="mb-2 h-3 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-3 transition-opacity duration-200 md:grid-cols-2"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {items.map((contract: Contract) => (
              <div
                key={contract.id}
                className="rounded border p-3 transition hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{contract.tenant_name}</div>
                    <div className="text-sm text-gray-600">
                      {contract.property_name} • Réf: {contract.ref}
                    </div>
                  </div>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                    {contract.status || 'actif'}
                  </span>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  Loyer: {formatGNF(contract.rent || 0)} • Échéance:{' '}
                  {contract.due_date}
                </div>

                <div className="mt-2 flex gap-2">
                  <button className="btn bg-[var(--akigBlue)] text-white">
                    MODIFIER
                  </button>
                  <button className="btn bg-[var(--akigRed)] text-white">
                    SUPPR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>
    </div>
  );
}

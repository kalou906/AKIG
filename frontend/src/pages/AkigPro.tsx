import React, { useCallback, useEffect, useState } from 'react';
import TenantsList from './TenantsList';
import Dashboard from './Dashboard';
import { AiSearch } from '../components/AiSearch';
import { ScheduledReminders } from '../components/ScheduledReminders';
import { api } from '../api/client';
// import { Alerts, AlertsProps } from '../components/Alerts';

type AlertsProps = { tenants?: any[]; year?: number };

interface Filters {
  year: number;
  [key: string]: unknown;
}

export default function AkigPro() {
  const [tenants, setTenants] = useState<AlertsProps['tenants']>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [filters, setFilters] = useState<Filters>({ year: new Date().getFullYear() });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load tenants with filters
      const tenantsResponse = await api.tenants.list(
        '',
        1,
        100,
        { year: filters.year }
      );
      setTenants(tenantsResponse.items || []);

      // Load contracts with filters
      const contractsResponse = await api.contracts.list(
        '',
        1,
        100,
        { year: filters.year }
      );
      setContracts(contractsResponse.items || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.year]);

  useEffect(() => {
    load();
  }, [load]);


  return (
    <div className="space-y-4 p-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          Chargement...
        </div>
      )}

      {/* <Alerts tenants={tenants} year={filters.year} /> */}

      <Dashboard />

      <AiSearch
        onFilters={(f: Partial<Filters>) => {
          setFilters(prev => ({ ...prev, ...f }));
        }}
      />

      <ScheduledReminders contracts={contracts} />

      <TenantsList />
    </div>
  );
}

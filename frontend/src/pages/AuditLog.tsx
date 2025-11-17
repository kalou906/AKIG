// ============================================================================
// Audit Log Page (AuditLog.tsx)
// File: src/pages/AuditLog.tsx
// Purpose: Display audit log entries with permission gating
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Protected } from '../components/Protected';
import { DataGrid, GridColumn } from '../components/DataGrid';
import { User } from '../lib/rbac';
import { formatDate } from '@/utils/date';

export interface AuditLogEntry {
  id: number;
  user_id: number;
  action: string;
  target: string;
  metadata: Record<string, any>;
  ip_address?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface AuditLogPageProps {
  user: User | null | undefined;
  className?: string;
}

/**
 * AuditLog Page Component
 * Display audit trail of all system actions with permission gating
 * Only visible to users with 'audit.view' permission
 *
 * @example
 * <AuditLog user={user} />
 */
export const AuditLog: React.FC<AuditLogPageProps> = ({ user, className = '' }) => {
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: ''
  });

  // Fetch audit logs
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.action) params.append('action', filters.action);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await fetch(`/api/audit?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch audit logs: ${response.status}`);
        }

        const data = await response.json();
        setRows(data.entries || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit logs');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [filters]);

  // Define columns
  const columns: GridColumn[] = [
    {
      key: 'created_at',
      header: 'Date',
      width: '180px',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      key: 'action',
      header: 'Action',
      width: '150px',
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
          {value}
        </span>
      )
    },
    {
      key: 'target',
      header: 'Target',
      width: '150px',
      sortable: true,
      render: (value) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{value}</code>
    },
    {
      key: 'user_email',
      header: 'User',
      width: '180px',
      sortable: true
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      width: '120px',
      render: (value) => value || '-'
    },
    {
      key: 'metadata',
      header: 'Details',
      render: (value) => {
        if (!value || Object.keys(value).length === 0) return '-';
        return (
          <details className="cursor-pointer">
            <summary className="text-blue-600 hover:text-blue-800">View</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(value, null, 2)}
            </pre>
          </details>
        );
      }
    }
  ];

  return (
    <Protected user={user} perm="audit.view">
      <div className={`space-y-4 ${className}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <span className="text-sm text-gray-500">
            {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Filters */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                placeholder="E.g., CONTRACT_GENERATE"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Reset Filters */}
          <button
            onClick={() => setFilters({ action: '', startDate: '', endDate: '' })}
            className="mt-3 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card text-center py-8">
            <p className="text-gray-500">Loading audit logs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Data Grid */}
        {!loading && !error && (
          <DataGrid
            data={rows}
            columns={columns}
            emptyMessage="No audit entries found. Create some actions to see the audit trail."
          />
        )}

        {/* Stats Footer */}
        {!loading && !error && rows.length > 0 && (
          <div className="card bg-gray-50">
            <p className="text-xs text-gray-600">
              Showing audit trail. All actions are logged for compliance and security purposes.
            </p>
          </div>
        )}
      </div>
    </Protected>
  );
};

export default AuditLog;

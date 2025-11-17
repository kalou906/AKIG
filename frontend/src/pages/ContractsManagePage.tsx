import React, { useState, useEffect } from 'react';
import { FormField } from '../components/FormField';
import { v } from '../lib/validate';
import { uiLog } from '../lib/uilog';
import { req } from '../api/client';

interface Contract {
  id: number;
  tenant_id: number;
  site_id?: number;
  owner_id?: number;
  ref: string;
  monthly_rent: number;
  periodicity: string;
  start_date: string;
  end_date?: string;
  status: string;
  created_at: string;
  tenant_name?: string;
  site_name?: string;
  owner_name?: string;
}

interface CreateContractForm {
  tenant_id: string;
  site_id: string;
  owner_id: string;
  ref: string;
  monthly_rent: string;
  periodicity: string;
  start_date: string;
  end_date: string;
}

export const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateContractForm>({
    tenant_id: '',
    site_id: '',
    owner_id: '',
    ref: '',
    monthly_rent: '',
    periodicity: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  // Fetch contracts
  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await req<Contract[]>('/core/contracts', { method: 'GET' });
      setContracts(data);
      uiLog('contracts_loaded', { count: data.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load contracts';
      setError(msg);
      uiLog('contracts_load_error', { error: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.tenant_id) errors.tenant_id = 'Tenant is required';
    if (!formData.ref) errors.ref = 'Reference is required';
    if (!formData.monthly_rent) errors.monthly_rent = 'Monthly rent is required';
    if (!formData.start_date) errors.start_date = 'Start date is required';

    const rent = parseFloat(formData.monthly_rent);
    if (rent < 0) errors.monthly_rent = 'Monthly rent must be positive';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create
  const handleCreate = async () => {
    try {
      if (!validateForm()) return;

      setIsLoading(true);
      const payload = {
        tenant_id: parseInt(formData.tenant_id),
        site_id: formData.site_id ? parseInt(formData.site_id) : null,
        owner_id: formData.owner_id ? parseInt(formData.owner_id) : null,
        ref: formData.ref,
        monthly_rent: parseFloat(formData.monthly_rent),
        periodicity: formData.periodicity,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        status: 'active',
      };

      const newContract = await req<Contract>('/core/contracts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setContracts([...contracts, newContract]);
      setFormData({
        tenant_id: '',
        site_id: '',
        owner_id: '',
        ref: '',
        monthly_rent: '',
        periodicity: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
      });
      setShowForm(false);

      uiLog('contract_created', {
        contract_id: newContract.id,
        tenant_id: newContract.tenant_id,
        monthly_rent: newContract.monthly_rent,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create contract';
      setError(msg);
      uiLog('contract_create_error', { error: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (contract: Contract) => {
    if (!window.confirm(`Delete contract "${contract.ref}"? This cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);
      await req(`/core/contracts/${contract.id}`, { method: 'DELETE' });
      setContracts(contracts.filter((c) => c.id !== contract.id));

      uiLog('contract_deleted', {
        contract_id: contract.id,
        ref: contract.ref,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete contract';
      setError(msg);
      uiLog('contract_delete_error', { error: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter contracts
  const filteredContracts = contracts.filter(
    (c) =>
      (c.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!statusFilter || c.status === statusFilter)
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Contracts</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {showForm ? 'Cancel' : 'Add Contract'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">New Contract</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Tenant ID*"
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                error={formErrors.tenant_id}
                type="number"
                disabled={isLoading}
                required
              />
              <FormField
                label="Reference*"
                value={formData.ref}
                onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                error={formErrors.ref}
                disabled={isLoading}
                required
              />
              <FormField
                label="Monthly Rent (GNF)*"
                value={formData.monthly_rent}
                onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                error={formErrors.monthly_rent}
                type="number"
                disabled={isLoading}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periodicity
                </label>
                <select
                  value={formData.periodicity}
                  onChange={(e) => setFormData({ ...formData, periodicity: e.target.value })}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="semiannual">Semi-annual</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <FormField
                label="Start Date*"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                error={formErrors.start_date}
                type="date"
                disabled={isLoading}
                required
              />
              <FormField
                label="End Date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                type="date"
                disabled={isLoading}
              />
              <FormField
                label="Site ID"
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                type="number"
                disabled={isLoading}
              />
              <FormField
                label="Owner ID"
                value={formData.owner_id}
                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                type="number"
                disabled={isLoading}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by reference or tenant..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="terminated">Terminated</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {filteredContracts.length} of {contracts.length} contracts
        </p>

        {/* Loading State */}
        {isLoading && <p className="text-center text-gray-600">Loading...</p>}

        {/* Contracts List */}
        {!isLoading && filteredContracts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {contracts.length === 0 ? 'No contracts yet.' : 'No contracts match your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Reference</th>
                  <th className="px-4 py-2 text-left font-semibold">Tenant</th>
                  <th className="px-4 py-2 text-left font-semibold">Monthly Rent</th>
                  <th className="px-4 py-2 text-left font-semibold">Period</th>
                  <th className="px-4 py-2 text-left font-semibold">Start Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{contract.ref}</td>
                    <td className="px-4 py-3">{contract.tenant_name || '-'}</td>
                    <td className="px-4 py-3">{formatCurrency(contract.monthly_rent)}</td>
                    <td className="px-4 py-3 capitalize">{contract.periodicity}</td>
                    <td className="px-4 py-3">{new Date(contract.start_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          contract.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : contract.status === 'terminated'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedContract(contract)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(contract)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Contract Detail Modal */}
        {selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">{selectedContract.ref}</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600">Tenant</p>
                  <p className="font-medium">{selectedContract.tenant_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Monthly Rent</p>
                  <p className="font-medium">{formatCurrency(selectedContract.monthly_rent)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Periodicity</p>
                  <p className="font-medium capitalize">{selectedContract.periodicity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Start Date</p>
                  <p className="font-medium">{new Date(selectedContract.start_date).toLocaleDateString()}</p>
                </div>
                {selectedContract.end_date && (
                  <div>
                    <p className="text-xs text-gray-600">End Date</p>
                    <p className="font-medium">{new Date(selectedContract.end_date).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600">Status</p>
                  <p className="font-medium capitalize">{selectedContract.status}</p>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => setSelectedContract(null)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

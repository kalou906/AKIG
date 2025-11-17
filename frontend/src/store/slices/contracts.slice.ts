/**
 * Contracts Store (Zustand)
 * Centralized contracts state management
 */

import { create } from 'zustand';

interface Contract {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface ContractsFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ContractsState {
  contracts: Contract[];
  selectedContract: Contract | null;
  filters: ContractsFilters;
  isLoading: boolean;
  error: string | null;
  total: number;
  pages: number;

  // Actions
  setContracts: (contracts: Contract[]) => void;
  addContract: (contract: Contract) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
  setSelectedContract: (contract: Contract | null) => void;
  setFilters: (filters: ContractsFilters) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (total: number, pages: number) => void;
  clearError: () => void;
  reset: () => void;
}

export const useContractsStore = create<ContractsState>((set) => ({
  contracts: [],
  selectedContract: null,
  filters: {},
  isLoading: false,
  error: null,
  total: 0,
  pages: 0,

  setContracts: (contracts) => set({ contracts }),

  addContract: (contract) => set((state) => ({
    contracts: [contract, ...state.contracts]
  })),

  updateContract: (id, updates) => set((state) => ({
    contracts: state.contracts.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    )
  })),

  deleteContract: (id) => set((state) => ({
    contracts: state.contracts.filter((c) => c.id !== id),
    selectedContract: state.selectedContract?.id === id ? null : state.selectedContract
  })),

  setSelectedContract: (contract) => set({ selectedContract: contract }),

  setFilters: (filters) => set({ filters }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setPagination: (total, pages) => set({ total, pages }),

  clearError: () => set({ error: null }),

  reset: () => set({
    contracts: [],
    selectedContract: null,
    filters: {},
    isLoading: false,
    error: null,
    total: 0,
    pages: 0
  })
}));

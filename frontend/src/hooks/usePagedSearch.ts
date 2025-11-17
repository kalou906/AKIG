import { useState, useCallback } from 'react';

export interface PagedSearchResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UsePagedSearchOptions {
  pageSize?: number;
  initialPage?: number;
}

export interface UsePagedSearchReturn<T> {
  // State
  query: string;
  filters: Record<string, any>;
  page: number;
  pageSize: number;
  
  // Setters
  setQuery: (q: string) => void;
  setFilters: (f: Record<string, any>) => void;
  setPage: (p: number) => void;
  setPageSize: (ps: number) => void;
  
  // Data
  data: T[];
  items: T[];
  total: number;
  pages: number;
  loading: boolean;
  error: Error | null;
  
  // Navigation
  hasNextPage: boolean;
  hasPrevPage: boolean;
  
  // Methods
  search: (query: string, filters: Record<string, any>) => Promise<void>;
  goToPage: (newPage: number, query: string, filters: Record<string, any>) => Promise<void>;
  nextPage: (query: string, filters?: Record<string, any>) => Promise<void>;
  prevPage: (query: string, filters?: Record<string, any>) => Promise<void>;
}

export function usePagedSearch<T>(
  fetcher: (query: string, page: number, pageSize: number, filters: Record<string, any>) => Promise<PagedSearchResult<T>>,
  options: UsePagedSearchOptions = {}
): UsePagedSearchReturn<T> {
  const { pageSize: initialPageSize = 10, initialPage = 1 } = options;

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);

  const search = useCallback(
    async (q: string, f: Record<string, any> = {}) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher(q, 1, pageSize, f);
        setData(result.data);
        setTotal(result.total);
        setPage(1);
        setQuery(q);
        setFilters(f);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [fetcher, pageSize]
  );

  const goToPage = useCallback(
    async (newPage: number, q: string, f: Record<string, any> = {}) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher(q, newPage, pageSize, f);
        setData(result.data);
        setTotal(result.total);
        setPage(newPage);
        setQuery(q);
        setFilters(f);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [fetcher, pageSize]
  );

  const nextPage = useCallback(
    async (q: string, f?: Record<string, any>) => {
      if (page * pageSize < total) {
        await goToPage(page + 1, q, f);
      }
    },
    [page, pageSize, total, goToPage]
  );

  const prevPage = useCallback(
    async (q: string, f?: Record<string, any>) => {
      if (page > 1) {
        await goToPage(page - 1, q, f);
      }
    },
    [page, goToPage]
  );

  const pages = Math.ceil(total / pageSize) || 1;

  return {
    // State
    query,
    filters,
    page,
    pageSize,
    
    // Setters
    setQuery,
    setFilters,
    setPage,
    setPageSize,
    
    // Data
    data,
    items: data,
    total,
    pages,
    loading,
    error,
    
    // Navigation
    hasNextPage: page * pageSize < total,
    hasPrevPage: page > 1,
    
    // Methods
    search,
    goToPage,
    nextPage,
    prevPage,
  };
}

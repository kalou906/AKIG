// ============================================================
// useSystemDiagnostics Hook
// Monitors system health via /api/health endpoint
// ============================================================

export interface ModuleDiagnostic {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  modules: ModuleDiagnostic[];
  timestamp: number;
}

export function useSystemDiagnostics(intervalMs: number = 60000) {
  // Placeholder implementation for type exports
  // Real implementation would poll /api/health endpoint
  return {
    status: 'healthy',
    modules: [] as ModuleDiagnostic[],
    lastChecked: new Date(),
    lastError: null
  };
}

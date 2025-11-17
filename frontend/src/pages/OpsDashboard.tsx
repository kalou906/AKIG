/**
 * Operations Dashboard
 * Real-time monitoring of system KPIs, logs, alerts, and performance metrics
 * Admin-only dashboard for operational visibility
 */

import React, { useEffect, useState, useCallback } from 'react';
import styles from './OpsDashboard.module.css';

interface KPISummary {
  totalArrears: number;
  totalRevenue: number;
  activeContracts: number;
  successfulPayments: number;
  totalPaymentValue: number;
}

interface ArrearsMetric {
  agencyId: number;
  count: number;
  total: number;
}

interface OccupancyMetric {
  agencyId: number;
  agencyName: string;
  activeContracts: number;
  totalContracts: number;
  rate: string;
}

interface RevenueMetric {
  date: string;
  transactions: number;
  total: number;
  average: number;
}

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  requestId: string;
  userId?: number;
  metadata?: Record<string, any>;
}

interface Alert {
  id: number;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  createdAt: string;
  resolvedAt?: string;
  isActive: boolean;
}

interface PerformanceMetric {
  endpoint: string;
  method: string;
  requests: number;
  timing: {
    average: string;
    min: number;
    max: number;
    p50: string;
    p95: string;
    p99: string;
  };
  errors: number;
}

interface OpsDashboardState {
  kpis: any | null;
  logs: LogEntry[];
  alerts: Alert[];
  performance: PerformanceMetric[];
  health: any | null;
  loading: boolean;
  error: string | null;
}

const OpsDashboard: React.FC = () => {
  const [state, setState] = useState<OpsDashboardState>({
    kpis: null,
    logs: [],
    alerts: [],
    performance: [],
    health: null,
    loading: true,
    error: null
  });

  const [filters, setFilters] = useState({
    reqId: '',
    logLevel: 'all',
    alertSeverity: 'all',
    refreshInterval: 30 // seconds
  });

  const [activeTab, setActiveTab] = useState<'kpis' | 'logs' | 'alerts' | 'performance' | 'health'>('kpis');

  /**
   * Fetch KPIs data
   */
  const fetchKPIs = useCallback(async () => {
    try {
      const response = await fetch('/api/ops/kpis', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch KPIs: ${response.statusText}`);
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        kpis: data,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  /**
   * Fetch logs with optional filtering
   */
  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.reqId) params.append('reqId', filters.reqId);
      if (filters.logLevel !== 'all') params.append('level', filters.logLevel);
      params.append('limit', '200');

      const response = await fetch(`/api/ops/logs?${params}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        logs: data.logs,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [filters.reqId, filters.logLevel]);

  /**
   * Fetch alerts
   */
  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.alertSeverity !== 'all') params.append('severity', filters.alertSeverity);

      const response = await fetch(`/api/ops/alerts?${params}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        alerts: data.alerts,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [filters.alertSeverity]);

  /**
   * Fetch performance metrics
   */
  const fetchPerformance = useCallback(async () => {
    try {
      const response = await fetch('/api/ops/performance', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch performance: ${response.statusText}`);
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        performance: data.endpoints,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  /**
   * Fetch system health
   */
  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/ops/health', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch health: ${response.statusText}`);
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        health: data,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  /**
   * Initial fetch and auto-refresh
   */
  useEffect(() => {
    setState(prev => ({ ...prev, loading: true }));

    // Fetch all data
    fetchKPIs();
    fetchLogs();
    fetchAlerts();
    fetchPerformance();
    fetchHealth();

    setState(prev => ({ ...prev, loading: false }));

    // Auto-refresh interval
    const interval = setInterval(() => {
      fetchKPIs();
      fetchLogs();
      fetchAlerts();
      fetchPerformance();
      fetchHealth();
    }, filters.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [filters.refreshInterval, fetchKPIs, fetchLogs, fetchAlerts, fetchPerformance, fetchHealth]);

  /**
   * Resolve alert
   */
  const resolveAlert = async (alertId: number) => {
    try {
      const response = await fetch(`/api/ops/alerts/${alertId}/resolve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to resolve alert');
      }

      await fetchAlerts();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to resolve alert'
      }));
    }
  };

  /**
   * Render KPIs section
   */
  const renderKPIs = () => {
    if (!state.kpis) return <div>Loading KPIs...</div>;

    const { summary, metrics } = state.kpis;

    return (
      <div className={styles.container}>
        {/* Summary Cards */}
        <div className={styles.summaryCards}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Total Arrears</div>
            <div className={styles.cardValue}>${summary.totalArrears.toLocaleString()}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Total Revenue (30d)</div>
            <div className={styles.cardValue}>${summary.totalRevenue.toLocaleString()}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Active Contracts</div>
            <div className={styles.cardValue}>{summary.activeContracts}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Successful Payments</div>
            <div className={styles.cardValue}>{summary.successfulPayments}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Total Payment Value</div>
            <div className={styles.cardValue}>${summary.totalPaymentValue.toLocaleString()}</div>
          </div>
        </div>

        {/* Arrears by Agency */}
        <div className={styles.section}>
          <h3>Arrears by Agency</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Agency ID</th>
                <th>Count</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {metrics.arrears.map((arr: ArrearsMetric) => (
                <tr key={arr.agencyId}>
                  <td>{arr.agencyId}</td>
                  <td>{arr.count}</td>
                  <td>${arr.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Occupancy Rates */}
        <div className={styles.section}>
          <h3>Occupancy Rates</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Agency</th>
                <th>Active / Total</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {metrics.occupancy.map((occ: OccupancyMetric) => (
                <tr key={occ.agencyId}>
                  <td>{occ.agencyName}</td>
                  <td>{occ.activeContracts} / {occ.totalContracts}</td>
                  <td>{occ.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Revenue Trend */}
        <div className={styles.section}>
          <h3>Revenue Trend (Last 30 Days)</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transactions</th>
                <th>Total</th>
                <th>Average</th>
              </tr>
            </thead>
            <tbody>
              {metrics.revenue.slice(0, 10).map((rev: RevenueMetric, idx: number) => (
                <tr key={idx}>
                  <td>{rev.date}</td>
                  <td>{rev.transactions}</td>
                  <td>${rev.total.toLocaleString()}</td>
                  <td>${rev.average.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /**
   * Render logs section
   */
  const renderLogs = () => {
    return (
      <div className={styles.container}>
        <div className={styles.filterBar}>
          <input
            type="text"
            placeholder="Filter by Request ID"
            value={filters.reqId}
            onChange={e => setFilters(prev => ({ ...prev, reqId: e.target.value }))}
            className={styles.input}
          />
          <select
            value={filters.logLevel}
            onChange={e => setFilters(prev => ({ ...prev, logLevel: e.target.value }))}
            className={styles.select}
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
          <button onClick={fetchLogs} className={styles.button}>Refresh</button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Level</th>
              <th>Request ID</th>
              <th>User ID</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {state.logs.map((log, idx) => (
              <tr key={idx} className={styles[`level-${log.level}`]}>
                <td className={styles.monospace}>{new Date(log.timestamp).toLocaleString()}</td>
                <td><span className={styles[`badge-${log.level}`]}>{log.level.toUpperCase()}</span></td>
                <td className={styles.monospace}>{log.requestId}</td>
                <td>{log.userId || '-'}</td>
                <td><code>{log.message.substring(0, 100)}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  /**
   * Render alerts section
   */
  const renderAlerts = () => {
    const activeAlerts = state.alerts.filter(a => a.isActive);
    const resolvedAlerts = state.alerts.filter(a => !a.isActive);

    return (
      <div className={styles.container}>
        <div className={styles.filterBar}>
          <select
            value={filters.alertSeverity}
            onChange={e => setFilters(prev => ({ ...prev, alertSeverity: e.target.value }))}
            className={styles.select}
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <button onClick={fetchAlerts} className={styles.button}>Refresh</button>
        </div>

        <h3>Active Alerts ({activeAlerts.length})</h3>
        {activeAlerts.length === 0 ? (
          <p>No active alerts</p>
        ) : (
          <div className={styles.alertsList}>
            {activeAlerts.map(alert => (
              <div key={alert.id} className={`${styles.alertCard} ${styles[`severity-${alert.severity}`]}`}>
                <div className={styles.alertHeader}>
                  <span className={styles[`badge-${alert.severity}`]}>{alert.severity.toUpperCase()}</span>
                  <h4>{alert.title}</h4>
                </div>
                <p>{alert.message}</p>
                <div className={styles.alertFooter}>
                  <small>{new Date(alert.createdAt).toLocaleString()}</small>
                  <button onClick={() => resolveAlert(alert.id)} className={styles.buttonSmall}>
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {resolvedAlerts.length > 0 && (
          <>
            <h3>Recent Resolved ({resolvedAlerts.length})</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Resolved At</th>
                </tr>
              </thead>
              <tbody>
                {resolvedAlerts.map(alert => (
                  <tr key={alert.id}>
                    <td>{alert.title}</td>
                    <td><span className={styles[`badge-${alert.severity}`]}>{alert.severity}</span></td>
                    <td>{alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    );
  };

  /**
   * Render performance section
   */
  const renderPerformance = () => {
    return (
      <div className={styles.container}>
        <div className={styles.filterBar}>
          <button onClick={fetchPerformance} className={styles.button}>Refresh</button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Method</th>
              <th>Requests</th>
              <th>Avg (ms)</th>
              <th>P50 (ms)</th>
              <th>P95 (ms)</th>
              <th>P99 (ms)</th>
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>
            {state.performance.map((perf, idx) => (
              <tr key={idx} className={perf.errors > 0 ? styles.hasErrors : ''}>
                <td className={styles.monospace}>{perf.endpoint}</td>
                <td><span className={styles.badge}>{perf.method}</span></td>
                <td>{perf.requests}</td>
                <td>{perf.timing.average}</td>
                <td>{perf.timing.p50}</td>
                <td>{perf.timing.p95}</td>
                <td>{perf.timing.p99}</td>
                <td>{perf.errors > 0 ? <span className={styles.errorCount}>{perf.errors}</span> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  /**
   * Render health section
   */
  const renderHealth = () => {
    if (!state.health) return <div>Loading health data...</div>;

    return (
      <div className={styles.container}>
        <div className={styles.summaryCards}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Database Connections</div>
            <div className={styles.cardValue}>{state.health.database.activeConnections}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Max Connections</div>
            <div className={styles.cardValue}>{state.health.database.maxConnections}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Uptime</div>
            <div className={styles.cardValue}>{Math.floor(state.health.database.uptimeSeconds / 3600)}h</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Avg Response Time</div>
            <div className={styles.cardValue}>{state.health.api.avgResponseTime}ms</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>P95 Response Time</div>
            <div className={styles.cardValue}>{state.health.api.p95ResponseTime}ms</div>
          </div>
        </div>

        <div className={styles.section}>
          <h3>API Metrics (Last Hour)</h3>
          <ul>
            <li>Total Requests: {state.health.api.totalRequests}</li>
            <li>Errors: {state.health.api.errorCount}</li>
            <li>Max Response Time: {state.health.api.maxResponseTime}ms</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Operations Dashboard</h1>
        <div className={styles.controls}>
          <label>
            Refresh Interval (seconds):
            <input
              type="number"
              min="10"
              max="300"
              value={filters.refreshInterval}
              onChange={e => setFilters(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
              className={styles.input}
            />
          </label>
        </div>
      </header>

      {state.error && (
        <div className={styles.errorBanner}>
          <strong>Error:</strong> {state.error}
        </div>
      )}

      <nav className={styles.tabs}>
        {(['kpis', 'logs', 'alerts', 'performance', 'health'] as const).map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main className={styles.content}>
        {state.loading && activeTab === 'kpis' && <div>Loading...</div>}
        {activeTab === 'kpis' && renderKPIs()}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'alerts' && renderAlerts()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'health' && renderHealth()}
      </main>
    </div>
  );
};

export default OpsDashboard;

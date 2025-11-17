/**
 * HealthStatus Component
 * Displays real-time backend connectivity status
 * Shows green/red badge with detailed health information
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, CheckCircle, Clock, Activity } from 'lucide-react';
import './HealthStatus.css';

function HealthStatus({ apiUrl = 'http://localhost:4000', pollingInterval = 10000, showDetails: defaultShowDetails = false }) {
  const [health, setHealth] = useState({
    status: 'checking',
    timestamp: null,
    uptime: 0,
    database: 'checking',
    featureFlags: undefined,
    error: undefined,
  });

  const [detailsVisible, setDetailsVisible] = useState(defaultShowDetails);
  const [fullHealth, setFullHealth] = useState(null);
  const [modulesSnapshot, setModulesSnapshot] = useState([]);

  // Check health every 10 seconds
  useEffect(() => {
    const normalisedBase = apiUrl.endsWith('/api')
      ? apiUrl
      : `${apiUrl.replace(/\/$/, '')}/api`;

    let cancelled = false;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${normalisedBase}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          if (cancelled) return;
          setHealth({
            status: data.status || 'ok',
            timestamp: data.timestamp,
            uptime: data.uptime,
            database: data.services?.database === 'in-memory' ? 'connected' : data.database || 'connected',
            featureFlags: data.featureFlags,
            error: undefined,
          });
        } else {
          if (cancelled) return;
          setHealth({
            status: 'error',
            timestamp: new Date().toISOString(),
            uptime: 0,
            database: 'disconnected',
            featureFlags: undefined,
            error: `HTTP ${response.status}`,
          });
        }
      } catch (error) {
        console.warn('Health check failed:', error);
        if (cancelled) return;
        setHealth({
          status: 'error',
          timestamp: new Date().toISOString(),
          uptime: 0,
          database: 'disconnected',
          error: error.message,
          featureFlags: undefined,
        });
      }
    };

    // Check immediately
    checkHealth();

    // Set up interval
    const interval = setInterval(checkHealth, pollingInterval);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiUrl, pollingInterval]);

  // Fetch full health details when details are shown
  useEffect(() => {
    if (!detailsVisible || fullHealth) return;

    const fetchFullHealth = async () => {
      try {
        const response = await fetch(
          `${(apiUrl.endsWith('/api') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/api`)}/health/full`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setFullHealth(data);
          if (Array.isArray(data.modules?.registry)) {
            setModulesSnapshot(data.modules.registry);
          }
        }
      } catch (error) {
        console.warn('Full health check failed:', error);
      }
    };

    fetchFullHealth();
  }, [detailsVisible, fullHealth, apiUrl]);

  const isHealthy = health.status === 'ok' || health.status === 'healthy';
  const statusColor = isHealthy ? '#22c55e' : '#ef4444';
  const statusText = isHealthy ? 'Online' : 'Offline';
  const featureFlags = useMemo(() => {
    if (!health.featureFlags) return [];
    return Object.entries(health.featureFlags).map(([flag, enabled]) => ({ flag, enabled }));
  }, [health.featureFlags]);

  return (
    <div className="health-status-container">
      {/* Badge */}
      <div
        className={`health-badge ${isHealthy ? 'healthy' : 'unhealthy'}`}
  onClick={() => setDetailsVisible(!detailsVisible)}
        title={`Backend Status: ${statusText}`}
      >
        <div className="badge-indicator" style={{ backgroundColor: statusColor }}></div>
        <span className="badge-text">{statusText}</span>
        {isHealthy ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      </div>

      {/* Details Popup */}
      {detailsVisible && (
        <div className="health-details-popup">
          <div className="details-header">
            <h4>Backend Health Status</h4>
            <button
              className="close-btn"
              onClick={() => setShowDetails(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="details-body">
            {/* Quick Status */}
            <div className="status-section">
              <h5>Status</h5>
              <div className="status-row">
                <span>Overall:</span>
                <span className={isHealthy ? 'text-green' : 'text-red'}>
                  {isHealthy ? '✓ Healthy' : '✗ Unhealthy'}
                </span>
              </div>
              <div className="status-row">
                <span>Database:</span>
                <span className={health.database === 'connected' ? 'text-green' : 'text-red'}>
                  {health.database === 'connected' ? '✓ Connected' : '✗ Disconnected'}
                </span>
              </div>
            </div>

            {/* System Info */}
            <div className="status-section">
              <h5>System</h5>
              <div className="status-row">
                <span>Uptime:</span>
                <span>{health.uptime ? `${health.uptime}s` : 'N/A'}</span>
              </div>
              <div className="status-row">
                <span>Last Updated:</span>
                <span>{health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>

            {/* Full Details */}
            {fullHealth && (
              <div className="status-section">
                <h5>Detailed Status</h5>

                {/* Memory */}
                {fullHealth.system?.memory && (
                  <div className="detail-item">
                    <strong>Memory Usage:</strong>
                    <p>
                      {fullHealth.system.memory.used} / {fullHealth.system.memory.total}
                      ({fullHealth.system.memory.usagePercent})
                    </p>
                  </div>
                )}

                {/* CPU */}
                {fullHealth.system?.cpu && (
                  <div className="detail-item">
                    <strong>CPU:</strong>
                    <p>{fullHealth.system.cpu.cores} cores @ {fullHealth.system.cpu.speed} MHz</p>
                  </div>
                )}

                {featureFlags.length > 0 && (
                  <div className="detail-item">
                    <strong>Feature flags:</strong>
                    <ul>
                      {featureFlags.map(({ flag, enabled }) => (
                        <li key={flag}>{flag}: {enabled ? 'activé' : 'désactivé'}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {modulesSnapshot.length > 0 && (
                  <div className="detail-item">
                    <strong>Modules API:</strong>
                    <ul>
                      {modulesSnapshot.map((module) => (
                        <li key={module.id}>{module.name} — {module.enabled ? '✅' : '❌'}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {modulesSnapshot.length === 0 && (
                  <div className="detail-item">
                    <strong>Modules API:</strong>
                    <p>Aucun module chargé ou API indisponible.</p>
                  </div>
                )}

                {/* Node.js Version */}
                {fullHealth.system?.nodejs && (
                  <div className="detail-item">
                    <strong>Node.js:</strong>
                    <p>{fullHealth.system.nodejs}</p>
                  </div>
                )}

                {/* Environment */}
                {fullHealth.environment && (
                  <div className="detail-item">
                    <strong>Environment:</strong>
                    <p>{fullHealth.environment}</p>
                  </div>
                )}
              </div>
            )}

            {/* Error Info */}
            {health.error && (
              <div className="status-section error">
                <h5>Error</h5>
                <p className="error-text">{health.error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="details-actions">
              <button
                className="btn-retry"
                onClick={() => {
                  setFullHealth(null);
                  setShowDetails(true);
                }}
              >
                <Activity size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthStatus;

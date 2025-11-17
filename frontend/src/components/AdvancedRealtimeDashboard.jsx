/**
 * 🎯 Advanced Real-time Dashboard Component
 * Live analytics, market heatmap, competitive analysis, performance metrics
 * frontend/src/components/AdvancedRealtimeDashboard.jsx
 */

import React, { useState, useEffect } from 'react';
import styles from './AdvancedRealtimeDashboard.module.css';

const AdvancedRealtimeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // 30s refresh
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getToken = () => localStorage.getItem('jwt_token');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/realtime', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.dashboard);
      }
    } catch (err) {
      console.error('Erreur fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (type) => {
    try {
      const endpoint = type === 'heatmap' ? '/api/analytics/advanced/heatmap' 
                    : type === 'trends' ? '/api/analytics/advanced/trends'
                    : type === 'segments' ? '/api/analytics/advanced/segments'
                    : '/api/analytics/advanced/alerts';

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Erreur fetch analytics:', err);
    }
  };

  if (loading && !dashboardData) {
    return <div className={styles.loading}>⏳ Chargement données...</div>;
  }

  const data = dashboardData || {};

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>🎯 Dashboard Temps Réel AKIG</h1>
          <p>Analyse marché avancée en temps réel</p>
        </div>
        <div className={styles.controls}>
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-actualiser (30s)
          </label>
          <button
            className={styles.refreshBtn}
            onClick={fetchDashboardData}
            disabled={loading}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* HEALTH SCORE */}
      {data.healthScore !== undefined && (
        <div className={styles.healthScore}>
          <div className={styles.scoreCircle}>
            <span className={styles.score}>{data.healthScore}</span>
            <span className={styles.label}>Santé Marché</span>
          </div>
          <div className={styles.scoreBar}>
            <div 
              className={styles.scoreProgress}
              style={{ width: `${data.healthScore}%` }}
            />
          </div>
        </div>
      )}

      {/* TABS */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Vue d'ensemble
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'heatmap' ? styles.active : ''}`}
          onClick={() => { setActiveTab('heatmap'); fetchAnalytics('heatmap'); }}
        >
          🔥 Carte Thermique
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'trends' ? styles.active : ''}`}
          onClick={() => { setActiveTab('trends'); fetchAnalytics('trends'); }}
        >
          📈 Tendances
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'performance' ? styles.active : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          ⚡ Performance
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📡 Activité
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className={styles.tabContent}>
          {/* Market Stats Grid */}
          <div className={styles.statsGrid}>
            <StatCard
              icon="🏠"
              label="Total Propriétés"
              value={data.marketStats?.totalProperties || 0}
            />
            <StatCard
              icon="✅"
              label="Disponibles"
              value={data.marketStats?.available || 0}
            />
            <StatCard
              icon="💰"
              label="Prix Moyen"
              value={`${(data.marketStats?.averagePrice / 1000000).toFixed(1)}M GNF`}
            />
            <StatCard
              icon="📏"
              label="Surface Moyenne"
              value={`${data.marketStats?.averageSurface || 0} m²`}
            />
          </div>

          {/* Top Locations */}
          {data.topLocations && (
            <div className={styles.section}>
              <h2>🏆 Meilleures Localisations</h2>
              <div className={styles.locationsGrid}>
                {data.topLocations.slice(0, 5).map((loc, idx) => (
                  <div key={idx} className={styles.locationCard}>
                    <h3>{loc.location}</h3>
                    <p className={styles.metric}>
                      <strong>Propriétés:</strong> {loc.propertyCount}
                    </p>
                    <p className={styles.metric}>
                      <strong>Prix Moyen:</strong> {(loc.averagePrice / 1000000).toFixed(1)}M GNF
                    </p>
                    <p className={styles.metric}>
                      <strong>Taux Vente:</strong> <span className={styles.percentage}>{loc.sellThroughRate.toFixed(1)}%</span>
                    </p>
                    <div className={styles.performance}>
                      Performance: <span className={`${styles.badge} ${styles['badge-' + loc.performance.toLowerCase()]}`}>
                        {loc.performance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {data.alerts && data.alerts.length > 0 && (
            <div className={styles.section}>
              <h2>🚨 Alertes Marché</h2>
              <div className={styles.alertsList}>
                {data.alerts.slice(0, 5).map((alert, idx) => (
                  <div key={idx} className={`${styles.alert} ${styles[`alert-${alert.type.toLowerCase().replace('_', '-')}` ]}`}>
                    <strong>{alert.type}</strong> - {alert.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* HEATMAP TAB */}
      {activeTab === 'heatmap' && analytics && (
        <div className={styles.tabContent}>
          <h2>🔥 Carte Thermique Marché</h2>
          <div className={styles.heatmapGrid}>
            {analytics.heatmap?.map((loc, idx) => {
              const getColor = (score) => {
                if (score >= 80) return '#ff0000';
                if (score >= 60) return '#ff8800';
                if (score >= 40) return '#ffff00';
                if (score >= 20) return '#88ff00';
                return '#0088ff';
              };
              return (
                <div 
                  key={idx} 
                  className={styles.heatmapCell}
                  style={{
                    backgroundColor: getColor(loc.demandScore),
                    opacity: 0.8 + (loc.demandScore / 100) * 0.2
                  }}
                >
                  <h4>{loc.location}</h4>
                  <p className={styles.demand}>Demande: {loc.demandScore}%</p>
                  <p className={styles.properties}>{loc.propertyCount} propriétés</p>
                  <p className={styles.price}>{(loc.avgPrice / 1000000).toFixed(1)}M GNF</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TRENDS TAB */}
      {activeTab === 'trends' && analytics && (
        <div className={styles.tabContent}>
          <h2>📈 Tendances Prix</h2>
          <div className={styles.trendsGrid}>
            {Object.entries(analytics.trends || {}).map(([location, trend]) => (
              <div key={location} className={styles.trendCard}>
                <h3>{location}</h3>
                <div className={`${styles.trendIndicator} ${styles['trend-' + trend.trend.toLowerCase()]}`}>
                  {trend.trend === 'UP' ? '📈' : trend.trend === 'DOWN' ? '📉' : '➡️'} {trend.trend}
                </div>
                <p className={styles.change}>
                  {trend.percentChange > 0 ? '+' : ''}{trend.percentChange}%
                </p>
                <p className={styles.prediction}>
                  Semaine prochaine: {(trend.prediction / 1000000).toFixed(1)}M GNF
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PERFORMANCE TAB */}
      {activeTab === 'performance' && (
        <div className={styles.tabContent}>
          <div className={styles.performanceGrid}>
            <PerformanceMetric
              label="Taux Conversion"
              value={`${data.performanceMetrics?.conversionRate || 0}%`}
              status={data.performanceMetrics?.conversionRate > 30 ? 'GOOD' : 'FAIR'}
            />
            <PerformanceMetric
              label="Jours Moyenne Vente"
              value={data.performanceMetrics?.averageDaysToSale || 0}
              unit="jours"
              status={data.performanceMetrics?.averageDaysToSale < 60 ? 'GOOD' : 'FAIR'}
            />
            <PerformanceMetric
              label="Efficacité"
              value={data.performanceMetrics?.efficiency || 'N/A'}
              status="INFO"
            />
          </div>
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'activity' && (
        <div className={styles.tabContent}>
          <h2>📡 Flux d'Activité Temps Réel</h2>
          <div className={styles.activityList}>
            {data.recentActivity?.map((activity, idx) => (
              <div key={idx} className={styles.activityItem}>
                <span className={styles.time}>{activity.relativeTime}</span>
                <span className={styles.location}>{activity.location}</span>
                <span className={styles.title}>{activity.title}</span>
                <span className={`${styles.status} ${styles['status-' + activity.status.toLowerCase()]}`}>
                  {activity.status}
                </span>
                <span className={styles.price}>{(activity.price / 1000000).toFixed(1)}M</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const StatCard = ({ icon, label, value }) => (
  <div className={styles.statCard}>
    <div className={styles.icon}>{icon}</div>
    <div className={styles.content}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
    </div>
  </div>
);

const PerformanceMetric = ({ label, value, unit = '', status = 'GOOD' }) => (
  <div className={styles.metricCard}>
    <h3>{label}</h3>
    <div className={styles.metricValue}>{value} {unit}</div>
    <div className={`${styles.metricStatus} ${styles['status-' + status.toLowerCase()]}`}>
      {status}
    </div>
  </div>
);

export default AdvancedRealtimeDashboard;

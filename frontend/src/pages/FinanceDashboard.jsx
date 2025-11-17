// src/pages/FinanceDashboard.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import '../styles/dashboard.css';

const RANGES = [
  { key: '1m', label: '1 mois', icon: '📅' },
  { key: '3m', label: '3 mois', icon: '📊' },
  { key: '6m', label: '6 mois', icon: '📈' },
  { key: '12m', label: '1 année', icon: '📉' }
];

export default function FinanceDashboard({ agencyId }) {
  const [range, setRange] = useState('1m');
  const [data, setData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [agencyId, range]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Finance global
      const financeRes = await api.get(
        `/api/reporting/finance?agency_id=${agencyId}&range=${range}`
      );
      setData(financeRes);

      // Historique mensuel
      const monthlyRes = await api.get(
        `/api/reporting/agency-monthly?agency_id=${agencyId}`
      );
      setMonthlyData(monthlyRes);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading-spinner">Chargement des données financières...</div>;
  }

  if (error) {
    return <div className="error-box">Erreur: {error}</div>;
  }

  if (!data) {
    return <div className="info-box">Aucune donnée disponible</div>;
  }

  const { income, costs, summary } = data;
  const netMargin = summary.total_income > 0 
    ? Math.round((summary.net_revenue / summary.total_income) * 100)
    : 0;

  return (
    <section className="finance-dashboard">
      <h2>📊 Vision Financière</h2>

      {/* Range Selector */}
      <div className="range-selector">
        {RANGES.map(r => (
          <button
            key={r.key}
            className={`range-btn ${range === r.key ? 'active' : ''}`}
            onClick={() => setRange(r.key)}
          >
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card income">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <div className="kpi-label">Encaissements</div>
            <div className="kpi-value">{formatNumber(summary.total_income)}</div>
            <div className="kpi-detail">{income.payment_count} paiements</div>
          </div>
        </div>

        <div className="kpi-card costs">
          <div className="kpi-icon">💸</div>
          <div className="kpi-content">
            <div className="kpi-label">Coûts</div>
            <div className="kpi-value">{formatNumber(summary.total_costs)}</div>
            <div className="kpi-detail">
              Gestion: {formatNumber(costs.management_fee)} | 
              Salaires: {formatNumber(costs.salaries)}
            </div>
          </div>
        </div>

        <div className={`kpi-card net ${summary.net_revenue >= 0 ? 'positive' : 'negative'}`}>
          <div className="kpi-icon">{summary.net_revenue >= 0 ? '📈' : '📉'}</div>
          <div className="kpi-content">
            <div className="kpi-label">Net</div>
            <div className="kpi-value">{formatNumber(summary.net_revenue)}</div>
            <div className="kpi-detail">Marge: {netMargin}%</div>
          </div>
        </div>

        <div className="kpi-card margin">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <div className="kpi-label">Taux de Recouvrement</div>
            <div className="kpi-value">
              {summary.total_income > 0 
                ? Math.round((summary.total_income / (summary.total_income + summary.total_costs)) * 100)
                : 0}%
            </div>
            <div className="kpi-detail">Retards: {income.late_count}</div>
          </div>
        </div>
      </div>

      {/* Costs Breakdown */}
      <div className="costs-breakdown">
        <h3>Détail des Coûts</h3>
        <div className="cost-items">
          <div className="cost-item">
            <span className="cost-label">Frais de gestion</span>
            <span className="cost-value">{formatNumber(costs.management_fee)}</span>
          </div>
          <div className="cost-item">
            <span className="cost-label">Salaires</span>
            <span className="cost-value">{formatNumber(costs.salaries)}</span>
          </div>
          <div className="cost-item">
            <span className="cost-label">Maintenance</span>
            <span className="cost-value">{formatNumber(costs.maintenance)}</span>
          </div>
          <div className="cost-item">
            <span className="cost-label">Charges</span>
            <span className="cost-value">{formatNumber(costs.utilities)}</span>
          </div>
          <div className="cost-item">
            <span className="cost-label">Autres coûts</span>
            <span className="cost-value">{formatNumber(costs.other_costs)}</span>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      {monthlyData && monthlyData.months && monthlyData.months.length > 0 && (
        <div className="monthly-trend">
          <h3>Tendance Mensuelle</h3>
          <table className="trend-table">
            <thead>
              <tr>
                <th>Mois</th>
                <th>Revenus</th>
                <th>Coûts</th>
                <th>Net</th>
                <th>Marge %</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.months.slice(0, 6).map((month, idx) => {
                const monthNet = Number(month.net) || 0;
                const monthRevenue = Number(month.revenue) || 0;
                const monthMargin = monthRevenue > 0 ? Math.round((monthNet / monthRevenue) * 100) : 0;
                return (
                  <tr key={idx} className={monthNet >= 0 ? 'positive' : 'negative'}>
                    <td>{formatDate(month.month)}</td>
                    <td>{formatNumber(monthRevenue)}</td>
                    <td>{formatNumber(Number(month.costs) || 0)}</td>
                    <td>{formatNumber(monthNet)}</td>
                    <td>{monthMargin}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Alert if negative */}
      {summary.net_revenue < 0 && (
        <div className="alert alert-warning">
          ⚠️ Résultat négatif sur cette période. Coûts: {formatNumber(summary.total_costs)} {'>'} 
          Revenus: {formatNumber(summary.total_income)}
        </div>
      )}
    </section>
  );
}

function formatNumber(num) {
  const n = Number(num) || 0;
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF'
  }).format(n);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-GN', { year: 'numeric', month: 'short' });
}

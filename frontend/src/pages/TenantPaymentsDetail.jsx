// src/pages/TenantPaymentsDetail.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/apiClient';
import '../styles/tenant-detail.css';

export default function TenantPaymentsDetail() {
  const { tenantId } = useParams();
  const [payments, setPayments] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  async function loadData() {
    try {
      setLoading(true);
      const agencyId = localStorage.getItem('agency_id') || '1';

      // Détail paiements
      const paymentsRes = await api.get(
        `/api/reporting/tenant-payments?tenant_id=${tenantId}&agency_id=${agencyId}`
      );
      setPayments(paymentsRes.payments || []);
      setStats(paymentsRes.statistics || {});

      // Prédiction IA
      try {
        const predRes = await api.get(`/api/ai/predictions/tenant/${tenantId}`);
        setPrediction(predRes);
      } catch (err) {
        console.warn('Prediction not available');
      }
    } catch (err) {
      setError(err.message);
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading-spinner">Chargement...</div>;
  if (error) return <div className="error-box">Erreur: {error}</div>;

  return (
    <section className="tenant-detail">
      <h2>🏠 Détail Paiements Locataire #{tenantId}</h2>

      {/* AI Prediction */}
      {prediction && (
        <div className={`ai-prediction risk-${prediction.risk_level.toLowerCase()}`}>
          <div className="prediction-header">
            <h3>🤖 Prédiction IA Paiement</h3>
            <div className={`risk-badge ${prediction.risk_level}`}>
              {prediction.risk_level}
            </div>
          </div>

          <div className="prediction-content">
            <div className="prob-display">
              <div className="prob-circle">
                <span className="prob-value">{prediction.probability_percent}%</span>
              </div>
              <div className="prob-text">
                Probabilité de paiement
                <br />
                <small>Modèle: {prediction.model_version}</small>
              </div>
            </div>

            {/* Risk Factors */}
            <div className="risk-factors">
              <h4>Facteurs de Risque</h4>
              <div className="factors-grid">
                <div className="factor">
                  <span className="factor-label">Ratio Paiement</span>
                  <span className="factor-value">
                    {Math.round(prediction.risk_factors.pay_ratio * 100)}%
                  </span>
                </div>
                <div className="factor">
                  <span className="factor-label">Ratio Retard</span>
                  <span className="factor-value">
                    {Math.round(prediction.risk_factors.late_ratio * 100)}%
                  </span>
                </div>
                <div className="factor">
                  <span className="factor-label">Score Risque</span>
                  <span className="factor-value">
                    {prediction.risk_factors.risk_score.toFixed(1)}/10
                  </span>
                </div>
              </div>
            </div>

            {/* Recommended Actions */}
            {prediction.recommended_actions && prediction.recommended_actions.length > 0 && (
              <div className="actions">
                <h4>Actions Recommandées</h4>
                <div className="actions-list">
                  {prediction.recommended_actions.map((action, idx) => (
                    <div key={idx} className={`action-item priority-${action.priority}`}>
                      <div className="action-type">{action.type}</div>
                      <div className="action-description">{action.action}</div>
                      {action.timing && <small className="action-timing">{action.timing}</small>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-label">Total Paiements</div>
              <div className="stat-value">{stats.total_payments}</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-label">Paiements OK</div>
              <div className="stat-value">{stats.paid_count}</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-label">Retards</div>
              <div className="stat-value">{stats.late_count}</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">Fiabilité</div>
              <div className="stat-value">{stats.reliability_percent}%</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-label">Total Versé</div>
              <div className="stat-value">{formatNumber(stats.total_amount)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="payments-table">
        <h3>Historique Détaillé</h3>
        {payments.length === 0 ? (
          <div className="no-data">Aucun paiement enregistré</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Échéance</th>
                <th>Payé le</th>
                <th>Retard (j)</th>
                <th>Montant</th>
                <th>Méthode</th>
                <th>Statut</th>
                <th>Référence</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, idx) => (
                <tr key={idx} className={`status-${p.status}`}>
                  <td>{formatDate(p.due_date)}</td>
                  <td>{p.paid_date ? formatDate(p.paid_date) : '-'}</td>
                  <td>{p.days_late || 0}</td>
                  <td>{formatNumber(p.amount)}</td>
                  <td>
                    <span className="method-badge">{getMethodIcon(p.method)} {p.method}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${p.status}`}>
                      {getStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="ref-cell">{p.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notes */}
      {payments.some(p => p.notes) && (
        <div className="notes-section">
          <h3>Notes</h3>
          {payments.filter(p => p.notes).map((p, idx) => (
            <div key={idx} className="note-item">
              <strong>{formatDate(p.due_date)}:</strong> {p.notes}
            </div>
          ))}
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
  return new Date(dateStr).toLocaleDateString('fr-GN');
}

function getStatusLabel(status) {
  const labels = {
    'PAID': '✅ Payé',
    'LATE': '⏰ En Retard',
    'PARTIAL': '⚠️ Partiel',
    'DUE': '📅 Prévu',
    'CANCELLED': '❌ Annulé'
  };
  return labels[status] || status;
}

function getMethodIcon(method) {
  const icons = {
    'CASH': '💵',
    'ORANGE': '📱',
    'MTN': '📱',
    'VIREMENT': '🏦',
    'CHEQUE': '📄'
  };
  return icons[method] || '💰';
}

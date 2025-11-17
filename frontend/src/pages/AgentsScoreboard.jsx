// src/pages/AgentsScoreboard.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import '../styles/scoreboard.css';

export default function AgentsScoreboard() {
  const [agents, setAgents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('collected'); // collected, success_rate, score

  useEffect(() => {
    loadScoreboard();
  }, []);

  async function loadScoreboard() {
    try {
      setLoading(true);
      const agencyId = localStorage.getItem('agency_id') || '1';
      const res = await api.get(`/api/agents-expert/scoreboard?agency_id=${agencyId}`);
      setAgents(res.agents || []);
      setSummary(res.summary || {});
    } catch (err) {
      setError(err.message);
      console.error('Scoreboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading-spinner">Chargement du scoreboard...</div>;
  if (error) return <div className="error-box">Erreur: {error}</div>;

  // Sorting
  const sortedAgents = [...agents].sort((a, b) => {
    switch (sortBy) {
      case 'collected':
        return b.performance.total_collected - a.performance.total_collected;
      case 'success_rate':
        return b.performance.success_rate_percent - a.performance.success_rate_percent;
      case 'score':
        return b.score - a.score;
      default:
        return 0;
    }
  });

  return (
    <section className="agents-scoreboard">
      <h2>🏆 Performance des Agents</h2>

      {/* Summary */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <div className="summary-label">Total Encaissé</div>
              <div className="summary-value">{formatNumber(summary.total_collected)}</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <div className="summary-label">Taux Réussite Moyen</div>
              <div className="summary-value">{summary.avg_success_rate || 0}%</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">🎯</div>
            <div className="summary-content">
              <div className="summary-label">Objectifs Atteints</div>
              <div className="summary-value">{summary.on_target_count}/{agents.length}</div>
            </div>
          </div>

          {summary.top_agent && (
            <div className="summary-card top-agent">
              <div className="summary-icon">⭐</div>
              <div className="summary-content">
                <div className="summary-label">Agent Top</div>
                <div className="summary-value">{summary.top_agent.name}</div>
                <small>{formatNumber(summary.top_agent.performance.total_collected)}</small>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sort Controls */}
      <div className="sort-controls">
        <button
          className={`sort-btn ${sortBy === 'collected' ? 'active' : ''}`}
          onClick={() => setSortBy('collected')}
        >
          💰 Encaissements
        </button>
        <button
          className={`sort-btn ${sortBy === 'success_rate' ? 'active' : ''}`}
          onClick={() => setSortBy('success_rate')}
        >
          📈 Taux Réussite
        </button>
        <button
          className={`sort-btn ${sortBy === 'score' ? 'active' : ''}`}
          onClick={() => setSortBy('score')}
        >
          🏅 Score
        </button>
      </div>

      {/* Agents Table */}
      <div className="agents-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Agent</th>
              <th>Zone</th>
              <th>Encaissements</th>
              <th>Paiements OK</th>
              <th>Retards</th>
              <th>Taux Réussite</th>
              <th>Objectif</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedAgents.map((agent, idx) => (
              <tr key={agent.id} className={`rank-${idx + 1}`}>
                <td className="rank">{idx + 1}</td>
                <td className="agent-name">
                  <strong>{agent.name}</strong>
                  <br />
                  <small>{agent.email}</small>
                </td>
                <td>{agent.zone || 'N/A'}</td>
                <td className="value-collected">
                  {formatNumber(agent.performance.total_collected)}
                </td>
                <td className="value-ok">{agent.performance.payments_ok}</td>
                <td className="value-late">{agent.performance.late_count}</td>
                <td className="value-rate">
                  <span className={`rate-badge rate-${agent.performance.success_rate_percent}`}>
                    {agent.performance.success_rate_percent}%
                  </span>
                </td>
                <td className="target-cell">
                  <div className="target-display">
                    <div className="target-bar">
                      <div
                        className="target-fill"
                        style={{
                          width: `${Math.min(100, agent.targets.achievement_percent)}%`,
                          backgroundColor: getTargetColor(agent.targets.achievement_percent)
                        }}
                      />
                    </div>
                    <span className="target-percent">
                      {agent.targets.achievement_percent}%
                    </span>
                  </div>
                  <div className="target-status">{agent.targets.status}</div>
                </td>
                <td className="score-cell">
                  <div className="score-badge">
                    {Math.round(agent.score)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <span className="legend-color objectif-atteint"></span>
          Objectif Atteint ({'>'}= 100%)
        </div>
        <div className="legend-item">
          <span className="legend-color bon"></span>
          Bon (80-99%)
        </div>
        <div className="legend-item">
          <span className="legend-color moyen"></span>
          Moyen (50-79%)
        </div>
        <div className="legend-item">
          <span className="legend-color insuffisant"></span>
          Insuffisant ({'<'}50%)
        </div>
      </div>
    </section>
  );
}

function formatNumber(num) {
  const n = Number(num) || 0;
  if (n === 0) return '-';
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);
}

function getTargetColor(percent) {
  if (percent >= 100) return '#4CAF50'; // Green
  if (percent >= 80) return '#8BC34A'; // Light Green
  if (percent >= 50) return '#FFC107'; // Yellow
  return '#F44336'; // Red
}

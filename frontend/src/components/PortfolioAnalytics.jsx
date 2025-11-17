/**
 * 💼 Advanced Portfolio Analytics Component
 * Multi-property portfolio analysis, risk assessment, optimization
 * frontend/src/components/PortfolioAnalytics.jsx
 */

import React, { useState, useEffect } from 'react';
import styles from './PortfolioAnalytics.module.css';

const PortfolioAnalytics = () => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [competitiveData, setCompetitiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState('roi');

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const getToken = () => localStorage.getItem('jwt_token');

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      
      // Fetch portfolio risk assessment
      const riskResponse = await fetch('/api/analytics/advanced/portfolio-risk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyIds: [] // Backend gets all user properties
        })
      });

      if (riskResponse.ok) {
        const riskData = await riskResponse.json();
        setRiskAssessment(riskData);
      }

      // Fetch competitive data for first property
      if (selectedProperty) {
        const compResponse = await fetch(`/api/analytics/advanced/competitive/${selectedProperty}`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        
        if (compResponse.ok) {
          const compData = await compResponse.json();
          setCompetitiveData(compData);
        }
      }
    } catch (err) {
      console.error('Erreur portfolio fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>⏳ Analyse Portfolio...</div>;
  }

  const portfolio = riskAssessment?.portfolio || {};

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>💼 Analyse Portfolio</h1>
          <p>Analyse complète multi-propriétés</p>
        </div>
        <button 
          className={styles.refreshBtn}
          onClick={fetchPortfolioData}
        >
          🔄 Actualiser
        </button>
      </div>

      {/* PORTFOLIO OVERVIEW */}
      {portfolio && (
        <div className={styles.overview}>
          <OverviewCard
            icon="🏠"
            label="Total Propriétés"
            value={portfolio.totalProperties || 0}
          />
          <OverviewCard
            icon="💰"
            label="Valeur Totale"
            value={`${((portfolio.totalValue || 0) / 1000000).toFixed(1)}M GNF`}
          />
          <OverviewCard
            icon="💵"
            label="ROI Moyen"
            value={`${(portfolio.averageROI || 0).toFixed(1)}%`}
          />
          <OverviewCard
            icon="📊"
            label="Risque Global"
            value={portfolio.riskLevel || 'MODERATE'}
          />
        </div>
      )}

      {/* RISK ASSESSMENT */}
      {riskAssessment?.riskFactors && (
        <div className={styles.section}>
          <h2>⚠️ Évaluation des Risques</h2>
          <div className={styles.riskGrid}>
            {Object.entries(riskAssessment.riskFactors).map(([factor, score]) => (
              <div key={factor} className={styles.riskCard}>
                <h3>{factor}</h3>
                <div className={styles.riskScore}>
                  <div className={styles.riskBar}>
                    <div 
                      className={`${styles.riskFill} ${styles[`risk-${getRiskColor(score).toLowerCase()}`]}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className={styles.riskValue}>{score.toFixed(0)}%</span>
                </div>
                <p className={styles.riskLabel}>{getRiskColor(score)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DIVERSIFICATION ANALYSIS */}
      {riskAssessment?.diversification && (
        <div className={styles.section}>
          <h2>📈 Analyse Diversification</h2>
          <div className={styles.diversificationGrid}>
            <div className={styles.diversCard}>
              <h3>Distribution Type</h3>
              <div className={styles.typeChart}>
                {Object.entries(riskAssessment.diversification.byType || {}).map(([type, pct]) => (
                  <div key={type} className={styles.typeItem}>
                    <div className={styles.typeLabel}>{type}</div>
                    <div className={styles.typeBar}>
                      <div 
                        className={styles.typeSegment}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className={styles.typePercent}>{pct.toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.diversCard}>
              <h3>Distribution Localisation</h3>
              <div className={styles.locationChart}>
                {Object.entries(riskAssessment.diversification.byLocation || {}).map(([loc, pct]) => (
                  <div key={loc} className={styles.locItem}>
                    <span className={styles.locName}>{loc}</span>
                    <div className={styles.locBar}>
                      <div 
                        className={styles.locSegment}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={styles.locPercent}>{pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.diversCard}>
              <h3>Distribution Price</h3>
              <div className={styles.priceChart}>
                {Object.entries(riskAssessment.diversification.byPrice || {}).map(([range, pct]) => (
                  <div key={range} className={styles.priceItem}>
                    <span className={styles.priceName}>{range}</span>
                    <div className={styles.priceBar}>
                      <div 
                        className={styles.priceSegment}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={styles.pricePercent}>{pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDATIONS */}
      {riskAssessment?.recommendations && (
        <div className={styles.section}>
          <h2>💡 Recommandations</h2>
          <div className={styles.recommendationsList}>
            {riskAssessment.recommendations.map((rec, idx) => (
              <div key={idx} className={styles.recommendationItem}>
                <span className={styles.recIcon}>✨</span>
                <p>{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPETITIVE ANALYSIS */}
      {competitiveData && (
        <div className={styles.section}>
          <h2>🏆 Analyse Concurrentielle</h2>
          <div className={styles.competitiveGrid}>
            <CompetitiveCard
              label="Votre Prix"
              value={`${(competitiveData.yourProperty?.price / 1000000).toFixed(1)}M GNF`}
              status="neutral"
            />
            <CompetitiveCard
              label="Prix Marché"
              value={`${(competitiveData.marketAverage / 1000000).toFixed(1)}M GNF`}
              status="info"
            />
            <CompetitiveCard
              label="Différence"
              value={`${competitiveData.priceDifference.toFixed(1)}%`}
              status={competitiveData.priceDifference > 0 ? 'warning' : 'success'}
            />
            <CompetitiveCard
              label="Position Marché"
              value={competitiveData.marketPosition}
              status="info"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component
const OverviewCard = ({ icon, label, value }) => (
  <div className={styles.overviewCard}>
    <div className={styles.overviewIcon}>{icon}</div>
    <div className={styles.overviewContent}>
      <p className={styles.overviewLabel}>{label}</p>
      <p className={styles.overviewValue}>{value}</p>
    </div>
  </div>
);

const CompetitiveCard = ({ label, value, status }) => (
  <div className={`${styles.compCard} ${styles[`status-${status}`]}`}>
    <h3>{label}</h3>
    <p className={styles.compValue}>{value}</p>
  </div>
);

const getRiskColor = (score) => {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MODERATE';
  return 'LOW';
};

export default PortfolioAnalytics;

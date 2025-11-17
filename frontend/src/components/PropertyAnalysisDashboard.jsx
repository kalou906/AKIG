/**
 * Component: Property Analysis Dashboard
 * Modern interface for Guinean real estate market analysis
 * Integrated with AI services for intelligent property insights
 * 
 * Features:
 * - Property price prediction
 * - Market trend analysis
 * - AI-generated descriptions
 * - Improvement suggestions
 * - Sales duration predictions
 * - Complete property analysis
 */

import React, { useState, useEffect } from 'react';
import styles from './PropertyAnalysisDashboard.module.css';

const PropertyAnalysisDashboard = () => {
  const [activeTab, setActiveTab] = useState('analyze');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    surface: '',
    rooms: '',
    bathrooms: '',
    location: 'Kaloum',
    property_type: 'maison',
    condition: 'bon',
    amenities: [],
    yearBuilt: new Date().getFullYear()
  });
  
  const [results, setResults] = useState({
    priceAnalysis: null,
    description: null,
    improvements: null,
    marketTrends: null,
    opportunities: null
  });

  const guineanLocations = [
    'Kaloum',
    'Dixinn',
    'Ratoma',
    'Kindia',
    'Mamou',
    'Fria'
  ];

  const propertyTypes = [
    'maison',
    'appartement',
    'villa',
    'duplex',
    'terrain'
  ];

  const conditions = [
    'excellent',
    'bon',
    'moyen',
    'à rénover'
  ];

  const availableAmenities = [
    'parking',
    'jardin',
    'piscine',
    'securite',
    'climatisation',
    'ascenseur',
    'garage',
    'cuisine moderne',
    'salle sport',
    'balcon'
  ];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle amenities toggle
  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  // Get JWT token from localStorage (adjust based on your auth system)
  const getToken = () => localStorage.getItem('jwt_token');

  // Analyze price
  const analyzePrice = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setResults(prev => ({
          ...prev,
          priceAnalysis: data.analysis
        }));
        setActiveTab('results');
      }
    } catch (err) {
      console.error('Erreur analyse prix:', err);
      alert('Erreur lors de l\'analyse du prix');
    }
    setLoading(false);
  };

  // Generate description
  const generateDescription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setResults(prev => ({
          ...prev,
          description: data.description
        }));
        setActiveTab('results');
      }
    } catch (err) {
      console.error('Erreur génération description:', err);
      alert('Erreur lors de la génération de la description');
    }
    setLoading(false);
  };

  // Get improvements
  const getImprovements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/property-improvements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setResults(prev => ({
          ...prev,
          improvements: data.improvements
        }));
        setActiveTab('results');
      }
    } catch (err) {
      console.error('Erreur suggestions améliorations:', err);
      alert('Erreur lors de la récupération des suggestions');
    }
    setLoading(false);
  };

  // Get market trends
  const getMarketTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/market-trends', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(prev => ({
          ...prev,
          marketTrends: data.trends
        }));
        setActiveTab('results');
      }
    } catch (err) {
      console.error('Erreur tendances marché:', err);
      alert('Erreur lors de la récupération des tendances');
    }
    setLoading(false);
  };

  // Get opportunities
  const getOpportunities = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/market-opportunities', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(prev => ({
          ...prev,
          opportunities: data.opportunities
        }));
        setActiveTab('results');
      }
    } catch (err) {
      console.error('Erreur opportunités marché:', err);
      alert('Erreur lors de la récupération des opportunités');
    }
    setLoading(false);
  };

  // Complete analysis
  const completeAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/complete-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setResults(prev => ({
          ...prev,
          priceAnalysis: data.completeAnalysis.priceAnalysis,
          description: data.completeAnalysis.description,
          improvements: data.completeAnalysis.improvements,
          salesDuration: data.completeAnalysis.salesDuration
        }));
        setActiveTab('results');
      }
    } catch (err) {
      console.error('Erreur analyse complète:', err);
      alert('Erreur lors de l\'analyse complète');
    }
    setLoading(false);
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>🏠 Analyse Immobilière IA</h1>
        <p>Analyse intelligente des propriétés dans le contexte guinéen</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'analyze' ? styles.active : ''}`}
          onClick={() => setActiveTab('analyze')}
        >
          📋 Analyser
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'market' ? styles.active : ''}`}
          onClick={() => setActiveTab('market')}
        >
          📊 Marché
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'results' ? styles.active : ''}`}
          onClick={() => setActiveTab('results')}
        >
          ✅ Résultats
        </button>
      </div>

      {/* ANALYZE TAB */}
      {activeTab === 'analyze' && (
        <div className={styles.tabContent}>
          <div className={styles.formSection}>
            <h2>Informations Propriété</h2>

            {/* Basic Info */}
            <div className={styles.formGroup}>
              <label>Titre *</label>
              <input
                type="text"
                name="title"
                placeholder="Ex: Villa 4 pièces Kaloum"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Surface (m²) *</label>
                <input
                  type="number"
                  name="surface"
                  placeholder="150"
                  value={formData.surface}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Chambres *</label>
                <input
                  type="number"
                  name="rooms"
                  placeholder="4"
                  value={formData.rooms}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Salles de bain</label>
                <input
                  type="number"
                  name="bathrooms"
                  placeholder="2"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Location & Type */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Localisation *</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                >
                  {guineanLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Type Propriété</label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleInputChange}
                >
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>État</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                >
                  {conditions.map(cond => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amenities */}
            <div className={styles.formGroup}>
              <label>Commodités</label>
              <div className={styles.amenitiesGrid}>
                {availableAmenities.map(amenity => (
                  <label key={amenity} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Year Built */}
            <div className={styles.formGroup}>
              <label>Année Construction</label>
              <input
                type="number"
                name="yearBuilt"
                value={formData.yearBuilt}
                onChange={handleInputChange}
              />
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={completeAnalysis}
                disabled={loading || !formData.surface || !formData.rooms}
              >
                {loading ? '⏳ Analyse...' : '🚀 Analyse Complète'}
              </button>

              <div className={styles.quickActions}>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={analyzePrice}
                  disabled={loading}
                >
                  💰 Prix
                </button>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={generateDescription}
                  disabled={loading}
                >
                  ✍️ Description
                </button>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={getImprovements}
                  disabled={loading}
                >
                  ⭐ Améliorations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MARKET TAB */}
      {activeTab === 'market' && (
        <div className={styles.tabContent}>
          <div className={styles.marketSection}>
            <h2>Marché Immobilier Guinéen</h2>

            <div className={styles.marketButtons}>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={getMarketTrends}
                disabled={loading}
              >
                {loading ? '⏳ Chargement...' : '📊 Tendances Marché'}
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={getOpportunities}
                disabled={loading}
              >
                {loading ? '⏳ Chargement...' : '💎 Opportunités'}
              </button>
            </div>

            {results.marketTrends && (
              <div className={styles.resultsCard}>
                <h3>Tendances Marché</h3>
                <div className={styles.statsGrid}>
                  <div className={styles.stat}>
                    <span className={styles.label}>Total Propriétés</span>
                    <span className={styles.value}>{results.marketTrends.totalProperties}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>Prix Moyen</span>
                    <span className={styles.value}>
                      {(results.marketTrends.averagePrice / 1000000).toFixed(1)}M GNF
                    </span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>Surface Moyenne</span>
                    <span className={styles.value}>{results.marketTrends.averageSurface} m²</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>Chambres Moyenne</span>
                    <span className={styles.value}>{results.marketTrends.averageRooms.toFixed(1)}</span>
                  </div>
                </div>

                {results.marketTrends.marketInsights && (
                  <div className={styles.insights}>
                    <h4>📌 Insights</h4>
                    <ul>
                      {results.marketTrends.marketInsights.map((insight, idx) => (
                        <li key={idx}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {results.opportunities && (
              <div className={styles.resultsCard}>
                <h3>Opportunités Marché</h3>
                <div className={styles.opportunitiesList}>
                  {results.opportunities.map(opp => (
                    <div key={opp.id} className={styles.opportunityCard}>
                      <div className={styles.oppHeader}>
                        <h4>{opp.title}</h4>
                        <span className={styles.score}>Score: {opp.opportunityScore}%</span>
                      </div>
                      <p className={styles.oppPrice}>{(opp.price / 1000000).toFixed(1)}M GNF</p>
                      <p className={styles.oppRec}>{opp.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESULTS TAB */}
      {activeTab === 'results' && (
        <div className={styles.tabContent}>
          <div className={styles.resultsSection}>
            {results.priceAnalysis && (
              <div className={styles.resultsCard}>
                <h3>💰 Analyse Prix</h3>
                <div className={styles.priceGrid}>
                  <div className={styles.priceCard}>
                    <span className={styles.label}>Prix Estimé</span>
                    <span className={styles.price}>
                      {(results.priceAnalysis.estimatedPrice / 1000000).toFixed(2)}M GNF
                    </span>
                  </div>
                  <div className={styles.priceCard}>
                    <span className={styles.label}>Min - Max</span>
                    <span className={styles.range}>
                      {(results.priceAnalysis.minPrice / 1000000).toFixed(1)}M - {(results.priceAnalysis.maxPrice / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className={styles.priceCard}>
                    <span className={styles.label}>Prix/m²</span>
                    <span className={styles.pricePerSqm}>
                      {results.priceAnalysis.pricePerSqm.toLocaleString()} GNF
                    </span>
                  </div>
                </div>
                {results.priceAnalysis.suggestions && (
                  <div className={styles.suggestions}>
                    <h4>💡 Suggestions</h4>
                    <ul>
                      {results.priceAnalysis.suggestions.map((sugg, idx) => (
                        <li key={idx}>{sugg}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {results.description && (
              <div className={styles.resultsCard}>
                <h3>✍️ Description Générée</h3>
                <p className={styles.descriptionText}>{results.description}</p>
              </div>
            )}

            {results.improvements && (
              <div className={styles.resultsCard}>
                <h3>⭐ Améliorations Recommandées</h3>
                <div className={styles.improvementsList}>
                  {results.improvements.suggestions?.map((imp, idx) => (
                    <div key={idx} className={styles.improvementItem}>
                      <div className={styles.impHeader}>
                        <h4>{imp.improvement}</h4>
                        <span className={styles.impact}>+{imp.impactPercentage}%</span>
                      </div>
                      <p>
                        <strong>Coût:</strong> {imp.costLevel} |
                        <strong> Priorité:</strong> {imp.priority} |
                        <strong> ROI:</strong> {imp.roi}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.salesDuration && (
              <div className={styles.resultsCard}>
                <h3>⏰ Prédiction Vente</h3>
                <p>
                  <strong>Délai estimé:</strong> {results.salesDuration.estimatedDurationMonths}
                </p>
                <p>
                  <strong>Confiance:</strong> {results.salesDuration.confidence}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyAnalysisDashboard;

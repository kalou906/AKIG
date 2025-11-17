/**
 * Exemple d'intégration du composant OwnerKPI
 * Différents cas d'usage et configurations
 */

import React, { useState } from 'react';
import OwnerKPI from '@/components/OwnerKPI';
import { useLanguage } from '@/i18n/hooks';

/**
 * Exemple 1: Utilisation basique
 */
export function OwnerKPIBasic() {
  return <OwnerKPI />;
}

/**
 * Exemple 2: Avec filtrage par agence et propriété
 */
export function OwnerKPIWithFilters() {
  const [agencyId, setAgencyId] = useState<string>('agency-001');
  const [propertyId, setPropertyId] = useState<string>('');

  return (
    <div>
      <div style={{ marginBottom: '2rem', background: 'white', padding: '1rem', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="agency-select">Agence:</label>
            <select
              id="agency-select"
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="agency-001">Agence Paris</option>
              <option value="agency-002">Agence Lyon</option>
              <option value="agency-003">Agence Marseille</option>
            </select>
          </div>

          <div>
            <label htmlFor="property-select">Propriété:</label>
            <select
              id="property-select"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">Toutes les propriétés</option>
              <option value="prop-001">Immeuble Avenue des Champs</option>
              <option value="prop-002">Résidence Prestige</option>
            </select>
          </div>
        </div>
      </div>

      <OwnerKPI agencyId={agencyId} propertyId={propertyId} />
    </div>
  );
}

/**
 * Exemple 3: Avec sélection de période
 */
export function OwnerKPIWithPeriod() {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  return (
    <div>
      <div style={{ marginBottom: '2rem', background: 'white', padding: '1rem', borderRadius: '8px' }}>
        <label htmlFor="period-select">Période de comparaison:</label>
        <select
          id="period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          style={{ width: '100%', padding: '0.5rem', maxWidth: '300px' }}
        >
          <option value="month">Ce mois</option>
          <option value="quarter">Ce trimestre</option>
          <option value="year">Cette année</option>
        </select>
      </div>

      <OwnerKPI comparisonPeriod={period} />
    </div>
  );
}

/**
 * Exemple 4: Avec refresh personnalisé
 */
export function OwnerKPIWithCustomRefresh() {
  const [refreshInterval, setRefreshInterval] = useState(300);

  return (
    <div>
      <div style={{ marginBottom: '2rem', background: 'white', padding: '1rem', borderRadius: '8px' }}>
        <label htmlFor="refresh-select">Intervalle de rafraîchissement:</label>
        <select
          id="refresh-select"
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
          style={{ width: '100%', padding: '0.5rem', maxWidth: '300px' }}
        >
          <option value={60}>Toutes les 1 min</option>
          <option value={300}>Toutes les 5 min (défaut)</option>
          <option value={600}>Toutes les 10 min</option>
          <option value={3600}>Toutes les 1 heure</option>
        </select>
      </div>

      <OwnerKPI refreshInterval={refreshInterval} />
    </div>
  );
}

/**
 * Exemple 5: Avec callback de changement
 */
export function OwnerKPIWithCallback() {
  const [lastData, setLastData] = useState<any>(null);

  const handleDataChange = (data: any) => {
    console.log('KPI Data updated:', data);
    setLastData(data);
  };

  return (
    <div>
      <OwnerKPI onDataChange={handleDataChange} />

      {lastData && (
        <div
          style={{
            marginTop: '2rem',
            background: 'white',
            padding: '1rem',
            borderRadius: '8px',
            maxHeight: '300px',
            overflow: 'auto',
          }}
        >
          <h3>Dernières données reçues:</h3>
          <pre style={{ fontSize: '0.8rem', color: '#666' }}>
            {JSON.stringify(lastData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Exemple 6: Composant dashboard complet avec multi-langue
 */
export function OwnerDashboard() {
  const { language, setLanguage, getAvailableLanguages } = useLanguage();
  const [agencyId, setAgencyId] = useState('agency-001');
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [notifications, setNotifications] = useState<string[]>([]);

  const handleDataChange = (data: any) => {
    const newNotifications: string[] = [];

    if (data.tenantsInDefault > 0) {
      newNotifications.push(`⚠️ ${data.tenantsInDefault} locataire(s) en défaut`);
    }
    if (data.expiringContracts > 0) {
      newNotifications.push(`📅 ${data.expiringContracts} contrat(s) expire(nt) bientôt`);
    }
    if (data.rentCollectionRate < 80) {
      newNotifications.push(`💰 Taux de collecte: ${data.rentCollectionRate}%`);
    }

    setNotifications(newNotifications);
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header avec langue */}
      <header style={{ background: 'white', padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0 }}>AKIG - Dashboard</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span>Langue:</span>
            {getAvailableLanguages().map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                style={{
                  padding: '0.5rem 1rem',
                  background: language === lang.code ? '#3498db' : '#ecf0f1',
                  color: language === lang.code ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{ maxWidth: '1400px', margin: '1rem auto', padding: '0 1rem' }}>
          {notifications.map((notif, idx) => (
            <div
              key={idx}
              style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                padding: '1rem',
                marginBottom: '0.5rem',
              }}
            >
              {notif}
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '1rem auto',
          background: 'white',
          borderRadius: '8px',
          padding: '1rem',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="agency">Agence:</label>
            <select
              id="agency"
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="agency-001">Agence Paris</option>
              <option value="agency-002">Agence Lyon</option>
            </select>
          </div>

          <div>
            <label htmlFor="period">Période:</label>
            <select
              id="period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
        <OwnerKPI
          agencyId={agencyId}
          comparisonPeriod={period}
          refreshInterval={300}
          onDataChange={handleDataChange}
        />
      </div>
    </div>
  );
}

export default OwnerDashboard;

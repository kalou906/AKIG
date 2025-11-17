/**
 * OwnerKPI Component
 * Tableau de bord des indicateurs clés pour propriétaires/gestionnaires
 * Métriques financières, occupancy, contrats, locataires
 */

import React, { useState, useEffect, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useI18n, useDateFormatter, useNumberFormatter, useLanguage } from '@/i18n/hooks';
import axios from 'axios';
import './OwnerKPI.css';

interface KPIData {
  // Finances
  rentCollectionRate: number;
  totalArrears: number;
  monthlyRentExpected: number;
  monthlyRentCollected: number;
  overdueAmount: number;
  overduePayments: number;
  
  // Occupancy
  occupancyRate: number;
  occupiedUnits: number;
  totalUnits: number;
  vacantUnits: number;
  
  // Contrats
  activeContracts: number;
  expiringContracts: number;
  expiredContracts: number;
  averageLeaseLength: number;
  
  // Locataires
  totalTenants: number;
  newTenants: number;
  tenantsInDefault: number;
  
  // Maintenance
  maintenanceRequests: number;
  maintenanceCompleted: number;
  maintenanceCompletionRate: number;
  
  // Last update
  lastUpdate: string;
}

interface OwnerKPIProps {
  agencyId?: string;
  propertyId?: string;
  refreshInterval?: number; // in seconds
  comparisonPeriod?: 'month' | 'quarter' | 'year';
  onDataChange?: (data: KPIData) => void;
}

/**
 * Composant de card KPI réutilisable
 */
interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  threshold?: number;
  status?: 'good' | 'warning' | 'critical';
  onClick?: () => void;
  subtext?: string;
}

const KPICard: FC<KPICardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  threshold,
  status,
  onClick,
  subtext,
}) => {
  const getStatusClass = (val: number, thresh?: number) => {
    if (!thresh) return 'neutral';
    if (val >= thresh) return 'good';
    if (val >= thresh * 0.8) return 'warning';
    return 'critical';
  };

  const computedStatus = status || getStatusClass(
    typeof value === 'string' ? 0 : value,
    threshold
  );

  return (
    <div
      className={`kpi-card kpi-card--${computedStatus}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {icon && <span className="kpi-card__icon">{icon}</span>}
      <div className="kpi-card__header">
        <h3 className="kpi-card__title">{title}</h3>
        {trend && (
          <span className={`kpi-card__trend kpi-card__trend--${trend}`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'stable' && '→'}
            {trendValue && ` ${trendValue}%`}
          </span>
        )}
      </div>
      <div className="kpi-card__value">
        <span className="kpi-card__number">{value}</span>
        {unit && <span className="kpi-card__unit">{unit}</span>}
      </div>
      {subtext && <p className="kpi-card__subtext">{subtext}</p>}
    </div>
  );
};

/**
 * Composant principal OwnerKPI
 */
export const OwnerKPI: FC<OwnerKPIProps> = ({
  agencyId,
  propertyId,
  refreshInterval = 300, // 5 minutes
  comparisonPeriod = 'month',
  onDataChange,
}) => {
  const { t } = useTranslation();
  const { t: tPayments } = useI18n('payments');
  const { t: tCommon } = useI18n('common');
  const { formatCurrency, formatNumber, formatPercent } = useNumberFormatter();
  const { formatDate } = useDateFormatter();
  const { isRTL } = useLanguage();

  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Charger les données KPI
  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/metrics/kpi', {
          params: {
            agencyId,
            propertyId,
            period: comparisonPeriod,
          },
        });
        setData(response.data);
        setLastRefresh(new Date());
        setError(null);
        onDataChange?.(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load KPI data');
        console.error('KPI fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIData();

    // Auto-refresh
    const interval = setInterval(fetchKPIData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [agencyId, propertyId, comparisonPeriod, refreshInterval, onDataChange]);

  if (loading && !data) {
    return (
      <div className="owner-kpi owner-kpi--loading">
        <p>{t('common:loading')}</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="owner-kpi owner-kpi--error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          {t('common:refresh')}
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="owner-kpi owner-kpi--empty">{t('common:no_data')}</div>;
  }

  // Déterminer le statut des impayés
  const getArrearsStatus = (rate: number): 'good' | 'warning' | 'critical' => {
    if (rate <= 5) return 'good';
    if (rate <= 15) return 'warning';
    return 'critical';
  };

  // Déterminer le statut de l'occupancy
  const getOccupancyStatus = (rate: number): 'good' | 'warning' | 'critical' => {
    if (rate >= 90) return 'good';
    if (rate >= 80) return 'warning';
    return 'critical';
  };

  const arrearsRate = data.monthlyRentExpected > 0 
    ? (1 - (data.monthlyRentCollected / data.monthlyRentExpected)) * 100 
    : 0;

  const maintenanceRate = data.maintenanceRequests > 0 
    ? (data.maintenanceCompleted / data.maintenanceRequests) * 100 
    : 0;

  return (
    <div className={`owner-kpi ${isRTL() ? 'owner-kpi--rtl' : ''}`}>
      {/* Header */}
      <div className="owner-kpi__header">
        <div className="owner-kpi__title-section">
          <h1 className="owner-kpi__title">📊 {t('common:dashboard')}</h1>
          <p className="owner-kpi__subtitle">
            {comparisonPeriod === 'month' && t('common:this_month')}
            {comparisonPeriod === 'quarter' && 'Ce trimestre'}
            {comparisonPeriod === 'year' && 'Cette année'}
          </p>
        </div>
        <div className="owner-kpi__meta">
          <span className="owner-kpi__last-update">
            {t('common:last_update')}: {formatDate(new Date(lastRefresh), {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <button
            className="owner-kpi__refresh-btn"
            onClick={() => window.location.reload()}
            title={t('common:refresh')}
          >
            ⟳
          </button>
        </div>
      </div>

      {/* Section Finances */}
      <section className="owner-kpi__section">
        <h2 className="owner-kpi__section-title">💰 {tPayments('title')}</h2>
        <div className="owner-kpi__grid owner-kpi__grid--3">
          {/* Taux collecte */}
          <KPICard
            title={tPayments('arrears.total_amount')}
            value={formatCurrency(data.monthlyRentCollected)}
            unit={`/ ${formatCurrency(data.monthlyRentExpected)}`}
            icon="💵"
            status={data.rentCollectionRate >= 80 ? 'good' : data.rentCollectionRate >= 60 ? 'warning' : 'critical'}
            subtext={`${formatPercent(data.rentCollectionRate / 100)} collecté`}
            threshold={80}
          />

          {/* Impayés */}
          <KPICard
            title={tPayments('arrears.total_amount')}
            value={formatCurrency(data.totalArrears)}
            icon="⚠️"
            status={getArrearsStatus(arrearsRate)}
            trend={arrearsRate > 10 ? 'up' : 'down'}
            subtext={`${formatNumber(data.overduePayments)} paiements en retard`}
          />

          {/* Impayés critiques */}
          <KPICard
            title="Retards > 30j"
            value={formatCurrency(data.overdueAmount)}
            icon="🔴"
            status={data.overdueAmount > 0 ? 'critical' : 'good'}
            subtext={`${formatNumber(data.overduePayments)} paiements`}
          />
        </div>
      </section>

      {/* Section Occupancy */}
      <section className="owner-kpi__section">
        <h2 className="owner-kpi__section-title">🏠 Occupancy</h2>
        <div className="owner-kpi__grid owner-kpi__grid--3">
          {/* Taux occupancy */}
          <KPICard
            title="Taux d'occupation"
            value={formatPercent(data.occupancyRate / 100)}
            icon="🔑"
            status={getOccupancyStatus(data.occupancyRate)}
            threshold={90}
            subtext={`${formatNumber(data.occupiedUnits)} / ${formatNumber(data.totalUnits)} unités`}
          />

          {/* Unités occupées */}
          <KPICard
            title="Unités occupées"
            value={formatNumber(data.occupiedUnits)}
            icon="✅"
            subtext={`${formatNumber(data.vacantUnits)} unités libres`}
          />

          {/* Taux vacance */}
          <KPICard
            title="Taux de vacance"
            value={formatPercent((data.vacantUnits / data.totalUnits) || 0)}
            icon="❌"
            status={data.vacantUnits === 0 ? 'good' : data.vacantUnits <= data.totalUnits * 0.1 ? 'warning' : 'critical'}
            subtext={`${formatNumber(data.vacantUnits)} unités`}
          />
        </div>
      </section>

      {/* Section Contrats */}
      <section className="owner-kpi__section">
        <h2 className="owner-kpi__section-title">📋 Contrats</h2>
        <div className="owner-kpi__grid owner-kpi__grid--3">
          {/* Contrats actifs */}
          <KPICard
            title="Contrats actifs"
            value={formatNumber(data.activeContracts)}
            icon="✅"
            status="good"
            trend={data.activeContracts > 0 ? 'stable' : 'down'}
          />

          {/* Contrats expirant */}
          <KPICard
            title="Expirant bientôt"
            value={formatNumber(data.expiringContracts)}
            icon="⏰"
            status={data.expiringContracts > 0 ? 'warning' : 'good'}
            subtext="À renouveler dans 30j"
          />

          {/* Expirés */}
          <KPICard
            title="Contrats expirés"
            value={formatNumber(data.expiredContracts)}
            icon="⛔"
            status={data.expiredContracts > 0 ? 'critical' : 'good'}
            subtext="Action requise"
          />

          {/* Durée moyenne */}
          <KPICard
            title="Durée moyenne"
            value={formatNumber(data.averageLeaseLength)}
            unit="mois"
            icon="📅"
            status="good"
          />
        </div>
      </section>

      {/* Section Locataires */}
      <section className="owner-kpi__section">
        <h2 className="owner-kpi__section-title">👥 Locataires</h2>
        <div className="owner-kpi__grid owner-kpi__grid--3">
          {/* Total locataires */}
          <KPICard
            title="Locataires actifs"
            value={formatNumber(data.totalTenants)}
            icon="👤"
            status="good"
          />

          {/* Nouveaux locataires */}
          <KPICard
            title="Nouveaux ce mois"
            value={formatNumber(data.newTenants)}
            icon="🆕"
            status="good"
            trend={data.newTenants > 0 ? 'up' : 'stable'}
          />

          {/* En défaut */}
          <KPICard
            title="En défaut de paiement"
            value={formatNumber(data.tenantsInDefault)}
            icon="⚠️"
            status={data.tenantsInDefault > 0 ? 'critical' : 'good'}
            subtext="Action requise"
          />
        </div>
      </section>

      {/* Section Maintenance */}
      <section className="owner-kpi__section">
        <h2 className="owner-kpi__section-title">🔧 Maintenance</h2>
        <div className="owner-kpi__grid owner-kpi__grid--3">
          {/* Demandes pendantes */}
          <KPICard
            title="Demandes pendantes"
            value={formatNumber(data.maintenanceRequests)}
            icon="⏳"
            status={data.maintenanceRequests > 5 ? 'warning' : 'good'}
          />

          {/* Complétées */}
          <KPICard
            title="Complétées"
            value={formatNumber(data.maintenanceCompleted)}
            icon="✅"
            status="good"
          />

          {/* Taux complète */}
          <KPICard
            title="Taux complétude"
            value={formatPercent(maintenanceRate / 100)}
            icon="📊"
            status={maintenanceRate >= 90 ? 'good' : maintenanceRate >= 70 ? 'warning' : 'critical'}
            threshold={90}
          />
        </div>
      </section>

      {/* Section Actions Requises */}
      {(data.expiringContracts > 0 || data.tenantsInDefault > 0 || data.vacantUnits > 0) && (
        <section className="owner-kpi__section owner-kpi__section--alert">
          <h2 className="owner-kpi__section-title">⚡ Actions requises</h2>
          <ul className="owner-kpi__action-list">
            {data.expiringContracts > 0 && (
              <li className="owner-kpi__action-item owner-kpi__action-item--warning">
                🔔 {data.expiringContracts} contrat(s) expire(nt) dans 30 jours
              </li>
            )}
            {data.tenantsInDefault > 0 && (
              <li className="owner-kpi__action-item owner-kpi__action-item--critical">
                🚨 {data.tenantsInDefault} locataire(s) en défaut de paiement
              </li>
            )}
            {data.vacantUnits > 0 && (
              <li className="owner-kpi__action-item owner-kpi__action-item--warning">
                📍 {data.vacantUnits} unité(s) vacante(s) à louer
              </li>
            )}
            {arrearsRate > 10 && (
              <li className="owner-kpi__action-item owner-kpi__action-item--warning">
                💰 Taux d'impayés à {formatPercent(arrearsRate / 100)}
              </li>
            )}
          </ul>
        </section>
      )}

      {/* Footer */}
      <div className="owner-kpi__footer">
        <p className="owner-kpi__disclaimer">
          Les données sont actualisées automatiquement toutes les {refreshInterval}s
        </p>
      </div>
    </div>
  );
};

export default OwnerKPI;

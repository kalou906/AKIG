import React, { useEffect, useState } from 'react';
import { FR, formatGNF } from '../i18n/fr';
// import { Alerts } from '../components/Alerts';
import { AiSearch } from '../components/AiSearch';
import { PaymentsChart, PaymentStats } from '../components/PaymentsChart';
import { Reports, Metrics } from '../api/client';
import { NetworkBanner } from '../components/NetworkBanner';

/**
 * Interface pour les données du rapport
 */
interface ReportData {
  total_tenants: number;
  total_rent: number;
  total_paid: number;
  total_overdue: number;
  payment_rate: number;
  tenants_up_to_date: number;
  tenants_overdue: number;
}

interface TopTenant {
  id: string;
  full_name: string;
  arrears_amount?: number;
  paid_amount?: number;
  arrears_months?: number;
  phone?: string;
  site?: string;
}

/**
 * Page Dashboard
 * Vue d'ensemble avec :
 * - KPIs principaux
 * - Graphique paiements vs dû
 * - Top impayés
 * - Top bons payeurs
 * - Recherche IA
 * - Alertes
 *
 * Exemple :
 * <Dashboard />
 */
export default function Dashboard(): React.ReactElement {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [report, setReport] = useState<ReportData | null>(null);
  const [chartStats, setChartStats] = useState<PaymentStats[]>([]);
  const [topOverdue, setTopOverdue] = useState<TopTenant[]>([]);
  const [topPayers, setTopPayers] = useState<TopTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger les données du dashboard
   */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Charger le rapport général
        const reportData = await Reports.summary(year);
        setReport(reportData);

        // Charger les paiements mensuels
        const monthlyData = await Reports.monthlyPayments(year);
        setChartStats((monthlyData && (monthlyData.stats || monthlyData)) || []);

        // Charger les top impayés
        const overdueData = await Reports.topOverdue(year);
        setTopOverdue((overdueData && (overdueData.items || overdueData)) || []);

        // Charger les top bons payeurs
        const payersData = await Reports.topPayers(year);
        setTopPayers((payersData && (payersData.items || payersData)) || []);

        // (Optionnel) Locataires complets pour alertes - désactivé pour alléger le chargement
        // const tenantsData = await Tenants.list(year);
        // setAllTenants((tenantsData && (tenantsData.items || tenantsData)) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [year]);

  // État de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">⏳</div>
          <p className="text-akig-muted">{FR.common.loading}</p>
        </div>
      </div>
    );
  }

  // Erreur
  if (error) {
    return (
      <div className="alert alert-error p-6 max-w-2xl mx-auto">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="font-semibold text-lg">{FR.common.error}</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <NetworkBanner />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading text-akig-blue mb-1">
            {FR.dashboard.title}
          </h1>
          <p className="text-akig-muted text-sm">
            Vue d'ensemble de votre activité
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="form-label m-0 whitespace-nowrap">{FR.common.year}:</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="form-select max-w-xs"
          >
            {Array.from(
              { length: new Date().getFullYear() - 2015 + 1 },
              (_, i) => 2015 + i
            ).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alertes - Commented out */}
      {/* {allTenants.length > 0 && (
        <Alerts tenants={allTenants as any} year={year} />
      )} */}

      {/* Recherche IA */}
      <AiSearch
        onFilters={(filters) => {
          console.log('Appliquer filtres:', filters);
        }}
      />

      {/* KPIs Cartes */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tenants */}
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-akig-blue">{FR.dashboard.totalTenants}</p>
                <p className="text-3xl font-bold text-akig-blue mt-2">{report.total_tenants}</p>
                <p className="text-xs text-blue-600 mt-2">
                  {report.tenants_up_to_date} actifs
                </p>
              </div>
              <span className="text-3xl">👥</span>
            </div>
          </div>

          {/* Paiements Reçus */}
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700">Paiements Reçus</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{formatGNF(report.total_paid)}</p>
                <p className="text-xs text-green-600 mt-2">
                  {Math.round((report.total_paid / (report.total_rent || 1)) * 100)}% perçu
                </p>
              </div>
              <span className="text-3xl">✓</span>
            </div>
          </div>

          {/* Impayés */}
          <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-akig-error">Impayés Totaux</p>
                <p className="text-3xl font-bold text-akig-error mt-2">{formatGNF(report.total_overdue)}</p>
                <p className="text-xs text-red-600 mt-2">
                  {report.tenants_overdue} locataires
                </p>
              </div>
              <span className="text-3xl">⚠️</span>
            </div>
          </div>

          {/* Taux Recouvrement */}
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-700">Taux Recouvrement</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  {Math.round(report.payment_rate * 100)}%
                </p>
                <p className="text-xs text-purple-600 mt-2">
                  À percevoir: {formatGNF(report.total_rent - report.total_paid)}
                </p>
              </div>
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </div>
      )}

      {/* Graphique Paiements vs Dû */}
      {chartStats.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📈 {FR.dashboard.paymentsVsDue}</h2>
          </div>
          <div className="card-body">
            <PaymentsChart stats={chartStats} height={350} />
          </div>
        </div>
      )}

      {/* Occupancy Rate (simple KPI) */}
      <OccupancyRateCard />

      {/* Top Impayés et Top Payeurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Impayés */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🔴 {FR.dashboard.topOverdue}</h2>
          </div>
          <div className="card-body">
            {topOverdue.length > 0 ? (
              <div className="space-y-2">
                {topOverdue.slice(0, 5).map((tenant, idx) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-3 hover:bg-akig-hover rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-akig-error text-white flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-akig-text">{tenant.full_name}</p>
                        <p className="text-xs text-akig-muted">{tenant.site || '—'}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-akig-error text-sm">
                      {formatGNF(tenant.arrears_amount || 0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-akig-muted">
                <p className="text-2xl mb-2">✅</p>
                <p>Aucun impayé</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Payeurs */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🟢 {FR.dashboard.topPayers}</h2>
          </div>
          <div className="card-body">
            {topPayers.length > 0 ? (
              <div className="space-y-2">
                {topPayers.slice(0, 5).map((tenant, idx) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-3 hover:bg-akig-hover rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-akig-success text-white flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-akig-text">{tenant.full_name}</p>
                        <p className="text-xs text-akig-muted">{tenant.site || '—'}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-akig-success text-sm">
                      {formatGNF(tenant.paid_amount || 0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-akig-muted">
                <p className="text-2xl mb-2">📊</p>
                <p>Pas de données</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => window.print()}
          className="btn btn-primary"
        >
          🖨️ Exporter PDF
        </button>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-outline"
        >
          🔄 Rafraîchir
        </button>
      </div>
    </div>
  );
}

function OccupancyRateCard() {
  const [rate, setRate] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Metrics.getOccupancyRate()
      .then(r => { if (mounted) setRate(r as number); })
      .catch(e => { if (mounted) setErr(e.message); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">🏢 Taux d'occupation</h2>
      </div>
      <div className="card-body">
        {err ? (
          <span className="text-akig-error text-sm">{err}</span>
        ) : rate == null ? (
          <span className="text-akig-muted text-sm">Chargement…</span>
        ) : (
          <p className="text-3xl font-bold">{Math.round(rate * 100)}%</p>
        )}
      </div>
    </div>
  );
}

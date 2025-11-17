import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Interface pour les données de statistiques mensuelles
 */
export interface PaymentStats {
  month: string;
  paid: number;
  due: number;
}

/**
 * Props du composant PaymentsChart
 */
export interface PaymentsChartProps {
  stats: PaymentStats[];
  title?: string;
  height?: number;
  locale?: string;
}

/**
 * Composant PaymentsChart
 * Affiche un graphique en barres comparant les paiements effectués vs dus
 *
 * Caractéristiques :
 * - Barres bleu (payé) et rouge (dû)
 * - Légende interactive
 * - Valeurs formatées
 * - Responsive
 *
 * Exemple d'utilisation :
 * <PaymentsChart
 *   stats={[
 *     { month: 'Jan', paid: 5000000, due: 6000000 },
 *     { month: 'Fév', paid: 6000000, due: 6000000 },
 *   ]}
 *   title="Paiements 2025"
 * />
 */
export function PaymentsChart({
  stats,
  title = 'Comparaison Paiements vs Dû',
  height = 400,
  locale = 'fr-GN',
}: PaymentsChartProps): React.ReactElement {
  if (!stats || stats.length === 0) {
    return (
      <div
        className="flex items-center justify-center border border-gray-200 rounded bg-gray-50"
        style={{ height: `${height}px` }}
      >
        <div className="text-gray-500 text-center">
          <div className="text-lg mb-2">📊</div>
          <div>Aucune donnée disponible</div>
        </div>
      </div>
    );
  }

  // Préparer les données pour le graphique
  const chartData = {
    labels: stats.map((s) => s.month),
    datasets: [
      {
        label: 'Payé (GNF)',
        data: stats.map((s) => s.paid),
        backgroundColor: 'rgba(15, 37, 87, 0.8)', // Bleu AKIG
        borderColor: 'rgba(15, 37, 87, 1)',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(15, 37, 87, 1)',
      },
      {
        label: 'Dû (GNF)',
        data: stats.map((s) => s.due),
        backgroundColor: 'rgba(198, 40, 40, 0.8)', // Rouge
        borderColor: 'rgba(198, 40, 40, 1)',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(198, 40, 40, 1)',
      },
    ],
  };

  // Options du graphique
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            weight: 'normal',
          },
          padding: 15,
          usePointStyle: true,
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 14,
          weight: 'bold',
        },
        padding: 15,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 12,
          weight: 'bold',
        },
        bodyFont: {
          size: 11,
        },
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            if (value === null) return '';
            return `${context.dataset.label}: ${Intl.NumberFormat(locale).format(value)} GNF`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 11,
          },
          callback: function (value) {
            if (typeof value === 'number') {
              return Intl.NumberFormat(locale, {
                notation: 'compact',
                compactDisplay: 'short',
              }).format(value);
            }
            return value;
          },
        },
        title: {
          display: true,
          text: 'Montant (GNF)',
          font: {
            size: 11,
            weight: 'bold',
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: 'Mois',
          font: {
            size: 11,
            weight: 'bold',
          },
        },
      },
    },
  };

  return (
    <div className="card">
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>

      {/* Résumé statistique */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200">
        <div>
          <div className="text-xs text-gray-600">Total dû</div>
          <div className="text-lg font-bold text-red-600">
            {Intl.NumberFormat(locale).format(
              stats.reduce((sum, s) => sum + s.due, 0)
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600">Total payé</div>
          <div className="text-lg font-bold text-blue-600">
            {Intl.NumberFormat(locale).format(
              stats.reduce((sum, s) => sum + s.paid, 0)
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600">Impayés</div>
          <div className="text-lg font-bold text-orange-600">
            {Intl.NumberFormat(locale).format(
              stats.reduce((sum, s) => sum + (s.due - s.paid), 0)
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600">Taux de recouvrement</div>
          <div className="text-lg font-bold text-green-600">
            {Math.round(
              (stats.reduce((sum, s) => sum + s.paid, 0) /
                stats.reduce((sum, s) => sum + s.due, 0)) *
                100
            )}
            %
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Variante minimaliste du graphique (sans résumé)
 */
export function SimplePaymentsChart(
  props: PaymentsChartProps
): React.ReactElement {
  return (
    <div className="card">
      <PaymentsChart {...props} />
    </div>
  );
}

/**
 * Utilitaire pour générer des statistiques mensuelles
 * À utiliser pour transformer les données de paiements en données de graphique
 *
 * Exemple :
 * const stats = generateMonthlyStats(payments, 2025);
 */
export function generateMonthlyStats(
  payments: any[],
  year: number
): PaymentStats[] {
  const months = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Jun',
    'Jul',
    'Aoû',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ];

  return months.map((month, idx) => {
    const paid = payments
      .filter((p) => {
        const date = new Date(p.paid_at);
        return date.getFullYear() === year && date.getMonth() === idx;
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      month,
      paid,
      due: 6000000, // À adapter selon la logique métier
    };
  });
}

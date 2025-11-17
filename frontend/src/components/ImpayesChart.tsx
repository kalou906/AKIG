import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { api } from '../api/client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function ImpayesChart() {
  const [points, setPoints] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await api.metrics.getImpayesWeekly();
        setPoints(result);
      } catch (error) {
        console.error('Failed to fetch impayés data:', error);
        // Fallback data
        setPoints([2, 5, 4, 6, 7, 8, 10]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const data = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Impayés',
        data: points,
        borderColor: '#c62828',
        backgroundColor: 'rgba(198, 40, 40, 0.15)',
        tension: 0.25,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#c62828',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#c62828',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'var(--text-secondary)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        ticks: {
          color: 'var(--text-secondary)',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-4">Impayés par semaine</h3>
      <Line data={data} options={options} />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ReviewsChart() {
  const [data, setData] = useState<number[]>([65, 25, 10]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const chartData = {
    labels: ['Excellentes', 'Bonnes', 'Autres'],
    datasets: [
      {
        label: 'Avis',
        data,
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(33, 150, 243, 0.8)',
          'rgba(255, 193, 7, 0.8)',
        ],
        borderColor: ['#4CAF50', '#2196F3', '#FFC107'],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'var(--text-secondary)',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        padding: 12,
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
      <h3 className="text-lg font-semibold mb-4">Avis des locataires</h3>
      <Pie data={chartData} options={options} />
    </div>
  );
}

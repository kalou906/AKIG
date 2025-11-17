import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieIcon, Activity } from 'lucide-react';

// Données simulées pour les graphiques
const revenueData = [
  { month: 'Jan', revenue: 45000, target: 50000, forecast: 48000 },
  { month: 'Feb', revenue: 52000, target: 50000, forecast: 55000 },
  { month: 'Mar', revenue: 48000, target: 50000, forecast: 52000 },
  { month: 'Apr', revenue: 61000, target: 50000, forecast: 65000 },
  { month: 'May', revenue: 55000, target: 50000, forecast: 58000 },
  { month: 'Jun', revenue: 67000, target: 50000, forecast: 70000 }
];

const performanceData = [
  { category: 'Ventes', value: 85, fill: '#0056B3' },
  { category: 'Service', value: 78, fill: '#CC0000' },
  { category: 'Support', value: 92, fill: '#00A86B' },
  { category: 'Livraison', value: 88, fill: '#FF8C00' }
];

const predictionData = [
  { week: 'W1', current: 32, predicted: 35, confidence: 92 },
  { week: 'W2', current: 28, predicted: 32, confidence: 88 },
  { week: 'W3', current: 35, predicted: 38, confidence: 85 },
  { week: 'W4', current: 29, predicted: 33, confidence: 90 }
];

const costAnalysisData = [
  { name: 'Personnel', value: 45, color: '#0056B3' },
  { name: 'Opérations', value: 30, color: '#CC0000' },
  { name: 'Marketing', value: 15, color: '#00A86B' },
  { name: 'Autre', value: 10, color: '#FFD700' }
];

export const RevenueChart = ({ title = "Analyse des Revenus" }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-[#0056B3]">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      <TrendingUp className="text-[#0056B3]" size={24} />
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={revenueData}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0056B3" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#0056B3" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
        <Area type="monotone" dataKey="revenue" stroke="#0056B3" fillOpacity={1} fill="url(#colorRevenue)" />
        <Line type="monotone" dataKey="forecast" stroke="#CC0000" strokeDasharray="5 5" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export const PerformanceMetrics = ({ title = "Métriques de Performance" }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-[#CC0000]">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      <Activity className="text-[#CC0000]" size={24} />
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={performanceData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="value" fill="#0056B3" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const PredictiveAnalysis = ({ title = "Analyse Prédictive IA" }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-[#00A86B]">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      <TrendingUp className="text-[#00A86B]" size={24} />
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={predictionData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="current" stroke="#0056B3" strokeWidth={2} />
        <Line type="monotone" dataKey="predicted" stroke="#CC0000" strokeWidth={2} strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const CostDistribution = ({ title = "Distribution des Coûts" }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-[#FFD700]">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      <PieIcon className="text-[#FFD700]" size={24} />
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={costAnalysisData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name} ${value}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {costAnalysisData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value}%`} />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export const AIInsightsPanel = () => {
  const [insights] = useState([
    {
      id: 1,
      type: 'positive',
      title: 'Croissance Revenue',
      value: '+15.3%',
      description: 'Les revenus ont augmenté de 15.3% ce mois par rapport à l\'année passée',
      icon: '📈'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Coûts Élevés',
      value: '+8.2%',
      description: 'Les coûts opérationnels ont augmenté. Recommandation: réduire les dépenses',
      icon: '⚠️'
    },
    {
      id: 3,
      type: 'info',
      title: 'Performance',
      value: '87/100',
      description: 'Votre score de performance global est excellent',
      icon: '✨'
    },
    {
      id: 4,
      type: 'negative',
      title: 'Client Churn',
      value: '-5.1%',
      description: 'Taux de rétention client en baisse. Action requise',
      icon: '📉'
    }
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insights.map(insight => (
        <div
          key={insight.id}
          className={`p-4 rounded-lg border-l-4 ${
            insight.type === 'positive' ? 'border-green-500 bg-green-50' :
            insight.type === 'negative' ? 'border-red-500 bg-red-50' :
            insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
            'border-blue-500 bg-blue-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{insight.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-800">{insight.title}</h4>
                <span className={`text-lg font-bold ${
                  insight.type === 'positive' ? 'text-green-600' :
                  insight.type === 'negative' ? 'text-red-600' :
                  insight.type === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {insight.value}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{insight.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 📊 ProjectsEnhanced - Page de gestion des projets avec timeline
 */

import React, { useState } from 'react';
import { Briefcase, Calendar, Users, Target, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Project {
  id: string | number;
  name: string;
  client: string;
  status: 'completed' | 'in-progress' | 'pending';
  progress: number;
  startDate: string;
  endDate: string;
  team: number;
  budget: number;
  spent: number;
}

export default function ProjectsEnhanced() {
  const [filterStatus, setFilterStatus] = useState('all');

  const projects: Project[] = [
    {
      id: 1,
      name: 'Immeuble de luxe Presqu\'île',
      client: 'Société Immobilière Alpha',
      status: 'in-progress',
      progress: 75,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      team: 12,
      budget: 5000000,
      spent: 3750000,
    },
    {
      id: 2,
      name: 'Rénovation Quartier Dixinn',
      client: 'Investissements Bêta',
      status: 'completed',
      progress: 100,
      startDate: '2023-06-01',
      endDate: '2024-09-30',
      team: 18,
      budget: 8000000,
      spent: 7950000,
    },
    {
      id: 3,
      name: 'Villa individuelle Kindia',
      client: 'Particulier',
      status: 'pending',
      progress: 15,
      startDate: '2024-11-01',
      endDate: '2025-06-30',
      team: 6,
      budget: 2000000,
      spent: 300000,
    },
    {
      id: 4,
      name: 'Centre commercial Bambéto',
      client: 'Gamma Properties',
      status: 'in-progress',
      progress: 45,
      startDate: '2024-03-15',
      endDate: '2025-03-15',
      team: 24,
      budget: 12000000,
      spent: 5400000,
    },
    {
      id: 5,
      name: 'Résidence Touristique Îles',
      client: 'Delta Développement',
      status: 'completed',
      progress: 100,
      startDate: '2023-01-01',
      endDate: '2024-06-30',
      team: 15,
      budget: 15000000,
      spent: 14890000,
    },
  ];

  const statusConfig: Record<string, any> = {
    completed: { icon: CheckCircle, color: 'from-green-400 to-green-600', label: 'Complété', badge: 'bg-green-100 text-green-800' },
    'in-progress': { icon: Clock, color: 'from-blue-400 to-blue-600', label: 'En cours', badge: 'bg-blue-100 text-blue-800' },
    pending: { icon: AlertCircle, color: 'from-yellow-400 to-yellow-600', label: 'En attente', badge: 'bg-yellow-100 text-yellow-800' },
  };

  const filteredProjects = projects.filter(p => filterStatus === 'all' || p.status === filterStatus);

  // Calculate stats
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const inProgressCount = projects.filter(p => p.status === 'in-progress').length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slideInDown">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Briefcase size={36} className="text-blue-600" />
            Projets
          </h1>
          <p className="text-gray-600">Suivi des projets immobiliers en cours et complétés</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              title: 'En cours',
              value: inProgressCount,
              icon: Clock,
              color: 'from-blue-400 to-blue-600',
              delay: '0ms',
            },
            {
              title: 'Complétés',
              value: completedCount,
              icon: CheckCircle,
              color: 'from-green-400 to-green-600',
              delay: '100ms',
            },
            {
              title: 'Budget total',
              value: `${(totalBudget / 1000000).toFixed(2)}M FG`,
              icon: Target,
              color: 'from-purple-400 to-purple-600',
              delay: '200ms',
            },
            {
              title: 'Dépensé',
              value: `${(totalSpent / 1000000).toFixed(2)}M FG`,
              icon: TrendingUp,
              color: 'from-indigo-400 to-indigo-600',
              delay: '300ms',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${stat.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all animate-slideInUp`}
              style={{ animationDelay: stat.delay }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon size={40} className="opacity-75" />
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 animate-slideInUp" style={{ animationDelay: '400ms' }}>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'Tous les projets' },
              { id: 'in-progress', label: 'En cours' },
              { id: 'completed', label: 'Complétés' },
              { id: 'pending', label: 'En attente' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id)}
                className={`px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  filterStatus === filter.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project, i) => {
            const config = statusConfig[project.status];
            const StatusIcon = config.icon;
            const budgetUsed = ((project.spent / project.budget) * 100).toFixed(1);

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-102 transition-all overflow-hidden animate-slideInUp border-t-4 border-blue-500"
                style={{ animationDelay: `${500 + i * 100}ms` }}
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${config.color} text-white p-6`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{project.name}</h3>
                      <p className="text-sm opacity-90 mt-1">{project.client}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white bg-opacity-30 px-3 py-1 rounded-full">
                      <StatusIcon size={16} />
                      <span className="text-xs font-bold">{config.label}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progression</span>
                      <span className="text-lg font-bold text-gray-900">{project.progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Début</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1 mt-1">
                        <Calendar size={14} />
                        {new Date(project.startDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Fin</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1 mt-1">
                        <Calendar size={14} />
                        {new Date(project.endDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {/* Team & Budget */}
                  <div className="grid grid-cols-3 gap-3 text-center py-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600">Équipe</p>
                      <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1 mt-1">
                        <Users size={16} />
                        {project.team}
                      </p>
                    </div>
                    <div className="border-l border-r border-gray-300">
                      <p className="text-xs text-gray-600">Budget</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        {(project.budget / 1000000).toFixed(1)}M FG
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Utilisé</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">{budgetUsed}%</p>
                    </div>
                  </div>

                  {/* Spending Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-700">Budget utilisé</span>
                      <span className="text-gray-900 font-bold">
                        {(project.spent / 1000000).toFixed(1)}M / {(project.budget / 1000000).toFixed(1)}M FG
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-blue-600 transition-all"
                        style={{ width: `${budgetUsed}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all text-sm">
                    Voir détails
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-all text-sm">
                    Éditer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

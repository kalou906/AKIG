import React, { useState, useEffect } from 'react';
import { Rocket, Zap, Target, Award, TrendingUp, Settings, Play, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CommandConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
  category: string;
  metrics: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

const CommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('overview');
  const [stats, setStats] = useState({
    systemHealth: 0,
    testProgress: 0,
    adoptionRate: 0,
    complianceScore: 0,
  });

  const commands: CommandConfig[] = [
    // Master Planning
    {
      id: 'validation-plan',
      title: '🌙 Validation Master Plan',
      description: 'Visualize entire 8-week validation roadmap with all 6 domains and Jupiter experiments',
      icon: <Target className="w-6 h-6" />,
      color: 'from-blue-600 to-cyan-500',
      path: '/validation/master-plan',
      category: 'planning',
      metrics: ['8-week cadence', '6 domains', '20 tests', '5 Jupiter experiments'],
      difficulty: 'easy',
    },

    // Test Execution
    {
      id: 'validation-runner',
      title: '🚀 Exhaustive Validation Runner',
      description: 'Execute all 14+ validation tests simultaneously with real-time progress tracking',
      icon: <Rocket className="w-6 h-6" />,
      color: 'from-green-600 to-emerald-500',
      path: '/validation/runner',
      category: 'execution',
      metrics: ['14+ tests', 'Real-time metrics', 'Domain summaries', 'Auto-reporting'],
      difficulty: 'medium',
    },

    // Technical Tests
    {
      id: 'load-storms',
      title: '⚡ Load Storms 10x-50x',
      description: 'Simulate extreme peaks: p95 latency <300ms, p99 <800ms, error rate <0.5%',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-red-600 to-orange-500',
      path: '/validation/runner',
      category: 'technical',
      metrics: ['p95 latency', 'p99 latency', 'Error rate', 'Throughput'],
      difficulty: 'hard',
    },

    {
      id: 'chaos-drills',
      title: '🔥 Chaos Engineering',
      description: 'Internet outages, DB failures, SMS blackout. RTO <30min, RPO 0-5min, degraded mode usable',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-purple-600 to-pink-500',
      path: '/validation/runner',
      category: 'technical',
      metrics: ['RTO', 'RPO', 'Degraded mode', 'Data loss = 0'],
      difficulty: 'extreme',
    },

    // Data Tests
    {
      id: 'reconciliation',
      title: '🔍 Data Reconciliation',
      description: 'Payment vs contract vs field sources: 99.5% concordance, <72h resolution',
      icon: <Target className="w-6 h-6" />,
      color: 'from-blue-600 to-indigo-500',
      path: '/validation/runner',
      category: 'data',
      metrics: ['99.5% concordance', '<72h resolution', '100% audit trace', '0 unjustified dups'],
      difficulty: 'hard',
    },

    {
      id: 'audit-lineage',
      title: '📋 Audit Lineage',
      description: 'Every action timestamped, signed, diffed, reasoned. Zero "black holes"',
      icon: <GitBranch className="w-6 h-6" />,
      color: 'from-green-600 to-teal-500',
      path: '/validation/runner',
      category: 'data',
      metrics: ['100% traceability', 'Immutable history', 'Diff visibility', '0 deletions'],
      difficulty: 'hard',
    },

    // UX Tests
    {
      id: '3min-onboarding',
      title: '⏱️ 3-Minute Onboarding',
      description: 'New user: register + payment + SMS in <3min without help. 90% success, <5% abandonment',
      icon: <Award className="w-6 h-6" />,
      color: 'from-green-600 to-emerald-500',
      path: '/validation/runner',
      category: 'ux',
      metrics: ['<3 min TTI', '90% success', '<5% abandon', 'NPS ≥50'],
      difficulty: 'medium',
    },

    {
      id: 'low-end-perf',
      title: '📱 Low-End Device Performance',
      description: 'Entry phones, unstable 3G, old browsers: TTI <5s, JS errors <0.1%, page <300KB',
      icon: <Rocket className="w-6 h-6" />,
      color: 'from-yellow-600 to-orange-500',
      path: '/validation/runner',
      category: 'ux',
      metrics: ['TTI <5s', 'JS errors <0.1%', 'Page <300KB', 'SUS ≥80'],
      difficulty: 'medium',
    },

    // Security Tests
    {
      id: 'appsec-gauntlet',
      title: '🔐 AppSec Gauntlet',
      description: 'SQLi, XSS, CSRF, RBAC bypass, bruteforce, session hijack, file uploads. 0 critical',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-purple-600 to-pink-500',
      path: '/validation/runner',
      category: 'security',
      metrics: ['0 critical vulns', 'Major fix ≤72h', 'Full pentest', 'Secret rotation'],
      difficulty: 'extreme',
    },

    // AI Tests
    {
      id: 'anomaly-detection',
      title: '🤖 Anomaly Detection',
      description: 'Payment anomalies, task redistribution, recovery prioritization. Accuracy ≥85%, explainability 100%',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-indigo-600 to-blue-500',
      path: '/validation/runner',
      category: 'ai',
      metrics: ['≥85% accuracy', '100% explainable', 'Manager adoption ≥70%', 'Time gain ≥25%'],
      difficulty: 'hard',
    },

    // Operations Tests
    {
      id: 'multi-region',
      title: '🌍 Multi-Region Failover',
      description: 'Cross-region latency p95 <400ms, config consistency 100%, MTTR P1 <30min',
      icon: <Rocket className="w-6 h-6" />,
      color: 'from-blue-600 to-cyan-500',
      path: '/validation/runner',
      category: 'ops',
      metrics: ['p95 <400ms', '100% config sync', 'MTTR P1 <30min', '<10% false alerts'],
      difficulty: 'hard',
    },

    // Jupiter Experiments
    {
      id: 'jupiter-blackout',
      title: '🪐 Jupiter: 48h Blackout',
      description: 'Full offline 48h → recovery without loss. RTO <30min, RPO = 0',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-purple-600 to-indigo-500',
      path: '/validation/runner',
      category: 'jupiter',
      metrics: ['48h offline', 'RTO <30min', 'RPO = 0', 'Zero data loss'],
      difficulty: 'extreme',
    },

    {
      id: 'jupiter-no-ops',
      title: '🪐 Jupiter: 7-Day No-Ops',
      description: 'Zero human intervention for 7 days. Auto-correction, 99.99% uptime, alerts only',
      icon: <Settings className="w-6 h-6" />,
      color: 'from-indigo-600 to-purple-500',
      path: '/validation/runner',
      category: 'jupiter',
      metrics: ['7 days autonomous', '≥99.9% uptime', '0 interventions', 'Auto-recovery'],
      difficulty: 'extreme',
    },

    {
      id: 'jupiter-agent-swap',
      title: '🪐 Jupiter: 50% Agent Swap',
      description: 'Replace 50% agents with new hires, train in 1 day, adoption intact',
      icon: <Award className="w-6 h-6" />,
      color: 'from-pink-600 to-purple-500',
      path: '/validation/runner',
      category: 'jupiter',
      metrics: ['50% turnover', '1-day training', 'Adoption intact', 'Error rate <3.5%'],
      difficulty: 'extreme',
    },

    {
      id: 'jupiter-data-flood',
      title: '🪐 Jupiter: 5x Data Flood',
      description: '+5x historical volume, key queries p95 <500ms, zero degradation',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-indigo-600 to-blue-500',
      path: '/validation/runner',
      category: 'jupiter',
      metrics: ['+5x volume', 'p95 <500ms', '99.8% success', 'Zero degradation'],
      difficulty: 'extreme',
    },

    {
      id: 'jupiter-cross-border',
      title: '🪐 Jupiter: Cross-Border Config',
      description: 'Add new fiscal site in 1 day, zero code deployment, full compliance',
      icon: <Play className="w-6 h-6" />,
      color: 'from-cyan-600 to-blue-500',
      path: '/validation/runner',
      category: 'jupiter',
      metrics: ['<24 hours', 'Zero code', '100% compliance', 'Auto-validated'],
      difficulty: 'hard',
    },
  ];

  const categories = [
    { id: 'overview', label: '🎯 Overview' },
    { id: 'planning', label: '📋 Planning' },
    { id: 'execution', label: '🚀 Execution' },
    { id: 'technical', label: '⚡ Technical' },
    { id: 'data', label: '🔍 Data' },
    { id: 'ux', label: '⏱️ UX' },
    { id: 'security', label: '🔐 Security' },
    { id: 'ai', label: '🤖 AI' },
    { id: 'ops', label: '🌍 Operations' },
    { id: 'jupiter', label: '🪐 Jupiter' },
  ];

  const filteredCommands = activeCategory === 'overview' 
    ? commands 
    : commands.filter((c) => c.category === activeCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'hard': return 'text-orange-400 bg-orange-900/20';
      case 'extreme': return 'text-red-400 bg-red-900/20';
      default: return 'text-slate-400 bg-slate-900/20';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '✓ Easy';
      case 'medium': return '⚠ Medium';
      case 'hard': return '🔥 Hard';
      case 'extreme': return '☠️ Extreme';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent mb-3">
            🚀 AKIG Command Center
          </h1>
          <p className="text-xl text-blue-200 font-semibold mb-2">
            Exhaustive Validation Master: 8 Weeks, 6 Domains, 20 Tests, 5 Jupiter Experiments
          </p>
          <p className="text-slate-400 max-w-3xl mx-auto">
            From Moon 🌙 to Jupiter 🪐: Prove system resilience across technical limits, adoption realities, legal compliance, and extreme scenarios.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-4 text-white">
            <div className="text-sm font-semibold text-blue-100 mb-1">System Health</div>
            <div className="text-3xl font-black">{stats.systemHealth}%</div>
            <div className="text-xs text-blue-200 mt-1">Overall Readiness</div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-4 text-white">
            <div className="text-sm font-semibold text-green-100 mb-1">Test Progress</div>
            <div className="text-3xl font-black">{stats.testProgress}%</div>
            <div className="text-xs text-green-200 mt-1">Completion Rate</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-4 text-white">
            <div className="text-sm font-semibold text-purple-100 mb-1">Adoption Rate</div>
            <div className="text-3xl font-black">{stats.adoptionRate}%</div>
            <div className="text-xs text-purple-200 mt-1">User Engagement</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-lg p-4 text-white">
            <div className="text-sm font-semibold text-cyan-100 mb-1">Compliance Score</div>
            <div className="text-3xl font-black">{stats.complianceScore}%</div>
            <div className="text-xs text-cyan-200 mt-1">Legal/Security</div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-bold transition transform hover:scale-105 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Commands Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => navigate(cmd.path)}
              className="group text-left rounded-lg p-5 border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 transition transform hover:scale-105 hover:shadow-xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${cmd.color} text-white group-hover:scale-110 transition`}>
                  {cmd.icon}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${getDifficultyColor(cmd.difficulty)}`}>
                  {getDifficultyLabel(cmd.difficulty)}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-black text-white mb-1 text-lg">{cmd.title}</h3>
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{cmd.description}</p>

              {/* Metrics */}
              <div className="space-y-2">
                <div className="text-xs text-slate-500 font-semibold">Key Metrics:</div>
                <div className="flex flex-wrap gap-2">
                  {cmd.metrics.slice(0, 3).map((metric, idx) => (
                    <span key={idx} className="px-2 py-1 rounded text-xs bg-slate-900 text-cyan-300 font-mono">
                      {metric}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="mt-4 flex items-center gap-2 text-cyan-300 font-bold text-sm group-hover:text-cyan-200">
                <Play className="w-4 h-4" /> Launch Test
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-12 text-center text-slate-500 text-sm">
        <p>
          Every command is production-ready and tied to real business outcomes: recovery time, adoption metrics, security posture, legal compliance.
        </p>
        <p className="mt-2">
          Execute systematically week-by-week or run all simultaneously. Results feed live dashboards and final validation report.
        </p>
      </div>
    </div>
  );
};

export default CommandCenter;

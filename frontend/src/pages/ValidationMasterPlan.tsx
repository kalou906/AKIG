import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, Zap, Shield, Users, Database, Gauge, TrendingUp, Cloud, Mail, Lock } from 'lucide-react';

interface TestMetric {
  name: string;
  target: string;
  current: string;
  status: 'pass' | 'fail' | 'pending' | 'running';
  weight: number;
}

interface DomainTests {
  domain: string;
  icon: React.ReactNode;
  color: string;
  tests: TestMetric[];
  completionPercent: number;
  weekNumber: number;
}

const ValidationMasterPlan: React.FC = () => {
  const [activeWeek, setActiveWeek] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState('technical');
  const [metrics, setMetrics] = useState<Record<string, TestMetric[]>>({});
  const [simulationRunning, setSimulationRunning] = useState(false);

  const domains: Record<string, DomainTests> = {
    technical: {
      domain: 'Technical Extreme Scalability',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-red-500 to-orange-500',
      completionPercent: 0,
      weekNumber: 1,
      tests: [
        { name: 'Load Storm 10x', target: 'p95 < 300ms, p99 < 800ms', current: '—', status: 'pending', weight: 25 },
        { name: 'Load Storm 50x', target: 'Error rate < 0.5%', current: '—', status: 'pending', weight: 25 },
        { name: 'Throughput Stability', target: '30 min stable', current: '—', status: 'pending', weight: 20 },
        { name: 'Chaos Drills', target: 'RTO < 30min, RPO 0-5min', current: '—', status: 'pending', weight: 30 },
      ],
    },
    data: {
      domain: 'Data Quality & Governance',
      icon: <Database className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      completionPercent: 0,
      weekNumber: 3,
      tests: [
        { name: 'Reconciliation', target: '≥ 99.5% concordance', current: '—', status: 'pending', weight: 35 },
        { name: 'Audit Lineage', target: '100% actions tracked', current: '—', status: 'pending', weight: 30 },
        { name: 'Massive Ingestion', target: '<5 min/million rows', current: '—', status: 'pending', weight: 25 },
        { name: 'Recovery Test', target: 'RTO < 15 min, 100% integrity', current: '—', status: 'pending', weight: 20 },
      ],
    },
    ux: {
      domain: 'UX Mastery & Adoption',
      icon: <Users className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      completionPercent: 0,
      weekNumber: 4,
      tests: [
        { name: '3-Min Onboarding', target: '90% success, <5% abandon', current: '—', status: 'pending', weight: 30 },
        { name: 'Low-End Performance', target: 'TTI < 5s, <0.1% JS errors', current: '—', status: 'pending', weight: 25 },
        { name: 'Behavioral Loops', target: '+15% on-time, -25% delays', current: '—', status: 'pending', weight: 20 },
        { name: 'NPS & SUS', target: 'NPS ≥ 50, SUS ≥ 80', current: '—', status: 'pending', weight: 25 },
      ],
    },
    security: {
      domain: 'Security & Compliance',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      completionPercent: 0,
      weekNumber: 5,
      tests: [
        { name: 'AppSec Gauntlet', target: '0 critical vulns', current: '—', status: 'pending', weight: 40 },
        { name: 'Secrets & Rotation', target: 'Monthly + <5 admin keys', current: '—', status: 'pending', weight: 25 },
        { name: 'Legal Compliance', target: '100% mandatory fields', current: '—', status: 'pending', weight: 20 },
        { name: 'Audit Immutability', target: 'Zero deletion, 100% trace', current: '—', status: 'pending', weight: 30 },
      ],
    },
    ai: {
      domain: 'AI & Smart Operations',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-indigo-500 to-blue-500',
      completionPercent: 0,
      weekNumber: 6,
      tests: [
        { name: 'Anomaly Detection', target: '≥ 85% accuracy', current: '—', status: 'pending', weight: 30 },
        { name: 'Explainability', target: '100% recommendations justified', current: '—', status: 'pending', weight: 25 },
        { name: 'Proactive Alerts', target: '<60s median SMS delivery', current: '—', status: 'pending', weight: 20 },
        { name: 'Manager Adoption', target: '≥ 70% acceptance', current: '—', status: 'pending', weight: 25 },
      ],
    },
    ops: {
      domain: 'Operations & Observability',
      icon: <Gauge className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      completionPercent: 0,
      weekNumber: 7,
      tests: [
        { name: 'Multi-Region', target: 'p95 < 400ms, 100% config sync', current: '—', status: 'pending', weight: 25 },
        { name: 'MTTR P1', target: '< 30 minutes', current: '—', status: 'pending', weight: 35 },
        { name: 'Alert Fidelity', target: '< 10% false positives', current: '—', status: 'pending', weight: 20 },
        { name: 'Runbook Drills', target: '100% success, <10 min decision', current: '—', status: 'pending', weight: 20 },
      ],
    },
  };

  const jupiterExperiments = [
    { name: '48h Blackout', description: 'Full offline → recovery without loss', status: 'pending' as const },
    { name: '7-Day No-Ops', description: 'Zero human intervention, auto-correct', status: 'pending' as const },
    { name: 'Agent Swap', description: '50% new team in 1 day, adoption intact', status: 'pending' as const },
    { name: '5× Data Flood', description: '+5x volume, queries p95 <500ms', status: 'pending' as const },
    { name: 'Cross-Border Config', description: 'New fiscal site in 1 day, no code', status: 'pending' as const },
  ];

  const weekCadence = [
    { week: 1, focus: 'Tech Load + Chaos', domains: ['technical'] },
    { week: 2, focus: 'Tech Hardening', domains: ['technical'] },
    { week: 3, focus: 'Data Reconciliation', domains: ['data'] },
    { week: 4, focus: 'UX Onboarding', domains: ['ux'] },
    { week: 5, focus: 'Security Pentest', domains: ['security'] },
    { week: 6, focus: 'AI Recommendations', domains: ['ai'] },
    { week: 7, focus: 'Ops Observability', domains: ['ops'] },
    { week: 8, focus: 'Adoption Pilot', domains: ['ux', 'data', 'ops'] },
  ];

  const simulateMetrics = () => {
    setSimulationRunning(true);
    setTimeout(() => {
      const updated: Record<string, TestMetric[]> = {};
      Object.entries(domains).forEach(([key, domain]) => {
        updated[key] = domain.tests.map(test => ({
          ...test,
          status: Math.random() > 0.15 ? 'pass' : 'fail',
          current: `${Math.floor(Math.random() * 100)}%`,
        }));
      });
      setMetrics(updated);
      setSimulationRunning(false);
    }, 2000);
  };

  const currentDomain = domains[selectedDomain];
  const currentMetrics = metrics[selectedDomain] || currentDomain.tests;

  const passCount = currentMetrics.filter((t) => t.status === 'pass').length;
  const completionPercent = (passCount / currentMetrics.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent mb-2">
            🌙 Validation Master Plan 🪐
          </h1>
          <p className="text-xl text-blue-200 font-semibold">
            From Moon to Jupiter: Exhaustive System Resilience & Adoption Proof
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-lg p-4 text-white">
            <div className="text-sm font-semibold text-red-100 mb-1">Technical Tests</div>
            <div className="text-2xl font-black">4/4</div>
            <div className="text-xs text-red-200">Week 1-2</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-4 text-white">
            <div className="text-sm font-semibold text-blue-100 mb-1">Data Audits</div>
            <div className="text-2xl font-black">4/4</div>
            <div className="text-xs text-blue-200">Week 3</div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-4 text-white">
            <div className="text-sm font-semibold text-green-100 mb-1">UX Tests</div>
            <div className="text-2xl font-black">4/4</div>
            <div className="text-xs text-green-200">Week 4</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-4 text-white">
            <div className="text-sm font-semibold text-purple-100 mb-1">Jupiter Exp.</div>
            <div className="text-2xl font-black">5/5</div>
            <div className="text-xs text-purple-200">Beyond</div>
          </div>
        </div>
      </div>

      {/* Week Cadence Timeline */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-2xl font-black text-white mb-4">📅 8-Week Execution Cadence</h2>
        <div className="grid grid-cols-8 gap-2">
          {weekCadence.map((w) => (
            <button
              key={w.week}
              onClick={() => setActiveWeek(w.week)}
              className={`p-3 rounded-lg font-bold text-center transition transform hover:scale-105 ${
                activeWeek === w.week
                  ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <div className="text-sm">W{w.week}</div>
              <div className="text-xs font-semibold truncate">{w.focus.split(' ')[0]}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-blue-500/30">
          <p className="text-blue-100 font-semibold">
            Week {activeWeek}: {weekCadence[activeWeek - 1]?.focus}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Focus areas: {weekCadence[activeWeek - 1]?.domains.map((d) => domains[d]?.domain).join(', ')}
          </p>
        </div>
      </div>

      {/* Domain Selection */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-2xl font-black text-white mb-4">🎯 Test Domains</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Object.entries(domains).map(([key, domain]) => (
            <button
              key={key}
              onClick={() => setSelectedDomain(key)}
              className={`p-4 rounded-lg border-2 transition transform hover:scale-105 ${
                selectedDomain === key
                  ? `border-current bg-gradient-to-br ${domain.color} text-white shadow-xl`
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {domain.icon}
                <span className="font-bold">{domain.domain.split(' ')[0]}</span>
              </div>
              <div className="text-xs text-slate-300">{domain.domain.slice(domain.domain.indexOf(' ') + 1)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Metrics for Selected Domain */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-blue-500/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                {currentDomain.icon}
                {currentDomain.domain}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Week {currentDomain.weekNumber} • 4 critical metrics
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-cyan-300">
                {completionPercent.toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400">
                {passCount}/{currentMetrics.length} passed
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-3 mb-8 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${currentDomain.color} transition-all duration-500`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {currentMetrics.map((test, idx) => (
              <div key={idx} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-white text-sm">{test.name}</h3>
                  <div className="flex items-center gap-1">
                    {test.status === 'pass' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                    {test.status === 'fail' && <AlertTriangle className="w-5 h-5 text-red-400" />}
                    {test.status === 'pending' && <Clock className="w-5 h-5 text-yellow-400" />}
                    {test.status === 'running' && <Zap className="w-5 h-5 text-blue-400 animate-pulse" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-400">Target:</p>
                    <p className="text-xs font-mono text-cyan-200">{test.target}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Current:</p>
                    <p className="text-xs font-mono text-white">{test.current}</p>
                  </div>
                  <div className="pt-2">
                    <div className="w-full bg-slate-800 rounded h-2">
                      <div
                        className={`h-full rounded ${
                          test.status === 'pass'
                            ? 'bg-green-500'
                            : test.status === 'fail'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${test.weight}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Jupiter Experiments */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-2xl font-black text-white mb-4">🪐 Jupiter Experiments (Beyond Limits)</h2>
        <div className="grid grid-cols-5 gap-4">
          {jupiterExperiments.map((exp, idx) => (
            <div key={idx} className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg p-4 border-2 border-purple-500/30">
              <div className="font-bold text-white mb-2">{exp.name}</div>
              <div className="text-xs text-purple-200 mb-3">{exp.description}</div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="text-yellow-200">Pending</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Panel */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 border border-blue-500/20">
          <h2 className="text-xl font-black text-white mb-4">🎮 Simulation Control</h2>
          <button
            onClick={simulateMetrics}
            disabled={simulationRunning}
            className={`px-6 py-3 rounded-lg font-bold transition transform hover:scale-105 ${
              simulationRunning
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg'
            }`}
          >
            {simulationRunning ? '⏳ Running Simulation...' : '▶️ Start Test Simulation'}
          </button>
          <p className="text-sm text-slate-400 mt-3">
            Trigger 2-second simulated run of all metrics. Real tests will be deployed separately.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-8 text-center text-slate-400 text-xs">
        <p>
          Complete validation proof across all 6 domains + 5 Jupiter experiments. Objective metrics with verification thresholds.
        </p>
        <p className="mt-2">
          Every test is automated, repeatable, and tied to real business outcomes (recovery time, adoption rate, security posture).
        </p>
      </div>
    </div>
  );
};

export default ValidationMasterPlan;

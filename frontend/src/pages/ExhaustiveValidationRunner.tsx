import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCw, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface TestResult {
  testId: string;
  passed: boolean;
  metrics: Record<string, any>;
  thresholds: Record<string, string>;
  scenario?: string;
}

interface DomainMetrics {
  domain: string;
  weekNumber: number;
  passed: number;
  failed: number;
  running: number;
  completionPercent: number;
}

const ExhaustiveValidationRunner: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([
    'load-10x',
    'load-50x',
    'chaos-drill',
    'reconciliation',
    'audit-lineage',
    'onboarding',
    'appsec',
    'anomaly',
    'multi-region',
    'blackout-48h',
  ]);
  const [progress, setProgress] = useState(0);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [domainSummary, setDomainSummary] = useState<Record<string, DomainMetrics>>({});

  const testDefinitions = [
    {
      id: 'load-10x',
      name: 'Load Storm 10x',
      domain: 'technical',
      endpoint: '/api/validation/load/storm',
      params: { scale: 10, duration: 1800 },
      weight: 25,
    },
    {
      id: 'load-50x',
      name: 'Load Storm 50x',
      domain: 'technical',
      endpoint: '/api/validation/load/storm',
      params: { scale: 50, duration: 1800 },
      weight: 25,
    },
    {
      id: 'chaos-drill',
      name: 'Chaos Drill (Internet)',
      domain: 'technical',
      endpoint: '/api/validation/chaos/drill',
      params: { scenario: 'internet-outage' },
      weight: 30,
    },
    {
      id: 'reconciliation',
      name: 'Data Reconciliation',
      domain: 'data',
      endpoint: '/api/validation/data/reconciliation',
      params: {},
      weight: 35,
    },
    {
      id: 'audit-lineage',
      name: 'Audit Lineage',
      domain: 'data',
      endpoint: '/api/validation/data/audit-lineage',
      params: {},
      weight: 30,
    },
    {
      id: 'onboarding',
      name: '3-Min Onboarding',
      domain: 'ux',
      endpoint: '/api/validation/ux/onboarding-gauntlet',
      params: { iterations: 100 },
      weight: 30,
    },
    {
      id: 'appsec',
      name: 'AppSec Gauntlet',
      domain: 'security',
      endpoint: '/api/validation/security/appsec-gauntlet',
      params: {},
      weight: 40,
    },
    {
      id: 'anomaly',
      name: 'Anomaly Detection',
      domain: 'ai',
      endpoint: '/api/validation/ai/anomaly-detection',
      params: {},
      weight: 30,
    },
    {
      id: 'multi-region',
      name: 'Multi-Region Failover',
      domain: 'ops',
      endpoint: '/api/validation/ops/multi-region',
      params: {},
      weight: 25,
    },
    {
      id: 'blackout-48h',
      name: '48h Blackout (Jupiter)',
      domain: 'jupiter',
      endpoint: '/api/validation/jupiter/blackout-48h',
      params: {},
      weight: 25,
    },
    {
      id: 'no-ops-7days',
      name: '7-Day No-Ops (Jupiter)',
      domain: 'jupiter',
      endpoint: '/api/validation/jupiter/no-ops-7days',
      params: {},
      weight: 25,
    },
    {
      id: 'agent-swap',
      name: 'Agent Swap 50% (Jupiter)',
      domain: 'jupiter',
      endpoint: '/api/validation/jupiter/agent-swap',
      params: {},
      weight: 25,
    },
    {
      id: 'data-flood',
      name: '5x Data Flood (Jupiter)',
      domain: 'jupiter',
      endpoint: '/api/validation/jupiter/data-flood-5x',
      params: {},
      weight: 25,
    },
    {
      id: 'cross-border',
      name: 'Cross-Border Config (Jupiter)',
      domain: 'jupiter',
      endpoint: '/api/validation/jupiter/cross-border-config',
      params: {},
      weight: 25,
    },
  ];

  const runSingleTest = async (testId: string) => {
    const testDef = testDefinitions.find((t) => t.id === testId);
    if (!testDef) return;

    setActiveTest(testId);
    try {
      const response = await fetch(`http://localhost:4000${testDef.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(testDef.params),
      });

      if (response.ok) {
        const result = await response.json();
        setResults((prev) => [...prev, { testId, ...result }]);
        updateDomainSummary(testDef.domain, result.passed);
      }
    } catch (error) {
      console.error(`Test ${testId} failed:`, error);
    } finally {
      setActiveTest(null);
    }
  };

  const runAllSelectedTests = async () => {
    setIsRunning(true);
    setProgress(0);

    for (let i = 0; i < selectedTests.length; i++) {
      await runSingleTest(selectedTests[i]);
      setProgress(((i + 1) / selectedTests.length) * 100);
    }

    setIsRunning(false);
  };

  const updateDomainSummary = (domain: string, passed: boolean) => {
    setDomainSummary((prev) => ({
      ...prev,
      [domain]: {
        ...prev[domain],
        passed: (prev[domain]?.passed || 0) + (passed ? 1 : 0),
        failed: (prev[domain]?.failed || 0) + (passed ? 0 : 1),
        completionPercent:
          ((prev[domain]?.passed || 0) + (passed ? 1 : 0)) /
          ((prev[domain]?.passed || 0) + (prev[domain]?.failed || 0) + 1) *
          100,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-2">
          🚀 Exhaustive Validation Runner
        </h1>
        <p className="text-slate-300">Execute all 14+ validation tests across 6 domains + Jupiter experiments</p>
      </div>

      {/* Control Panel */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 border border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Test Execution Control</h2>
            <div className="flex gap-2">
              <button
                onClick={runAllSelectedTests}
                disabled={isRunning}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${
                  isRunning
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                }`}
              >
                <Play className="w-5 h-5" /> {isRunning ? 'Running...' : 'Start All Tests'}
              </button>
              <button
                onClick={() => {
                  setResults([]);
                  setDomainSummary({});
                  setProgress(0);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
              >
                <RotateCw className="w-5 h-5" /> Reset
              </button>
            </div>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Progress: {Math.round(progress)}%</span>
                <span className="text-slate-400">{Math.round(progress)}/100</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Domain Summary */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Domain Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          {['technical', 'data', 'ux', 'security', 'ai', 'ops', 'jupiter'].map((domain) => {
            const stats = domainSummary[domain] || { passed: 0, failed: 0, completionPercent: 0 };
            return (
              <div key={domain} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h3 className="font-bold text-white capitalize mb-2">{domain}</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">
                    {stats.passed}/{(stats.passed || 0) + (stats.failed || 0)} passed
                  </span>
                  <span className="text-lg font-bold text-green-400">{Math.round(stats.completionPercent)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ width: `${stats.completionPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Test Selection & Results */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-4">Test Grid</h2>
        <div className="grid grid-cols-2 gap-4">
          {testDefinitions.map((testDef) => {
            const result = results.find((r) => r.testId === testDef.id);
            const isSelected = selectedTests.includes(testDef.id);
            const isActive = activeTest === testDef.id;

            return (
              <div
                key={testDef.id}
                className={`rounded-lg p-4 border transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-900/30 animate-pulse'
                    : result
                    ? result.passed
                      ? 'border-green-500/50 bg-green-900/20'
                      : 'border-red-500/50 bg-red-900/20'
                    : 'border-slate-700 bg-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white">{testDef.name}</h3>
                    <p className="text-xs text-slate-400 capitalize">{testDef.domain}</p>
                  </div>
                  <button
                    onClick={() => runSingleTest(testDef.id)}
                    disabled={isRunning || isActive}
                    className={`p-1 rounded transition ${
                      isActive || isRunning
                        ? 'text-slate-500 cursor-not-allowed'
                        : 'text-blue-400 hover:text-blue-300'
                    }`}
                  >
                    {isActive ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                  </button>
                </div>

                {result ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={result.passed ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-slate-300 hover:text-slate-200">View Metrics</summary>
                      <pre className="mt-2 text-xs bg-slate-900 p-2 rounded overflow-auto max-h-32 text-slate-300">
                        {JSON.stringify(result.metrics, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Waiting...</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="max-w-7xl mx-auto mt-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 border border-blue-500/20">
            <h2 className="text-xl font-bold text-white mb-4">Results Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 rounded p-4">
                <p className="text-slate-400 text-sm">Total Tests</p>
                <p className="text-3xl font-bold text-white">{results.length}</p>
              </div>
              <div className="bg-slate-900 rounded p-4">
                <p className="text-slate-400 text-sm">Passed</p>
                <p className="text-3xl font-bold text-green-400">{results.filter((r) => r.passed).length}</p>
              </div>
              <div className="bg-slate-900 rounded p-4">
                <p className="text-slate-400 text-sm">Failed</p>
                <p className="text-3xl font-bold text-red-400">{results.filter((r) => !r.passed).length}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExhaustiveValidationRunner;

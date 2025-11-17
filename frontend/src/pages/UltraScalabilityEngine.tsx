import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Globe, Zap, Activity, AlertTriangle } from 'lucide-react';

interface ContinentConfig {
  name: string;
  timezone: string;
  agencies: number;
  taxRules: string[];
  activeTests: number;
}

interface APIStressTest {
  serviceName: string;
  status: 'active' | 'degraded' | 'failed';
  latency: number;
  errorRate: number;
  cutoffSimulation: boolean;
}

interface DataTsunamiMetrics {
  totalRecords: number;
  yearsSimulated: number;
  ingestRate: number; // records/sec
  criticalLatency: number; // milliseconds
  targetLatency: number; // < 500ms
}

interface LatencySample {
  timestamp: number;
  p50: number;
  p95: number;
  p99: number;
}

const UltraScalabilityEngine: React.FC = () => {
  // Simulation states
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [continents, setContinents] = useState<ContinentConfig[]>([
    {
      name: 'Africa',
      timezone: 'GMT+1',
      agencies: 450,
      taxRules: ['VAT 18%', 'Income Tax 35%', 'Local Levies 2%'],
      activeTests: 0,
    },
    {
      name: 'Europe',
      timezone: 'GMT+0',
      agencies: 280,
      taxRules: ['VAT 20%', 'Corporate Tax 25%', 'GDPR Compliance'],
      activeTests: 0,
    },
    {
      name: 'Asia-Pacific',
      timezone: 'GMT+8',
      agencies: 320,
      taxRules: ['GST 7%', 'Corporate Tax 30%', 'Local Regulations'],
      activeTests: 0,
    },
    {
      name: 'Americas',
      timezone: 'GMT-5',
      agencies: 200,
      taxRules: ['Sales Tax Varied', 'Federal Tax 37%', 'State Regulations'],
      activeTests: 0,
    },
  ]);

  const [apiStressTests, setApiStressTests] = useState<APIStressTest[]>([
    { serviceName: 'Banking API', status: 'active', latency: 145, errorRate: 0.01, cutoffSimulation: false },
    { serviceName: 'SMS Gateway', status: 'active', latency: 230, errorRate: 0.05, cutoffSimulation: false },
    { serviceName: 'Insurance API', status: 'active', latency: 320, errorRate: 0.02, cutoffSimulation: false },
    { serviceName: 'Tax Authority', status: 'active', latency: 450, errorRate: 0.08, cutoffSimulation: false },
    { serviceName: 'Payment Gateway', status: 'active', latency: 180, errorRate: 0.01, cutoffSimulation: false },
    { serviceName: 'Document Storage', status: 'active', latency: 290, errorRate: 0.03, cutoffSimulation: false },
    { serviceName: 'Email Service', status: 'active', latency: 200, errorRate: 0.02, cutoffSimulation: false },
    { serviceName: 'Audit Log Service', status: 'active', latency: 350, errorRate: 0.04, cutoffSimulation: false },
    { serviceName: 'Legal Registry', status: 'active', latency: 520, errorRate: 0.1, cutoffSimulation: false },
    { serviceName: 'Analytics Engine', status: 'active', latency: 600, errorRate: 0.06, cutoffSimulation: false },
  ]);

  const [dataTsunamiMetrics, setDataTsunamiMetrics] = useState<DataTsunamiMetrics>({
    totalRecords: 0,
    yearsSimulated: 0,
    ingestRate: 0,
    criticalLatency: 0,
    targetLatency: 500,
  });

  const [latencySamples, setLatencySamples] = useState<LatencySample[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    overallLatency: 0,
    failureRate: 0,
    capacity: 0,
    dataIntegrity: 100,
  });

  // Simulation runner
  useEffect(() => {
    if (!simulationRunning) return;

    const interval = setInterval(() => {
      // Simulate API stress tests
      setApiStressTests((prev) =>
        prev.map((api) => {
          const randomCutoff = Math.random() < 0.1; // 10% chance of cutoff
          const baseLatency = api.latency + (Math.random() * 100 - 50);
          const latency = randomCutoff ? baseLatency * 10 : baseLatency;
          const status = latency > 1000 ? 'failed' : latency > 700 ? 'degraded' : 'active';

          return {
            ...api,
            latency: Math.max(50, latency),
            errorRate: status === 'failed' ? 0.5 : status === 'degraded' ? 0.1 : api.errorRate,
            status,
            cutoffSimulation: randomCutoff,
          };
        })
      );

      // Simulate data tsunami
      setDataTsunamiMetrics((prev) => {
        const totalRecords = Math.min(prev.totalRecords + Math.floor(Math.random() * 50000), 50000000); // 20 years of data
        const yearsSimulated = Math.min(Math.floor(totalRecords / 2500000), 20);
        const ingestRate = Math.floor(Math.random() * 100000) + 10000; // records/sec
        const baseLatency = 150 + Math.random() * 400;
        const criticalLatency = totalRecords > 10000000 ? baseLatency * (totalRecords / 10000000) : baseLatency;

        return {
          totalRecords,
          yearsSimulated,
          ingestRate,
          criticalLatency: Math.min(criticalLatency, 2000),
          targetLatency: 500,
        };
      });

      // Update latency samples
      const avgLatency = apiStressTests.reduce((acc, api) => acc + api.latency, 0) / apiStressTests.length;
      const p95 = avgLatency * 1.5;
      const p99 = avgLatency * 2;

      setLatencySamples((prev) => [
        ...prev.slice(-99),
        {
          timestamp: Date.now(),
          p50: avgLatency,
          p95,
          p99,
        },
      ]);

      // Update system health
      const failureRate = apiStressTests.filter((api) => api.status === 'failed').length / apiStressTests.length;
      const capacity = (dataTsunamiMetrics.totalRecords / 50000000) * 100;

      setSystemHealth({
        overallLatency: Math.round(avgLatency),
        failureRate: Math.round(failureRate * 100),
        capacity: Math.round(capacity),
        dataIntegrity: Math.max(100 - failureRate * 50, 0),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [simulationRunning, apiStressTests, dataTsunamiMetrics]);

  const handleStartSimulation = () => {
    setSimulationRunning(true);
    setContinents((prev) =>
      prev.map((c) => ({
        ...c,
        activeTests: Math.floor(Math.random() * 50) + 10,
      }))
    );
  };

  const handleStopSimulation = () => {
    setSimulationRunning(false);
  };

  const handleReset = () => {
    setSimulationRunning(false);
    setDataTsunamiMetrics({
      totalRecords: 0,
      yearsSimulated: 0,
      ingestRate: 0,
      criticalLatency: 0,
      targetLatency: 500,
    });
    setLatencySamples([]);
    setSystemHealth({
      overallLatency: 0,
      failureRate: 0,
      capacity: 0,
      dataIntegrity: 100,
    });
    setContinents((prev) =>
      prev.map((c) => ({
        ...c,
        activeTests: 0,
      }))
    );
    setApiStressTests((prev) =>
      prev.map((api) => ({
        ...api,
        status: 'active',
        latency: Math.random() * 300 + 100,
        errorRate: 0.02,
        cutoffSimulation: false,
      }))
    );
  };

  const isHealthy = systemHealth.dataIntegrity > 95 && dataTsunamiMetrics.criticalLatency < 500;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Globe className="w-10 h-10 text-cyan-400" />
            Ultra-Scalability Engine
          </h1>
          <p className="text-gray-400">Multi-continent simulation • 10-API stress test • Data tsunami (20 years)</p>
        </div>

        {/* System Health Dashboard */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Overall Latency</div>
            <div className="text-3xl font-bold mt-2">{systemHealth.overallLatency}ms</div>
            <div className="text-xs mt-2 opacity-75">Target: &lt; 500ms</div>
          </div>

          <div className={`bg-gradient-to-br rounded-lg p-6 text-white ${isHealthy ? 'from-green-500 to-emerald-600' : 'from-orange-500 to-red-600'}`}>
            <div className="text-sm font-semibold opacity-80">Data Integrity</div>
            <div className="text-3xl font-bold mt-2">{Math.round(systemHealth.dataIntegrity)}%</div>
            <div className="text-xs mt-2 opacity-75">{isHealthy ? '✓ Healthy' : '⚠ Degraded'}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Failure Rate</div>
            <div className="text-3xl font-bold mt-2">{systemHealth.failureRate}%</div>
            <div className="text-xs mt-2 opacity-75">Failed APIs</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Data Capacity</div>
            <div className="text-3xl font-bold mt-2">{systemHealth.capacity}%</div>
            <div className="text-xs mt-2 opacity-75">{dataTsunamiMetrics.totalRecords.toLocaleString()} records</div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Simulation Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={handleStartSimulation}
              disabled={simulationRunning}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <Play className="w-5 h-5" />
              Start Simulation
            </button>
            <button
              onClick={handleStopSimulation}
              disabled={!simulationRunning}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <Pause className="w-5 h-5" />
              Stop Simulation
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>

        {/* Continental Distribution */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Continental Distribution
            </h2>
            <div className="space-y-3">
              {continents.map((continent) => (
                <div key={continent.name} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{continent.name}</h3>
                      <p className="text-xs text-gray-400">{continent.timezone}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-cyan-400">{continent.agencies}</div>
                      <div className="text-xs text-gray-400">Agencies</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs text-gray-400">Active Tests:</div>
                    <div className="text-sm font-semibold text-green-400">{continent.activeTests}</div>
                  </div>
                  <div className="text-xs text-gray-500">Tax Rules: {continent.taxRules.join(', ')}</div>
                  <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(continent.activeTests / 50) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Tsunami Metrics */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Data Tsunami (20-Year Injection)
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Total Records</span>
                  <span className="text-sm font-semibold text-white">
                    {(dataTsunamiMetrics.totalRecords / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-red-500 h-3 rounded-full transition-all"
                    style={{ width: `${(dataTsunamiMetrics.totalRecords / 50000000) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Years Simulated</span>
                  <span className="text-sm font-semibold text-white">{dataTsunamiMetrics.yearsSimulated}/20</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-pink-500 h-3 rounded-full transition-all"
                    style={{ width: `${(dataTsunamiMetrics.yearsSimulated / 20) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-3 mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">Ingest Rate</span>
                  <span className="text-xs font-semibold text-green-400">
                    {(dataTsunamiMetrics.ingestRate / 1000).toFixed(0)}K records/sec
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Critical Latency</span>
                  <span
                    className={`text-xs font-semibold ${
                      dataTsunamiMetrics.criticalLatency < 500 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {Math.round(dataTsunamiMetrics.criticalLatency)}ms
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Stress Test Grid */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-pink-400" />
            10-API Stress Test (with random cutoffs)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {apiStressTests.map((api) => (
              <div
                key={api.serviceName}
                className={`rounded-lg p-4 border transition ${
                  api.status === 'active'
                    ? 'bg-gray-700 border-gray-600'
                    : api.status === 'degraded'
                    ? 'bg-orange-900 border-orange-600'
                    : 'bg-red-900 border-red-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white">{api.serviceName}</h3>
                  <div
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      api.status === 'active'
                        ? 'bg-green-900 text-green-200'
                        : api.status === 'degraded'
                        ? 'bg-yellow-900 text-yellow-200'
                        : 'bg-red-900 text-red-200'
                    }`}
                  >
                    {api.status.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <span className="text-gray-400">Latency:</span>
                    <span className={`ml-2 font-semibold ${api.latency > 700 ? 'text-red-400' : 'text-green-400'}`}>
                      {Math.round(api.latency)}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Error Rate:</span>
                    <span className="ml-2 font-semibold text-yellow-400">{(api.errorRate * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {api.cutoffSimulation && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900 bg-opacity-50 px-2 py-1 rounded">
                    <AlertTriangle className="w-3 h-3" />
                    Service cutoff simulated
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Latency Timeline */}
        {latencySamples.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Real-Time Latency Distribution</h2>
            <div className="h-64 bg-gray-900 rounded-lg p-4 relative overflow-hidden">
              <div className="flex items-end justify-between h-full gap-1">
                {latencySamples.map((sample, idx) => (
                  <div key={idx} className="flex-1 flex items-end gap-1 group">
                    <div
                      className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t hover:opacity-75 transition relative group"
                      style={{ height: `${(sample.p50 / 1000) * 100}%` }}
                      title={`p50: ${sample.p50.toFixed(0)}ms`}
                    />
                    <div
                      className="w-px bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t hover:opacity-75 transition"
                      style={{ height: `${(sample.p95 / 1000) * 100}%` }}
                      title={`p95: ${sample.p95.toFixed(0)}ms`}
                    />
                    <div
                      className="w-px bg-gradient-to-t from-red-500 to-red-400 rounded-t hover:opacity-75 transition"
                      style={{ height: `${(sample.p99 / 1000) * 100}%` }}
                      title={`p99: ${sample.p99.toFixed(0)}ms`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-400">p50 (median)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-gray-400">p95 (95th percentile)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-gray-400">p99 (99th percentile)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UltraScalabilityEngine;

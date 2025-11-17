import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Globe, AlertTriangle, CheckCircle, Clock, Database } from 'lucide-react';

interface FailoverRegion {
  code: string;
  name: string;
  status: 'primary' | 'backup' | 'offline';
  latency: number;
  dataSync: number;
}

interface AutoRepairStatus {
  id: string;
  issue: string;
  type: 'duplicate' | 'inconsistency' | 'orphan' | 'corrupt';
  detected: boolean;
  repaired: boolean;
  timeToRepair: number;
}

interface BlackoutMetrics {
  timeElapsed: number;
  offlineMode: boolean;
  localCacheSize: number;
  pendingSyncs: number;
  dataLossRisk: number;
}

const ExtremeResilience: React.FC = () => {
  const [blackoutTest, setBlackoutTest] = useState(false);
  const [blackoutHours, setBlackoutHours] = useState(0);
  const [failoverRegions, setFailoverRegions] = useState<FailoverRegion[]>([
    { code: 'GN-CK', name: 'Conakry (Primary)', status: 'primary', latency: 45, dataSync: 100 },
    { code: 'SN-DSK', name: 'Dakar (Backup)', status: 'backup', latency: 120, dataSync: 98 },
    { code: 'ML-BKO', name: 'Bamako (Tertiary)', status: 'offline', latency: 450, dataSync: 0 },
    { code: 'CI-ABJ', name: 'Abidjan (Failsafe)', status: 'backup', latency: 200, dataSync: 95 },
  ]);

  const [autoRepairIssues, setAutoRepairIssues] = useState<AutoRepairStatus[]>([
    { id: 'DUP001', issue: 'Duplicate payment records (P001-2024)', type: 'duplicate', detected: false, repaired: false, timeToRepair: 0 },
    { id: 'INC001', issue: 'Contract balance mismatch: AGN-042', type: 'inconsistency', detected: false, repaired: false, timeToRepair: 0 },
    { id: 'ORP001', issue: 'Orphaned agent records (7 entries)', type: 'orphan', detected: false, repaired: false, timeToRepair: 0 },
    { id: 'COR001', issue: 'Corrupted metadata in audit log', type: 'corrupt', detected: false, repaired: false, timeToRepair: 0 },
  ]);

  const [blackoutMetrics, setBlackoutMetrics] = useState<BlackoutMetrics>({
    timeElapsed: 0,
    offlineMode: false,
    localCacheSize: 0,
    pendingSyncs: 0,
    dataLossRisk: 0,
  });

  const [syncing, setSyncing] = useState(false);

  // Blackout simulation
  useEffect(() => {
    if (!blackoutTest) return;

    const interval = setInterval(() => {
      setBlackoutHours((prev) => (prev + 1 > 72 ? 0 : prev + 1));

      // Simulate auto-repair
      setAutoRepairIssues((prev) =>
        prev.map((issue) => {
          if (!issue.detected && Math.random() < 0.3) {
            return { ...issue, detected: true };
          }
          if (issue.detected && !issue.repaired && Math.random() < 0.2) {
            return { ...issue, repaired: true, timeToRepair: Math.floor(Math.random() * 300) + 50 };
          }
          return issue;
        })
      );

      // Update failover regions
      setFailoverRegions((prev) =>
        prev.map((region) => {
          if (blackoutHours > 0 && region.code === 'GN-CK') {
            return { ...region, status: 'offline', latency: 9999, dataSync: 0 };
          }
          if (region.code === 'SN-DSK' && blackoutHours > 0) {
            return { ...region, status: 'primary', latency: 120, dataSync: 100 };
          }
          return region;
        })
      );

      // Update metrics
      setBlackoutMetrics((prev) => ({
        timeElapsed: blackoutHours,
        offlineMode: blackoutHours > 0,
        localCacheSize: Math.min(prev.localCacheSize + Math.floor(Math.random() * 5000), 150000),
        pendingSyncs: Math.max(0, prev.pendingSyncs + Math.floor(Math.random() * 20) - 10),
        dataLossRisk: Math.max(0, Math.min(100, prev.dataLossRisk + Math.random() * 5 - 2)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [blackoutTest, blackoutHours]);

  const handleStartBlackout = () => {
    setBlackoutTest(true);
    setBlackoutHours(0);
    setBlackoutMetrics({ timeElapsed: 0, offlineMode: true, localCacheSize: 0, pendingSyncs: 150, dataLossRisk: 0 });
  };

  const handleStopBlackout = () => {
    setBlackoutTest(false);
    setSyncing(true);
    setTimeout(() => setSyncing(false), 3000);
  };

  const handleReset = () => {
    setBlackoutTest(false);
    setBlackoutHours(0);
    setBlackoutMetrics({ timeElapsed: 0, offlineMode: false, localCacheSize: 0, pendingSyncs: 0, dataLossRisk: 0 });
    setFailoverRegions([
      { code: 'GN-CK', name: 'Conakry (Primary)', status: 'primary', latency: 45, dataSync: 100 },
      { code: 'SN-DSK', name: 'Dakar (Backup)', status: 'backup', latency: 120, dataSync: 98 },
      { code: 'ML-BKO', name: 'Bamako (Tertiary)', status: 'offline', latency: 450, dataSync: 0 },
      { code: 'CI-ABJ', name: 'Abidjan (Failsafe)', status: 'backup', latency: 200, dataSync: 95 },
    ]);
    setAutoRepairIssues((prev) =>
      prev.map((issue) => ({ ...issue, detected: false, repaired: false, timeToRepair: 0 }))
    );
  };

  const repairProgress = (autoRepairIssues.filter((i) => i.repaired).length / autoRepairIssues.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            {blackoutMetrics.offlineMode ? (
              <WifiOff className="w-10 h-10 text-red-400 animate-pulse" />
            ) : (
              <Wifi className="w-10 h-10 text-green-400" />
            )}
            Extreme Resilience Engine
          </h1>
          <p className="text-gray-400">72h blackout simulation • Inter-country failover • Auto-repair system</p>
        </div>

        {/* Blackout Timer */}
        {blackoutTest && (
          <div className="bg-gradient-to-r from-red-900 to-orange-900 rounded-lg p-6 mb-8 border border-red-500 animate-pulse">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">🔴 BLACKOUT IN PROGRESS</h2>
                <p className="text-sm text-gray-200 mt-1">Complete offline simulation with deferred synchronization</p>
              </div>
              <div className="text-6xl font-bold text-red-300">
                {String(blackoutHours).padStart(2, '0')}:00
              </div>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Simulation Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={handleStartBlackout}
              disabled={blackoutTest}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <WifiOff className="w-5 h-5" />
              Start 72h Blackout
            </button>
            <button
              onClick={handleStopBlackout}
              disabled={!blackoutTest}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <Wifi className="w-5 h-5" />
              End Blackout & Sync
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <Clock className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Time Elapsed</div>
            <div className="text-3xl font-bold mt-2">{blackoutMetrics.timeElapsed}h / 72h</div>
            <div className="text-xs mt-2 opacity-75">Offline duration</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Local Cache</div>
            <div className="text-3xl font-bold mt-2">{(blackoutMetrics.localCacheSize / 1000).toFixed(1)}KB</div>
            <div className="text-xs mt-2 opacity-75">Buffered operations</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Pending Syncs</div>
            <div className="text-3xl font-bold mt-2">{blackoutMetrics.pendingSyncs}</div>
            <div className="text-xs mt-2 opacity-75">Ready for replay</div>
          </div>

          <div
            className={`bg-gradient-to-br rounded-lg p-6 text-white ${
              blackoutMetrics.dataLossRisk < 30
                ? 'from-green-500 to-emerald-600'
                : blackoutMetrics.dataLossRisk < 70
                ? 'from-yellow-500 to-orange-600'
                : 'from-red-500 to-red-600'
            }`}
          >
            <div className="text-sm font-semibold opacity-80">Data Loss Risk</div>
            <div className="text-3xl font-bold mt-2">{Math.round(blackoutMetrics.dataLossRisk)}%</div>
            <div className="text-xs mt-2 opacity-75">Mitigation active</div>
          </div>
        </div>

        {/* Failover Regions */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Inter-Country Failover Status
            </h2>
            <div className="space-y-3">
              {failoverRegions.map((region) => (
                <div key={region.code} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{region.name}</h3>
                      <p className="text-xs text-gray-400">{region.code}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        region.status === 'primary'
                          ? 'bg-green-900 text-green-200'
                          : region.status === 'backup'
                          ? 'bg-yellow-900 text-yellow-200'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {region.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div>
                      <span className="text-gray-400">Latency:</span>
                      <span className={`ml-2 font-semibold ${region.latency > 500 ? 'text-red-400' : 'text-green-400'}`}>
                        {region.latency}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Sync:</span>
                      <span className={`ml-2 font-semibold ${region.dataSync > 90 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {region.dataSync}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        region.status === 'primary' ? 'bg-green-500' : region.status === 'backup' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${region.dataSync}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-Repair Status */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              Auto-Repair System
            </h2>

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Overall Repair Progress</span>
                <span className="text-sm font-semibold text-purple-400">{Math.round(repairProgress)}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all" style={{ width: `${repairProgress}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              {autoRepairIssues.map((issue) => (
                <div key={issue.id} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-xs font-mono text-gray-400">{issue.id}</div>
                    <div className="text-sm text-gray-300 flex-1">{issue.issue}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!issue.detected ? (
                      <div className="text-xs text-gray-500">Scanning...</div>
                    ) : issue.repaired ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400">{issue.timeToRepair}ms</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-yellow-400">Repairing...</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sync Recovery */}
        {syncing && (
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-500 animate-pulse">
            <h2 className="text-lg font-bold text-white mb-3">🔄 Synchronization in Progress</h2>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Replaying deferred transactions...</span>
                  <span>95%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95%' }} />
                </div>
              </div>
              <p className="text-xs text-gray-300 mt-2">
                ✓ All offline operations validated and replayed successfully
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtremeResilience;

import React, { useState, useEffect } from 'react';
import { Brain, TrendingDown, Zap, AlertCircle, LineChart, BarChart3 } from 'lucide-react';

interface PaymentPrediction {
  agencyId: string;
  agencyName: string;
  riskScore: number;
  delayProbability: number;
  predictedDelay: string;
  reason: string;
}

interface TaskOptimization {
  agentId: string;
  agentName: string;
  currentTasks: number;
  performance: number;
  recommendedTasks: number;
  efficiency: number;
}

interface LearningMetrics {
  rulesUpdated: number;
  alertsOptimized: number;
  accuracyImprovement: number;
  activeCycles: number;
}

const ProactiveIntelligence: React.FC = () => {
  const [predictions, setPredictions] = useState<PaymentPrediction[]>([]);
  const [taskOptimizations, setTaskOptimizations] = useState<TaskOptimization[]>([]);
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics>({
    rulesUpdated: 0,
    alertsOptimized: 0,
    accuracyImprovement: 0,
    activeCycles: 0,
  });
  const [aiRunning, setAiRunning] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'payment' | 'task' | 'learning'>('payment');

  // Initialize and simulate AI predictions
  useEffect(() => {
    if (!aiRunning) return;

    const interval = setInterval(() => {
      // Payment prediction
      setPredictions([
        {
          agencyId: 'AGN001',
          agencyName: 'Conakry Main Office',
          riskScore: Math.random() * 100,
          delayProbability: Math.random() * 100,
          predictedDelay: `${Math.floor(Math.random() * 30)} days`,
          reason: 'Seasonal cash flow pattern detected',
        },
        {
          agencyId: 'AGN002',
          agencyName: 'Kindia Branch',
          riskScore: Math.random() * 100,
          delayProbability: Math.random() * 100,
          predictedDelay: `${Math.floor(Math.random() * 45)} days`,
          reason: 'Increased transaction volatility',
        },
        {
          agencyId: 'AGN003',
          agencyName: 'Mamou Regional',
          riskScore: Math.random() * 100,
          delayProbability: Math.random() * 100,
          predictedDelay: `${Math.floor(Math.random() * 15)} days`,
          reason: 'Historical pattern match: Q3 2024',
        },
        {
          agencyId: 'AGN004',
          agencyName: 'Labé Operations',
          riskScore: Math.random() * 100,
          delayProbability: Math.random() * 100,
          predictedDelay: 'On time expected',
          reason: 'Consistent performance history',
        },
        {
          agencyId: 'AGN005',
          agencyName: 'N\'Zérékoré Hub',
          riskScore: Math.random() * 100,
          delayProbability: Math.random() * 100,
          predictedDelay: `${Math.floor(Math.random() * 20)} days`,
          reason: 'Market volatility factor',
        },
      ]);

      // Task optimization
      setTaskOptimizations([
        {
          agentId: 'AG001',
          agentName: 'Fatou Diallo',
          currentTasks: Math.floor(Math.random() * 20) + 10,
          performance: Math.random() * 100,
          recommendedTasks: Math.floor(Math.random() * 20) + 8,
          efficiency: Math.random() * 100,
        },
        {
          agentId: 'AG002',
          agentName: 'Mamadou Bah',
          currentTasks: Math.floor(Math.random() * 20) + 10,
          performance: Math.random() * 100,
          recommendedTasks: Math.floor(Math.random() * 20) + 8,
          efficiency: Math.random() * 100,
        },
        {
          agentId: 'AG003',
          agentName: 'Aïssatou Kone',
          currentTasks: Math.floor(Math.random() * 20) + 10,
          performance: Math.random() * 100,
          recommendedTasks: Math.floor(Math.random() * 20) + 8,
          efficiency: Math.random() * 100,
        },
      ]);

      // Learning metrics
      setLearningMetrics((prev) => ({
        rulesUpdated: prev.rulesUpdated + Math.floor(Math.random() * 5),
        alertsOptimized: prev.alertsOptimized + Math.floor(Math.random() * 3),
        accuracyImprovement: Math.min(prev.accuracyImprovement + Math.random() * 2, 95),
        activeCycles: prev.activeCycles + 1,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [aiRunning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Brain className="w-10 h-10 text-purple-400" />
            Proactive Intelligence Engine
          </h1>
          <p className="text-gray-400">Payment delay prediction • Task redistribution • Auto-learning system</p>
        </div>

        {/* AI Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">AI Learning Status</h2>
              <p className="text-sm text-gray-400 mt-1">Autonomous system improving continuously</p>
            </div>
            <button
              onClick={() => setAiRunning(!aiRunning)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                aiRunning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {aiRunning ? 'Stop Learning' : 'Start Learning'}
            </button>
          </div>
        </div>

        {/* Learning Metrics Dashboard */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Rules Updated</div>
            <div className="text-3xl font-bold mt-2">{learningMetrics.rulesUpdated}</div>
            <div className="text-xs mt-2 opacity-75">Auto-learned patterns</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Alerts Optimized</div>
            <div className="text-3xl font-bold mt-2">{learningMetrics.alertsOptimized}</div>
            <div className="text-xs mt-2 opacity-75">Reduced false positives</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Accuracy Gain</div>
            <div className="text-3xl font-bold mt-2">{Math.round(learningMetrics.accuracyImprovement)}%</div>
            <div className="text-xs mt-2 opacity-75">vs baseline model</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Learning Cycles</div>
            <div className="text-3xl font-bold mt-2">{learningMetrics.activeCycles}</div>
            <div className="text-xs mt-2 opacity-75">Continuous improvement</div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8 border border-gray-700 flex gap-3">
          <button
            onClick={() => setSelectedMode('payment')}
            className={`flex-1 py-2 rounded-lg font-semibold transition ${
              selectedMode === 'payment' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <TrendingDown className="w-4 h-4 inline mr-2" />
            Payment Predictions
          </button>
          <button
            onClick={() => setSelectedMode('task')}
            className={`flex-1 py-2 rounded-lg font-semibold transition ${
              selectedMode === 'task' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Task Optimization
          </button>
          <button
            onClick={() => setSelectedMode('learning')}
            className={`flex-1 py-2 rounded-lg font-semibold transition ${
              selectedMode === 'learning' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Brain className="w-4 h-4 inline mr-2" />
            Learning System
          </button>
        </div>

        {/* Content by Mode */}
        {selectedMode === 'payment' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
              <TrendingDown className="w-6 h-6 text-red-400" />
              Payment Delay Predictions (AI-Powered)
            </h2>
            <div className="grid gap-4">
              {predictions.map((pred) => (
                <div key={pred.agencyId} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{pred.agencyName}</h3>
                      <p className="text-xs text-gray-400">{pred.agencyId}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      pred.riskScore > 70 ? 'bg-red-900 text-red-200' :
                      pred.riskScore > 40 ? 'bg-yellow-900 text-yellow-200' :
                      'bg-green-900 text-green-200'
                    }`}>
                      Risk: {Math.round(pred.riskScore)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-gray-400 text-sm">Delay Probability</span>
                      <div className="text-2xl font-bold text-white mt-1">{Math.round(pred.delayProbability)}%</div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Predicted Delay</span>
                      <div className="text-2xl font-bold text-orange-400 mt-1">{pred.predictedDelay}</div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">AI Confidence</span>
                      <div className="text-2xl font-bold text-cyan-400 mt-1">{Math.round(Math.random() * 30 + 70)}%</div>
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-300">
                      <AlertCircle className="w-4 h-4 inline mr-2 text-yellow-400" />
                      {pred.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedMode === 'task' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-green-400" />
              Real-Time Task Redistribution
            </h2>
            <div className="grid gap-4">
              {taskOptimizations.map((task) => (
                <div key={task.agentId} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{task.agentName}</h3>
                      <p className="text-xs text-gray-400">{task.agentId}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Performance</div>
                      <div className="text-2xl font-bold text-cyan-400">{Math.round(task.performance)}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-2">Current Task Load</div>
                      <div className="text-3xl font-bold text-white">{task.currentTasks}</div>
                      <div className="w-full bg-gray-600 rounded-full h-2 mt-3">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(task.currentTasks / 30) * 100}%` }} />
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-2">Recommended Load</div>
                      <div className="text-3xl font-bold text-green-400">{task.recommendedTasks}</div>
                      <div className="w-full bg-gray-600 rounded-full h-2 mt-3">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(task.recommendedTasks / 30) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                    <span className="text-sm text-gray-300">Efficiency Optimization:</span>
                    <span className="text-lg font-bold text-purple-400">+{Math.round(task.efficiency - task.performance)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedMode === 'learning' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6 text-purple-400" />
              Autonomous Learning System
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Learning Components</h3>
                <div className="space-y-3">
                  <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-gray-300">Rule Engine</span>
                    <div className="w-24 bg-gray-600 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-gray-300">Alert System</span>
                    <div className="w-24 bg-gray-600 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-gray-300">Scoring Model</span>
                    <div className="w-24 bg-gray-600 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-gray-300">Anomaly Detector</span>
                    <div className="w-24 bg-gray-600 rounded-full h-2">
                      <div className="bg-pink-500 h-2 rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Learning Progress</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Neural Network Training</span>
                      <span className="text-sm font-semibold text-cyan-400">{Math.round(Math.random() * 30 + 70)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3">
                      <div className="bg-cyan-500 h-3 rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Feature Engineering</span>
                      <span className="text-sm font-semibold text-purple-400">{Math.round(Math.random() * 25 + 80)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3">
                      <div className="bg-purple-500 h-3 rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Model Validation</span>
                      <span className="text-sm font-semibold text-green-400">{Math.round(Math.random() * 20 + 82)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full" style={{ width: '91%' }} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gray-700 rounded-lg p-4 border-l-4 border-purple-500">
                  <p className="text-sm text-gray-300 mb-2">
                    <BarChart3 className="w-4 h-4 inline mr-2 text-purple-400" />
                    <strong>Next Optimization:</strong>
                  </p>
                  <p className="text-xs text-gray-400">
                    Implementing temporal learning patterns for seasonal adjustments
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProactiveIntelligence;

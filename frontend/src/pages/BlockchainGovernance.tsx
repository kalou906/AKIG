import React, { useState, useEffect } from 'react';
import { Lock, FileText, CheckCircle, AlertTriangle, Eye, Shield, Code } from 'lucide-react';

interface BlockchainEntry {
  id: string;
  timestamp: number;
  action: string;
  actor: string;
  hash: string;
  status: 'confirmed' | 'pending';
}

interface SmartContract {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'error';
  executions: number;
  condition: string;
  action: string;
}

interface ComplianceCheck {
  standard: string;
  status: 'compliant' | 'warning' | 'non-compliant';
  score: number;
  items: string[];
}

const BlockchainGovernance: React.FC = () => {
  const [blockchainEntries, setBlockchainEntries] = useState<BlockchainEntry[]>([]);
  const [smartContracts, setSmartContracts] = useState<SmartContract[]>([
    {
      id: 'SC001',
      name: 'Auto Payment Reminder',
      status: 'active',
      executions: 1250,
      condition: 'Payment due in 7 days',
      action: 'Send SMS + Email reminder',
    },
    {
      id: 'SC002',
      name: 'Late Fee Application',
      status: 'active',
      executions: 342,
      condition: 'Payment overdue > 30 days',
      action: 'Apply late fee + update status',
    },
    {
      id: 'SC003',
      name: 'Contract Extension',
      status: 'paused',
      executions: 89,
      condition: 'End date approaches (30 days)',
      action: 'Auto-trigger renewal workflow',
    },
  ]);

  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([
    {
      standard: 'RGPD (EU)',
      status: 'compliant',
      score: 98,
      items: ['✓ Data minimization', '✓ Consent management', '✓ Right to erasure', '✓ Data portability'],
    },
    {
      standard: 'ISO 27001',
      status: 'compliant',
      score: 96,
      items: ['✓ Access controls', '✓ Encryption', '✓ Audit logging', '✓ Incident response'],
    },
    {
      standard: 'Guinea Local Regulations',
      status: 'warning',
      score: 87,
      items: ['✓ Tax compliance', '⚠ Local reporting delays', '✓ Agent registration', '✓ Fund management'],
    },
  ]);

  const [selectedContract, setSelectedContract] = useState<SmartContract | null>(smartContracts[0]);
  const [auditSearch, setAuditSearch] = useState('');

  // Simulate blockchain entries
  useEffect(() => {
    const interval = setInterval(() => {
      const actions = [
        'Payment processed',
        'Contract created',
        'Agent registered',
        'Payment reminder sent',
        'Late fee applied',
        'Dispute raised',
        'Document signed',
        'Fund transferred',
      ];

      const newEntry: BlockchainEntry = {
        id: `BLK${Date.now()}`,
        timestamp: Date.now(),
        action: actions[Math.floor(Math.random() * actions.length)],
        actor: `Agent_${Math.floor(Math.random() * 1000)}`,
        hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        status: Math.random() > 0.1 ? 'confirmed' : 'pending',
      };

      setBlockchainEntries((prev) => [newEntry, ...prev.slice(0, 49)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Lock className="w-10 h-10 text-blue-400" />
            Blockchain Governance
          </h1>
          <p className="text-gray-400">Immutable audit trail • Smart contracts • Multi-norm compliance</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Total Transactions</div>
            <div className="text-3xl font-bold mt-2">{blockchainEntries.length}</div>
            <div className="text-xs mt-2 opacity-75">Immutable ledger</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Smart Contracts</div>
            <div className="text-3xl font-bold mt-2">{smartContracts.filter((c) => c.status === 'active').length}</div>
            <div className="text-xs mt-2 opacity-75">Active automation</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Compliance Score</div>
            <div className="text-3xl font-bold mt-2">94%</div>
            <div className="text-xs mt-2 opacity-75">Multi-norm certified</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Total Executions</div>
            <div className="text-3xl font-bold mt-2">{smartContracts.reduce((acc, c) => acc + c.executions, 0)}</div>
            <div className="text-xs mt-2 opacity-75">Smart contract runs</div>
          </div>
        </div>

        {/* Smart Contracts Editor */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-green-400" />
              Smart Contracts
            </h2>

            <div className="space-y-3">
              {smartContracts.map((contract) => (
                <button
                  key={contract.id}
                  onClick={() => setSelectedContract(contract)}
                  className={`w-full p-4 rounded-lg text-left transition ${
                    selectedContract?.id === contract.id
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold">{contract.name}</div>
                      <div className="text-xs opacity-75 mt-1">{contract.id}</div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        contract.status === 'active'
                          ? 'bg-green-900 text-green-200'
                          : contract.status === 'paused'
                          ? 'bg-yellow-900 text-yellow-200'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {contract.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-xs text-opacity-75">Executions: {contract.executions}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Contract Details */}
          {selectedContract && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Contract Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Name</label>
                  <div className="text-white font-semibold mt-1">{selectedContract.name}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                    selectedContract.status === 'active'
                      ? 'bg-green-900 text-green-200'
                      : selectedContract.status === 'paused'
                      ? 'bg-yellow-900 text-yellow-200'
                      : 'bg-red-900 text-red-200'
                  }`}>
                    {selectedContract.status.toUpperCase()}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Trigger Condition</label>
                  <div className="text-white text-sm mt-1 bg-gray-700 rounded-lg p-3">
                    {selectedContract.condition}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Execution Action</label>
                  <div className="text-white text-sm mt-1 bg-gray-700 rounded-lg p-3">
                    {selectedContract.action}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Total Executions</label>
                  <div className="text-2xl font-bold text-green-400 mt-1">{selectedContract.executions}</div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
                  Edit Contract
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Compliance Matrix */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Compliance Status
          </h2>

          <div className="grid grid-cols-3 gap-4">
            {complianceChecks.map((check) => (
              <div key={check.standard} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{check.standard}</h3>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      check.status === 'compliant'
                        ? 'bg-green-900 text-green-200'
                        : check.status === 'warning'
                        ? 'bg-yellow-900 text-yellow-200'
                        : 'bg-red-900 text-red-200'
                    }`}
                  >
                    {check.status === 'compliant' ? '✓' : check.status === 'warning' ? '⚠' : '✕'} {check.score}%
                  </div>
                </div>

                <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full ${
                      check.status === 'compliant'
                        ? 'bg-green-500'
                        : check.status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${check.score}%` }}
                  />
                </div>

                <ul className="space-y-1 text-xs">
                  {check.items.map((item, idx) => (
                    <li key={idx} className="text-gray-400 flex items-start gap-2">
                      <span className="flex-shrink-0">{item.startsWith('✓') ? '✓' : item.startsWith('⚠') ? '⚠' : '✕'}</span>
                      <span>{item.substring(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Blockchain Audit Log */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              Immutable Audit Trail
            </h2>
            <input
              type="text"
              placeholder="Search by actor or action..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="px-3 py-1 rounded-lg bg-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {blockchainEntries
              .filter(
                (entry) =>
                  entry.actor.toLowerCase().includes(auditSearch.toLowerCase()) ||
                  entry.action.toLowerCase().includes(auditSearch.toLowerCase())
              )
              .map((entry) => (
                <div key={entry.id} className="bg-gray-700 rounded-lg p-3 text-sm flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-white">{entry.action}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      By {entry.actor} • {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-1 truncate">
                      Hash: {entry.hash}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.status === 'confirmed' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className="text-xs text-gray-400">{entry.status}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainGovernance;

/**
 * 📋 Export Verification Page
 * 
 * Page pour tester et vérifier tous les exports
 */

import React, { useState } from 'react';
import { Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import {
  exportPropertiesPDF,
  exportPropertiesExcel,
  exportPaymentsPDF,
  exportPaymentsExcel,
  exportFiscalPDF,
  exportFiscalExcel,
  exportContract,
  exportMultiFormat
} from '../utils/exportUtils';

export default function ExportsVerificationPage() {
  const [tests, setTests] = useState({});
  const [loading, setLoading] = useState(false);

  const runTest = async (testName, testFn) => {
    try {
      setTests(prev => ({ ...prev, [testName]: { status: 'loading' } }));
      const result = await testFn();
      setTests(prev => ({
        ...prev,
        [testName]: { status: result.success ? 'success' : 'error', error: result.error }
      }));
    } catch (err) {
      setTests(prev => ({
        ...prev,
        [testName]: { status: 'error', error: err.message }
      }));
    }
  };

  const testSuite = [
    {
      category: '🏠 Propriétés',
      tests: [
        {
          name: 'Properties PDF',
          fn: () => exportPropertiesPDF()
        },
        {
          name: 'Properties Excel',
          fn: () => exportPropertiesExcel()
        }
      ]
    },
    {
      category: '💳 Paiements',
      tests: [
        {
          name: 'Payments PDF',
          fn: () => exportPaymentsPDF()
        },
        {
          name: 'Payments Excel',
          fn: () => exportPaymentsExcel()
        }
      ]
    },
    {
      category: '📊 Rapports',
      tests: [
        {
          name: 'Fiscal PDF',
          fn: () => exportFiscalPDF()
        },
        {
          name: 'Fiscal Excel',
          fn: () => exportFiscalExcel()
        }
      ]
    },
    {
      category: '📋 Contrats',
      tests: [
        {
          name: 'Contract PDF (ID: 123)',
          fn: () => exportContract('123', 'pdf')
        }
      ]
    }
  ];

  const runAllTests = async () => {
    setLoading(true);
    for (const category of testSuite) {
      for (const test of category.tests) {
        await runTest(test.name, test.fn);
        await new Promise(r => setTimeout(r, 500)); // Delay between tests
      }
    }
    setLoading(false);
  };

  const getTestStatus = (testName) => {
    const test = tests[testName];
    if (!test) return null;
    if (test.status === 'loading') return <Loader className="animate-spin" size={16} />;
    if (test.status === 'success') return <CheckCircle size={16} className="text-green-500" />;
    return <AlertCircle size={16} className="text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📤 Vérification Exports</h1>
          <p className="text-gray-600">Testez tous les endpoints d'export pour vérifier le bon fonctionnement</p>
        </div>

        {/* Run All Button */}
        <div className="mb-6">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Tests en cours...
              </>
            ) : (
              <>
                <Download size={20} />
                Exécuter Tous les Tests
              </>
            )}
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-6">
          {testSuite.map((category, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <div className="bg-gray-100 px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">{category.category}</h2>
              </div>

              {/* Test Items */}
              <div className="divide-y">
                {category.tests.map((test, testIdx) => {
                  const testStatus = tests[test.name];
                  return (
                    <div key={testIdx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{test.name}</div>
                        {testStatus?.error && (
                          <div className="text-sm text-red-600 mt-1">Error: {testStatus.error}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div>{getTestStatus(test.name)}</div>
                        <button
                          onClick={() => runTest(test.name, test.fn)}
                          disabled={tests[test.name]?.status === 'loading'}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold disabled:opacity-50"
                        >
                          Test
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {Object.keys(tests).length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">📊 Résumé</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Object.values(tests).filter(t => t.status === 'success').length}
                </div>
                <div className="text-gray-600">Tests Réussis</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(tests).filter(t => t.status === 'error').length}
                </div>
                <div className="text-gray-600">Tests Échoués</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Object.keys(tests).length}
                </div>
                <div className="text-gray-600">Tests Total</div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🔧 Debug Info</h3>
          <div className="bg-white rounded p-4 text-sm font-mono text-gray-700 overflow-auto max-h-40">
            <pre>{JSON.stringify(tests, null, 2)}</pre>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">✅ Comment Utiliser</h3>
          <ol className="space-y-2 text-gray-700 list-decimal list-inside">
            <li>Cliquez <strong>"Exécuter Tous les Tests"</strong> pour lancer toute la suite</li>
            <li>Ou cliquez <strong>"Test"</strong> sur chaque ligne pour un test individuel</li>
            <li>Chaque test exporte un fichier réel - vérifiez vos téléchargements</li>
            <li>✅ Vert = Export réussi et fichier téléchargé</li>
            <li>❌ Rouge = Erreur (vérifiez les logs du navigateur)</li>
          </ol>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🔬 Détails Techniques</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>✅ <strong>PDF:</strong> Généré avec pdfkit, retourné en blob</li>
            <li>✅ <strong>Excel:</strong> Généré avec ExcelJS, retourné en blob</li>
            <li>✅ <strong>CSV:</strong> Généré avec json2csv, retourné en blob</li>
            <li>✅ <strong>Authentification:</strong> Tous les endpoints nécessitent JWT token</li>
            <li>✅ <strong>Blob Response:</strong> NO disk write - direct buffer download</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

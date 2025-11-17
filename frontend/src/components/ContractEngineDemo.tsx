import React, { useState } from 'react';
import {
  generateContract,
  parseTemplate,
  validateVariables,
  getEngine,
} from '../lib/contractEngine';

/**
 * ContractEngineDemo component
 * Demonstrates contract engine usage
 */
export function ContractEngineDemo(): React.ReactElement {
  const [template, setTemplate] = useState(`
CONTRAT DE LOCATION

Agence: {{akig.nom}}
RCCM: {{akig.rccm}}

Locataire: {{client.nom}}
Téléphone: {{client.tel}}
Adresse: {{client.adresse}}

Propriété: {{property.address}}
Loyer: {{contract.loyer}}
Durée: {{contract.duration}} mois
Début: {{contract.date_debut}}
Fin: {{contract.date_fin}}
  `);

  const [variables, setVariables] = useState({
    akig: {
      nom: 'AKIG',
      rccm: 'GC-KAL/072.037/2017',
    },
    client: {
      nom: 'TENSA STERENIHAST',
      tel: '+224 620 00 00 00',
      adresse: 'Matam, Conakry',
    },
    property: {
      address: 'Immeuble DIABY Nassouroulaye',
    },
    contract: {
      loyer: '7 390 000 GNF',
      duration: '12',
      date_debut: '01/11/2025',
      date_fin: '31/10/2026',
    },
  });

  const [result, setResult] = useState('');
  const [validation, setValidation] = useState<any>(null);

  const handleGenerate = (): void => {
    try {
      const generated = generateContract(template, variables);
      setResult(generated);

      const valid = validateVariables(template, variables);
      setValidation(valid);
    } catch (error) {
      setResult(`Error: ${String(error)}`);
    }
  };

  const handleParseVariables = (): void => {
    const { variables: vars } = parseTemplate(template);
    alert(`Variables found:\n${vars.join('\n')}`);
  };

  return (
    <div className="card max-w-4xl">
      <h2 className="text-2xl font-bold mb-4">Contract Engine Demo</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Template Input */}
        <div>
          <h3 className="font-semibold mb-2">Template</h3>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full h-64 p-3 border border-gray-300 rounded font-mono text-sm"
            placeholder="Enter template with {{variable}} placeholders"
          />
          <button
            onClick={handleParseVariables}
            className="mt-2 btn bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            📋 Parse Variables
          </button>
        </div>

        {/* Generated Result */}
        <div>
          <h3 className="font-semibold mb-2">Generated Contract</h3>
          <textarea
            value={result}
            readOnly
            className="w-full h-64 p-3 border border-gray-300 rounded font-mono text-sm bg-gray-50"
            placeholder="Generated contract will appear here"
          />
          {validation && (
            <div className="mt-2">
              {validation.valid ? (
                <div className="text-green-600 text-sm">✅ All variables valid</div>
              ) : (
                <div className="text-red-600 text-sm">
                  ❌ Missing: {validation.missing.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleGenerate}
          className="btn bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-medium"
        >
          ✓ Generate Contract
        </button>

        {result && (
          <button
            onClick={() => {
              const blob = new Blob([result], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `contract_${Date.now()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-medium"
          >
            📥 Download
          </button>
        )}
      </div>

      {/* Variables Summary */}
      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h3 className="font-semibold mb-2">Variables Context</h3>
        <pre className="text-sm overflow-auto max-h-40">
          {JSON.stringify(variables, null, 2)}
        </pre>
      </div>
    </div>
  );
}

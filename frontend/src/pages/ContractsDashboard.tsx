import React, { useState, useEffect } from 'react';
import { generateContract, parseTemplate, validateVariables } from '../lib/contractEngine';
import { uiLog } from '../lib/uilog';

interface Template {
  id: number;
  type: string;
  titre: string;
  contenu: string;
  version: string;
  actif: boolean;
}

interface ContractVariables {
  [key: string]: any;
}

const defaultVariables: ContractVariables = {
  akig: {
    nom: 'AKIG - Agence Kamoula Immobilière Guinée',
    rccm: 'GC-KAL/072.037/2017',
    adresse: 'Immeuble DIABY Nassouroulaye, Route de Prince, Ratoma, Conakry',
    email: 'aikg224@gmail.com',
    tel_pdg: '623.96.80.23',
    tel_dg: '626.95.42.63',
    tel_reception: '620.90.91.93',
    whatsapp: '620.90.91.93',
  },
  client: {
    nom: 'TENSA STERENIHAST',
    tel: '+224 620 00 00 00',
    adresse: 'Matam, Conakry',
    profession: 'Commerçant',
    cni: 'GN123456789',
    garant: 'Mamadou Diallo',
    revenu: '5 000 000 GNF',
  },
  contrat: {
    type: 'Appartement',
    loyer: '7 390 000 GNF',
    caution: '2 mois',
    date_debut: '01/11/2025',
    date_fin: '31/10/2026',
    periodicite: 'Trimestriel',
    mode_paiement: 'Orange Money',
  },
};

const contractTypes = [
  { value: 'location', label: 'Contrat de location' },
  { value: 'gerance', label: 'Contrat de gérance' },
  { value: 'audition', label: 'Audition client' },
  { value: 'reference', label: 'Référence locataire' },
];

/**
 * ContractsDashboard page
 * Main interface for contract generation and management
 */
export default function ContractsDashboard(): React.ReactElement {
  const [type, setType] = useState<string>('location');
  const [preview, setPreview] = useState<string>('');
  const [variables, setVariables] = useState<ContractVariables>(defaultVariables);
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validation, setValidation] = useState<any>(null);
  const [showVariables, setShowVariables] = useState(false);

  // Load template when type changes
  useEffect(() => {
    loadTemplate();
  }, [type]);

  const loadTemplate = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError('');
      uiLog('contract_template_load', { type });

      const response = await fetch(`/api/contract-templates/type/${type}`);

      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }

      const templates: Template[] = await response.json();

      if (templates.length === 0) {
        setError(`No active template found for type: ${type}`);
        setPreview('');
        setTemplate(null);
        return;
      }

      const selectedTemplate = templates[0]; // Get first active template
      setTemplate(selectedTemplate);

      // Generate preview
      generatePreview(selectedTemplate.contenu);

      uiLog('contract_template_loaded', { type, templateId: selectedTemplate.id });
    } catch (err) {
      const message = String(err);
      setError(message);
      uiLog('contract_template_error', { type, error: message });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreview = (templateContent: string): void => {
    try {
      // Validate variables
      const validation = validateVariables(templateContent, variables);
      setValidation(validation);

      // Generate content
      const content = generateContract(templateContent, variables);
      setPreview(content);

      uiLog('contract_generated', {
        type,
        valid: validation.valid,
        missingCount: validation.missing.length,
      });
    } catch (err) {
      setError(`Generation error: ${String(err)}`);
      uiLog('contract_generation_error', { type, error: String(err) });
    }
  };

  const handleGenerateClick = (): void => {
    if (template) {
      generatePreview(template.contenu);
    }
  };

  const handlePrint = (): void => {
    uiLog('contract_print', { type });

    const printWindow = window.open('', '', 'height=600,width=800');

    if (!printWindow) {
      setError('Failed to open print window');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Contract - ${type}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            line-height: 1.6;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #003366;
            padding-bottom: 15px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #003366;
          }
          .content {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${template?.titre || 'Contract'}</h1>
          <p>Generated on ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <div class="content">${preview}</div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadPdf = (): void => {
    uiLog('contract_download_pdf', { type });

    const blob = new Blob([preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `contrat_${type}_${Date.now()}.txt`;
    a.click();

    URL.revokeObjectURL(url);

    setError(''); // Clear any errors on success
  };

  const handleSendWhatsApp = (): void => {
    uiLog('contract_whatsapp_click', { type });

    const text = encodeURIComponent(preview);
    const whatsappUrl = `https://wa.me/?text=${text}`;

    window.open(whatsappUrl, '_blank');

    uiLog('contract_whatsapp_sent', { type });
  };

  const handleVariableChange = (
    section: string,
    field: string,
    value: string
  ): void => {
    setVariables({
      ...variables,
      [section]: {
        ...variables[section],
        [field]: value,
      },
    });

    uiLog('contract_variable_changed', { section, field });
  };

  const resetVariables = (): void => {
    setVariables(defaultVariables);
    uiLog('contract_variables_reset', {});
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="card mb-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">
                📄 Générateur de Contrats AKIG
              </h1>
              <p className="text-gray-600 mt-1">
                Générez rapidement des contrats professionnels
              </p>
            </div>
            {template && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Template v{template.version}</p>
                <p className="text-xs text-green-600">✅ Active</p>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="card bg-red-50 border-l-4 border-red-500 mb-6">
            <p className="text-red-700 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Validation Alert */}
        {validation && !validation.valid && (
          <div className="card bg-yellow-50 border-l-4 border-yellow-500 mb-6">
            <p className="text-yellow-700 font-medium">
              ⚠️ Variables manquantes: {validation.missing.join(', ')}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Template Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de contrat
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isLoading}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {contractTypes.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={handleGenerateClick}
                disabled={isLoading || !template}
                className="w-full btn bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400"
              >
                {isLoading ? '⟳ Chargement...' : '🔄 Générer'}
              </button>
            </div>

            {/* Toggle Variables */}
            <div className="flex items-end">
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="w-full btn bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                {showVariables ? '✕ Masquer variables' : '⚙️ Variables'}
              </button>
            </div>
          </div>
        </div>

        {/* Variables Editor */}
        {showVariables && (
          <div className="card mb-6 max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-4 text-lg">Éditer les Variables</h3>

            {/* Agency Variables */}
            <div className="mb-6">
              <h4 className="font-medium text-blue-600 mb-3">🏢 Informations Agence</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(variables.akig || {}).map(([key, value]) => (
                  <div key={`akig_${key}`}>
                    <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={String(value || '')}
                      onChange={(e) => handleVariableChange('akig', key, e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Client Variables */}
            <div className="mb-6">
              <h4 className="font-medium text-green-600 mb-3">👤 Informations Client</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(variables.client || {}).map(([key, value]) => (
                  <div key={`client_${key}`}>
                    <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={String(value || '')}
                      onChange={(e) => handleVariableChange('client', key, e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Contract Variables */}
            <div className="mb-6">
              <h4 className="font-medium text-purple-600 mb-3">📋 Détails Contrat</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(variables.contrat || {}).map(([key, value]) => (
                  <div key={`contrat_${key}`}>
                    <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={String(value || '')}
                      onChange={(e) => handleVariableChange('contrat', key, e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={resetVariables}
              className="btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
            >
              🔄 Réinitialiser
            </button>
          </div>
        )}

        {/* Preview */}
        <div className="card mb-6">
          <h3 className="font-semibold text-lg mb-3">Aperçu du Contrat</h3>
          <textarea
            value={preview}
            readOnly
            rows={20}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Le contrat généré s'affichera ici"
          />
        </div>

        {/* Actions */}
        <div className="card bg-blue-50">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePrint}
              disabled={!preview}
              className="btn bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400 flex items-center gap-2"
            >
              🖨️ Imprimer
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={!preview}
              className="btn bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400 flex items-center gap-2"
            >
              💾 Télécharger
            </button>

            <button
              onClick={handleSendWhatsApp}
              disabled={!preview}
              className="btn bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400 flex items-center gap-2"
            >
              💬 WhatsApp
            </button>

            <button
              onClick={loadTemplate}
              disabled={isLoading}
              className="btn bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400 flex items-center gap-2 ml-auto"
            >
              🔄 Recharger
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Document généré par AKIG - {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  );
}

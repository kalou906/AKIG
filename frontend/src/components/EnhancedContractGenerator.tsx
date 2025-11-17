import React, { useEffect, useState } from 'react';
import { generateContract } from '../lib/contractEngine';

/**
 * EnhancedContractGenerator Component
 * Generates rental/management contracts from templates with variable substitution
 * Uses contract data directly (simplified version for quick generation)
 *
 * Features:
 * - Support for multiple contract types: location, gerance, audition, reference
 * - Auto-fill variables from tenant/owner/site data
 * - Template rendering with variable substitution
 * - Export options: print, WhatsApp, PDF
 * - Real-time preview
 *
 * Props:
 * - type: 'location' | 'gerance' | 'audition' | 'reference'
 * - contractRecord: Tenant/contract data for variable substitution
 *
 * Usage:
 * <EnhancedContractGenerator
 *   type="location"
 *   contractRecord={{
 *     tenant_name: 'John Doe',
 *     tenant_phone: '+224612345678',
 *     site_name: 'Site A',
 *     owner_name: 'Owner Name',
 *     monthly_rent: 500000
 *   }}
 * />
 */
export function EnhancedContractGenerator({
  type = 'location',
  contractRecord,
}: {
  type?: 'location' | 'gerance' | 'audition' | 'reference';
  contractRecord?: any;
}) {
  const [template, setTemplate] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load default template
   */
  useEffect(() => {
    setLoading(true);
    setTemplate(getDefaultTemplate(type));
    setLoading(false);
  }, [type]);

  /**
   * Generate contract when template or record changes
   */
  useEffect(() => {
    if (!template || !contractRecord) {
      setContent('');
      return;
    }

    try {
      // Prepare variables for substitution
      const variables = {
        akig: {
          nom: 'Agence Kamoula Immobilière Guinée',
          rccm: 'GC-KAL/072.037/2017',
          adresse: 'Immeuble DIABY Nassouroulaye, Route de Prince, Ratoma, Conakry',
          email: 'aikg224@gmail.com',
          tel_pdg: '+224 623 96 80 23',
          whatsapp: '+224 620 90 91 93',
          code_marchand: '466673',
          compte_banque: '00432425111142669000',
          rib: '37',
        },
        client: {
          nom: contractRecord.tenant_name || '—',
          tel: contractRecord.tenant_phone || '—',
          site: contractRecord.site_name || '—',
          owner: contractRecord.owner_name || '—',
        },
        contract: {
          loyer: contractRecord.monthly_rent
            ? `${Intl.NumberFormat('fr-GN').format(Number(contractRecord.monthly_rent))} GNF`
            : '—',
          periodicity: contractRecord.periodicity || 'monthly',
          start_date: new Date().toLocaleDateString('fr-GN'),
          end_date: '—',
          ref: contractRecord.ref || '—',
          mode_paiement: 'Orange Money',
        },
      };

      // Generate contract content
      const generated = generateContract(template, variables);
      setContent(generated);
      setError(null);
    } catch (err: any) {
      console.error('Contract generation error:', err);
      setError(err.message || 'Erreur lors de la génération du contrat');
      setContent('');
    }
  }, [template, contractRecord]);

  /**
   * Print contract
   */
  function handlePrint() {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(
        `<html><head><title>Contrat</title></head><body><pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${escapeHtml(content)}</pre></body></html>`
      );
      printWindow.document.close();
      printWindow.print();
    }
  }

  /**
   * Export as PDF
   */
  function handlePDF() {
    const element = document.createElement('div');
    element.style.whiteSpace = 'pre-wrap';
    element.style.fontFamily = 'monospace';
    element.style.padding = '20px';
    element.textContent = content;
    document.body.appendChild(element);
    window.print();
    document.body.removeChild(element);
  }

  /**
   * Send via WhatsApp
   */
  function handleWhatsApp() {
    const phone = contractRecord?.tenant_phone || '';
    if (!phone) {
      alert('Numéro de téléphone non disponible');
      return;
    }

    // Prepare message (first 100 chars of contract)
    const message = encodeURIComponent(
      `Contrat de location\n\n${content.substring(0, 100)}...\n\nVeuillez confirmer réception.`
    );
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  return (
    <div className="card space-y-4">
      {/* Header with Controls */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-lg font-semibold">
            Contrat - <span className="uppercase text-blue-600">{type}</span>
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            {contractRecord?.tenant_name || 'Nouveau contrat'}
            {contractRecord?.site_name && ` • ${contractRecord.site_name}`}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
            onClick={handlePrint}
            title="Imprimer"
          >
            🖨️ Imprimer
          </button>
          <button
            className="flex items-center gap-1 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded transition"
            onClick={handleWhatsApp}
            title="Envoyer par WhatsApp"
            disabled={!contractRecord?.tenant_phone}
          >
            💬 WhatsApp
          </button>
          <button
            className="flex items-center gap-1 px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
            onClick={handlePDF}
            title="Télécharger en PDF"
          >
            📄 PDF
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded bg-red-50 text-red-800 border border-red-200 text-sm">
          ✗ {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center text-gray-500">
          <div className="animate-spin inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <div>Chargement du modèle...</div>
        </div>
      )}

      {/* Contract Content */}
      {!loading && content && (
        <div className="space-y-2">
          <textarea
            className="w-full border border-gray-300 rounded px-4 py-3 font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={22}
            value={content}
            readOnly
          />
          <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
            📋 {content.length} caractères • {content.split('\n').length} lignes
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !content && !error && (
        <div className="p-8 text-center text-gray-500">
          <div className="text-3xl mb-2">📄</div>
          <div>Aucun contrat à afficher</div>
          <div className="text-xs mt-2">Sélectionnez un locataire pour générer un contrat</div>
        </div>
      )}
    </div>
  );
}

/**
 * Get default template for contract type
 */
function getDefaultTemplate(type: string): string {
  const templates: Record<string, string> = {
    location: `CONTRAT DE LOCATION IMMOBILIÈRE

Agence: {{akig.nom}}
RCCM: {{akig.rccm}}
Adresse: {{akig.adresse}}
Tel: {{akig.tel_pdg}}
Email: {{akig.email}}

================================================================================
PARTIES

BAILLEUR: {{client.owner}}
Représenté par: {{akig.nom}}

PRENEUR: {{client.nom}}
Téléphone: {{client.tel}}

================================================================================
BIEN LOUE

Immeuble/Site: {{client.site}}
Type: Appartement/Bureau
Adresse: {{client.site}}

================================================================================
CONDITIONS DE LOCATION

Loyer mensuel: {{contract.loyer}}
Périodicité: {{contract.periodicity}}
Debut: {{contract.start_date}}
Modalité paiement: {{contract.mode_paiement}}

Code marchand (Orange Money): {{akig.code_marchand}}
RIB: {{akig.compte_banque}}

================================================================================
OBLIGATIONS DU PRENEUR

1. Payer le loyer avant le 5 de chaque mois
2. Maintenir le bien en bon état
3. Respecter les règles de la copropriété
4. Notifier le bailleur de tout problème

================================================================================
OBLIGATIONS DU BAILLEUR

1. Assurer la jouissance paisible du bien
2. Effectuer les réparations de structure
3. Fournir les services convenus

================================================================================
RESOLUTION

En cas de non-paiement après 30 jours, le bailleur peut:
- Envoyer une mise en demeure
- Initier une procédure de résiliation
- Recourir à voie de justice

================================================================================

Fait le: {{contract.start_date}}

Bailleur: _____________________
         {{client.owner}}

Preneur: _____________________
        {{client.nom}}

Agence AKIG: _____________________
            {{akig.nom}}
`,

    gerance: `CONTRAT DE GERANCE DE BIEN IMMOBILIER

Agence: {{akig.nom}}
RCCM: {{akig.rccm}}

Mandataire: {{akig.nom}}
Propriétaire: {{client.owner}}

BIEN: {{client.site}}
Loyer géré: {{contract.loyer}}
Début: {{contract.start_date}}

Commission d'agence: 7% du loyer HT/mois

Services inclus:
- Gestion des locations
- Suivi des paiements
- Maintenance
- Comptabilité

Paiement à {{akig.code_marchand}} - Orange Money
`,

    audition: `RAPPORT D'AUDIT / INSPECTION

Site: {{client.site}}
Date: {{contract.start_date}}
Inspecteur: {{akig.nom}}

Locataire: {{client.nom}}
Propriétaire: {{client.owner}}

CONSTATATIONS:
- État général: À inspecter
- Dégâts éventuels: À documenter
- Besoins de maintenance: À lister

RECOMMANDATIONS:
À remplir lors de l'inspection

Signé: __________________
Date: {{contract.start_date}}
`,

    reference: `LETTRE DE REFERENCE LOCATAIRE

De: {{akig.nom}}
Date: {{contract.start_date}}

A l'attention de:

Nous certifions que {{client.nom}} a été locataire chez nous à {{client.site}}.

Période: Du {{contract.start_date}} au {{contract.end_date}}
Loyer: {{contract.loyer}}/mois
Statut des paiements: À jour ✓

Le locataire s'est montré:
- Respectueux des règles
- Paiements réguliers
- Bien entretien des lieux

Nous recommandons vivement ce locataire.

Agence AKIG
{{akig.tel_pdg}}
{{akig.email}}
`,
  };

  return templates[type] || templates['location'];
}

/**
 * Escape HTML characters for display in print window
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

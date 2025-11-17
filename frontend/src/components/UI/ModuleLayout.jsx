/**
 * ModuleLayout.jsx - Layout réutilisable pour tous les modules
 * Onglets + documentation intégrée
 */

import React, { useState } from 'react';
import Tabs from './Tabs';
import './ModuleLayout.css';

export default function ModuleLayout({ title, tabs, docTopic = '' }) {
    const [activeTab, setActiveTab] = useState(0);

    // Documentation contextuelle par module
    const docs = {
        proprietes: 'Upload du titre foncier, photos claires, quartier et repères obligatoires. Suivez l\'état de la propriété.',
        contrats: 'Vérifiez clauses: préavis (30/60j), dépôt garanti, charges. Historisez chaque avenant.',
        locataires: 'Scannez la CNI, renseignez le garant. Consultez la probabilité IA pour anticiper les impayés.',
        proprietaires: 'Gérez portefeuille, relevés, versements. Visualisez revenus nets et frais déduits.',
        paiements: 'Chaque paiement doit avoir une référence unique. Génération automatique des reçus.',
        recouvrement: 'Séquence automatique: SMS J+3, WhatsApp J+7, Appel J+10. Proposer échéancier à J+15.',
        agents: 'Fixez objectifs mensuels. Suivez encaissements et retards. Récompensez top performers.',
        utilisateurs: 'Gestion des rôles (Agent, Manager, Admin, Comptable). Activation MFA obligatoire en production.',
        maintenance: 'Tickets, planification, prestataires. Suivi des coûts et équipements.',
        litiges: 'Contestations, médiation, arbitrage. Archive des décisions.',
        crm: 'Prospects, pipeline, visites. Multi-diffusion annonces (Facebook, Jumia).',
        reporting: 'Comparez 1m, 3m, 6m, 12m. Suivez net, vacance, ROI par bien et par zone.',
        ia: 'Prévisions paiement par locataire. Explicabilité des scores et actions prescrites.',
    };

    const docText = docs[docTopic] || 'Documentation du module';

    return (
        <div className="module-layout">
            <div className="module-header">
                <h1>{title}</h1>
            </div>

            <div className="module-container">
                <div className="module-main">
                    <Tabs tabs={tabs} onChange={(idx) => setActiveTab(idx)} />
                </div>

                <aside className="module-doc">
                    <h4>📖 Documentation</h4>
                    <p>{docText}</p>
                    {activeTab !== undefined && (
                        <div className="doc-active-tab">
                            <strong>Onglet actif:</strong> {tabs[activeTab]?.label}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

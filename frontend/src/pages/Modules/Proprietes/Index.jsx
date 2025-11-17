/**
 * Proprietes/Index.jsx - Module Propriétés avec 5 onglets
 * Onglets: Fiche, Documents, Diagnostics, Historique, Finance
 */

import React, { useState, useEffect } from 'react';
import ModuleLayout from '../../../components/UI/ModuleLayout';
import Card from '../../../components/UI/Card';
import DataTable from '../../../components/UI/DataTable';
import Button from '../../../components/UI/Button';

// Onglets
function FicheTab() {
    return (
        <Card title="Fiche Propriété" icon="🏠">
            <p>Type, quartier, repères, photos, statut.</p>
            <p>💡 Assurez l'upload du titre foncier et photos claires.</p>
        </Card>
    );
}

function DocumentsTab() {
    return (
        <Card title="Documents">
            <p>Titre foncier, bail, attestations, quittances scannées.</p>
            <DataTable
                headers={[
                    { key: 'nom', label: 'Nom' },
                    { key: 'type', label: 'Type' },
                    { key: 'date', label: 'Date' },
                ]}
                rows={[]}
                empty="Aucun document trouvé"
            />
        </Card>
    );
}

function DiagnosticsTab() {
    return (
        <Card title="Diagnostics">
            <p>Habitable, sécurité, relevés.</p>
            <p>État général de la propriété.</p>
        </Card>
    );
}

function HistoriqueTab() {
    return (
        <Card title="Historique">
            <p>Locataires, incidents, interventions, modifications.</p>
            <DataTable
                headers={[
                    { key: 'date', label: 'Date' },
                    { key: 'type', label: 'Type' },
                    { key: 'description', label: 'Description' },
                ]}
                rows={[]}
                empty="Aucun historique"
            />
        </Card>
    );
}

function FinanceTab() {
    return (
        <Card title="Finance Propriété">
            <p>Revenu net, coûts maintenance, vacance.</p>
            <DataTable
                headers={[
                    { key: 'mois', label: 'Mois' },
                    { key: 'revenu', label: 'Revenu' },
                    { key: 'couts', label: 'Coûts' },
                    { key: 'net', label: 'Net' },
                ]}
                rows={[]}
                empty="Aucune donnée financière"
            />
        </Card>
    );
}

export default function ProprietesIndex() {
    const tabs = [
        { label: 'Fiche', icon: '📋', content: <FicheTab /> },
        { label: 'Documents', icon: '📁', content: <DocumentsTab /> },
        { label: 'Diagnostics', icon: '✓', content: <DiagnosticsTab /> },
        { label: 'Historique', icon: '📜', content: <HistoriqueTab /> },
        { label: 'Finance', icon: '💰', content: <FinanceTab /> },
    ];

    return <ModuleLayout title="Propriétés" tabs={tabs} docTopic="proprietes" />;
}

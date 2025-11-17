/**
 * Contrats/Index.jsx - Module Contrats
 * Onglets: Détails, Clauses, Avenants, Échéances, Documents
 */

import React from 'react';
import ModuleLayout from '../../../components/UI/ModuleLayout';
import Card from '../../../components/UI/Card';
import DataTable from '../../../components/UI/DataTable';

function DetailsTab() {
    return (
        <Card title="Détails Contrat" icon="📜">
            <p>Dates, durée, dépôt, clauses principales.</p>
            <p>💡 Vérifiez clauses: préavis (30/60j), dépôt garanti, charges.</p>
        </Card>
    );
}

function ClausesTab() {
    return (
        <Card title="Clauses">
            <p>Préavis, charges, reconduction, conditions spéciales.</p>
        </Card>
    );
}

function AvenantsTab() {
    return (
        <Card title="Avenants">
            <p>Historique des modifications du contrat.</p>
            <DataTable
                headers={[
                    { key: 'date', label: 'Date' },
                    { key: 'type', label: 'Type' },
                    { key: 'description', label: 'Description' },
                ]}
                rows={[]}
                empty="Aucun avenant"
            />
        </Card>
    );
}

function EcheancesTab() {
    return (
        <Card title="Échéances">
            <p>Loyers, dépôts, renouvellements prévus.</p>
        </Card>
    );
}

function DocumentsTab() {
    return (
        <Card title="Documents">
            <p>PDF signé, annexes, preuves.</p>
        </Card>
    );
}

export default function ContratsIndex() {
    const tabs = [
        { label: 'Détails', icon: '📋', content: <DetailsTab /> },
        { label: 'Clauses', icon: '📝', content: <ClausesTab /> },
        { label: 'Avenants', icon: '✏️', content: <AvenantsTab /> },
        { label: 'Échéances', icon: '📅', content: <EcheancesTab /> },
        { label: 'Documents', icon: '📁', content: <DocumentsTab /> },
    ];

    return <ModuleLayout title="Contrats" tabs={tabs} docTopic="contrats" />;
}

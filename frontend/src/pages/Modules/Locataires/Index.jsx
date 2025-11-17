/**
 * Locataires/Index.jsx - Module Locataires avec 5 onglets
 * Onglets: Profil, Paiements, Incidents, IA Prévision, Communication
 */

import React from 'react';
import ModuleLayout from '../../../components/UI/ModuleLayout';
import Card from '../../../components/UI/Card';
import DataTable from '../../../components/UI/DataTable';

function ProfilTab() {
    return (
        <Card title="Profil Locataire" icon="👤">
            <p>Identité, garant, contacts, scoring.</p>
            <p>📋 Scannez la CNI et renseignez le garant.</p>
        </Card>
    );
}

function PaiementsTab() {
    return (
        <Card title="Paiements">
            <p>Échéancier, statuts, méthodes, retards.</p>
            <DataTable
                headers={[
                    { key: 'date', label: 'Échéance' },
                    { key: 'montant', label: 'Montant' },
                    { key: 'statut', label: 'Statut' },
                    { key: 'methode', label: 'Méthode' },
                ]}
                rows={[]}
                empty="Aucun paiement"
            />
        </Card>
    );
}

function IncidentsTab() {
    return (
        <Card title="Incidents">
            <p>Litiges, plaintes, interventions.</p>
            <DataTable
                headers={[
                    { key: 'date', label: 'Date' },
                    { key: 'type', label: 'Type' },
                    { key: 'description', label: 'Description' },
                ]}
                rows={[]}
                empty="Aucun incident enregistré"
            />
        </Card>
    );
}

function IAPrevisionTab() {
    return (
        <Card title="IA Prévision Paiement" icon="🤖">
            <div style={{ padding: '12px', background: '#EFF6FF', borderRadius: '6px', marginBottom: '12px' }}>
                <strong>Probabilité de paiement:</strong> Calcul en cours...
            </div>
            <p>💡 Consultez la probabilité IA pour anticiper les impayés.</p>
            <p>Actions recommandées s'affichent ici.</p>
        </Card>
    );
}

function CommunicationTab() {
    return (
        <Card title="Communication">
            <p>SMS, WhatsApp, emails envoyés.</p>
            <DataTable
                headers={[
                    { key: 'date', label: 'Date' },
                    { key: 'canal', label: 'Canal' },
                    { key: 'contenu', label: 'Contenu' },
                ]}
                rows={[]}
                empty="Aucun message enregistré"
            />
        </Card>
    );
}

export default function LocatairesIndex() {
    const tabs = [
        { label: 'Profil', icon: '👤', content: <ProfilTab /> },
        { label: 'Paiements', icon: '💳', content: <PaiementsTab /> },
        { label: 'Incidents', icon: '⚠️', content: <IncidentsTab /> },
        { label: 'IA Prévision', icon: '🤖', content: <IAPrevisionTab /> },
        { label: 'Communication', icon: '💬', content: <CommunicationTab /> },
    ];

    return <ModuleLayout title="Locataires" tabs={tabs} docTopic="locataires" />;
}

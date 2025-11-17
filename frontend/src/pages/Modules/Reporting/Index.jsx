/**
 * Reporting/Index.jsx - Module Reporting avec 4 onglets
 * Onglets: Finance, KPI, Tendances, Exports
 */

import React, { useState } from 'react';
import ModuleLayout from '../../../components/UI/ModuleLayout';
import Card from '../../../components/UI/Card';
import DataTable from '../../../components/UI/DataTable';
import Button from '../../../components/UI/Button';

function FinanceTab() {
    const [range, setRange] = useState('1m');

    return (
        <div>
            <Card title="Dashboard Financier" icon="💰">
                <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                    {['1m', '3m', '6m', '12m'].map(r => (
                        <Button
                            key={r}
                            type={range === r ? 'primary' : 'secondary'}
                            onClick={() => setRange(r)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                            {r}
                        </Button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Encaissements</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>0 GNF</div>
                    </div>
                    <div style={{ background: '#FEF2F2', padding: '12px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Coûts</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#DC2626' }}>0 GNF</div>
                    </div>
                    <div style={{ background: '#F0FDF4', padding: '12px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Net</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E40AF' }}>0 GNF</div>
                    </div>
                </div>

                <p>💡 Comparez 1m, 3m, 6m, 12m. Suivez net, vacance, ROI par bien et par zone.</p>
            </Card>
        </div>
    );
}

function KPITab() {
    return (
        <Card title="KPI Métier" icon="📊">
            <DataTable
                headers={[
                    { key: 'kpi', label: 'KPI' },
                    { key: 'valeur', label: 'Valeur' },
                    { key: 'tendance', label: 'Tendance' },
                ]}
                rows={[
                    { kpi: 'Taux de vacance', valeur: '5%', tendance: '↓' },
                    { kpi: 'Cash-flow', valeur: '1.2M GNF', tendance: '↑' },
                    { kpi: 'Taux d\'impayés', valeur: '8%', tendance: '→' },
                    { kpi: 'Performance agents', valeur: '92%', tendance: '↑' },
                ]}
            />
        </Card>
    );
}

function TendancesTab() {
    return (
        <Card title="Tendances et Projections" icon="📈">
            <p>Graphiques d'évolution sur 12 derniers mois.</p>
            <p>Projection 6 mois (optimiste, réaliste, pessimiste).</p>
        </Card>
    );
}

function ExportsTab() {
    return (
        <Card title="Exports" icon="📥">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button type="primary">
                    📊 Exporter Excel
                </Button>
                <Button type="secondary">
                    📄 Exporter PDF
                </Button>
                <Button type="secondary">
                    💼 Exporter SAGE
                </Button>
            </div>
            <p style={{ marginTop: '16px', fontSize: '13px', color: '#6B7280' }}>
                Formats compatibles: Excel, PDF, SAGE comptable.
            </p>
        </Card>
    );
}

export default function ReportingIndex() {
    const tabs = [
        { label: 'Finance', icon: '💰', content: <FinanceTab /> },
        { label: 'KPI', icon: '📊', content: <KPITab /> },
        { label: 'Tendances', icon: '📈', content: <TendancesTab /> },
        { label: 'Exports', icon: '📥', content: <ExportsTab /> },
    ];

    return <ModuleLayout title="Reporting & Finance" tabs={tabs} docTopic="reporting" />;
}

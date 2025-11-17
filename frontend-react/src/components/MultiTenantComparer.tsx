// frontend-react/src/components/MultiTenantComparer.tsx
/**
 * Comparateur Multi-Tenants
 * Permet d'afficher plusieurs cartes de solvabilité côte à côte
 */
import React, { useState } from 'react';
import { Button, Input, Space, Row, Col, Card, Empty, Spin } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';

// Mock TenantCard - À remplacer par le vrai composant
interface SolvencyScore {
    tenant_id: string;
    risk_level: string;
    payment_probability: number;
    badge: string;
}

const MockTenantCard: React.FC<{ score: SolvencyScore }> = ({ score }) => (
    <Card
        title={score.tenant_id}
        size="small"
        style={{ marginBottom: 16 }}
    >
        <p>Risk: {score.badge} {score.risk_level}</p>
        <p>Probability: {(score.payment_probability * 100).toFixed(0)}%</p>
    </Card>
);

// Mock hook - À remplacer par le vrai hook
const useSolvencyScore = (tenantId: string) => {
    return {
        data: {
            tenant_id: tenantId,
            risk_level: 'GOOD',
            payment_probability: 0.75,
            badge: '🟡',
        } as SolvencyScore,
        isLoading: false,
        error: null,
    };
};

const TenantLoader: React.FC<{ tenantId: string; onRemove: () => void }> = ({ tenantId, onRemove }) => {
    const { data: score, isLoading, error } = useSolvencyScore(tenantId);

    if (isLoading) {
        return (
            <Card style={{ marginBottom: 16 }}>
                <Spin tip="Chargement..." />
            </Card>
        );
    }

    if (error || !score) {
        return (
            <Card
                title={tenantId}
                size="small"
                style={{ marginBottom: 16 }}
                extra={
                    <Button
                        type="text"
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={onRemove}
                    />
                }
            >
                <Empty description="Impossible de charger les données" />
            </Card>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                }}
                onClick={onRemove}
            />
            <MockTenantCard score={score} />
        </div>
    );
};

export const MultiTenantComparer: React.FC = () => {
    const [tenantIds, setTenantIds] = useState<string[]>(['demo-tenant-1']);
    const [inputValue, setInputValue] = useState('');
    const [inputError, setInputError] = useState('');

    const addTenant = () => {
        setInputError('');

        if (!inputValue.trim()) {
            setInputError('Veuillez entrer un Tenant ID');
            return;
        }

        if (tenantIds.includes(inputValue)) {
            setInputError('Ce tenant est déjà affiché');
            return;
        }

        if (tenantIds.length >= 6) {
            setInputError('Maximum 6 tenants simultanés');
            return;
        }

        setTenantIds([...tenantIds, inputValue.trim()]);
        setInputValue('');
    };

    const removeTenant = (id: string) => {
        setTenantIds(tenantIds.filter((t) => t !== id));
    };

    return (
        <div>
            <Card
                title="🔍 Comparateur Multi-Tenants"
                style={{ marginBottom: 24 }}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space.Compact style={{ width: '100%' }}>
                        <Input
                            placeholder="Entrer un Tenant ID (ex: demo-tenant-2)"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setInputError('');
                            }}
                            onPressEnter={addTenant}
                            status={inputError ? 'error' : ''}
                            disabled={tenantIds.length >= 6}
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={addTenant}
                            disabled={tenantIds.length >= 6}
                        >
                            Ajouter
                        </Button>
                    </Space.Compact>

                    {inputError && (
                        <div style={{ color: '#ff4d4f', fontSize: 12 }}>
                            {inputError}
                        </div>
                    )}

                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                        {tenantIds.length}/6 tenants affichés
                    </div>
                </Space>
            </Card>

            {tenantIds.length === 0 ? (
                <Empty description="Aucun tenant sélectionné" />
            ) : (
                <Row gutter={[16, 16]}>
                    {tenantIds.map((id) => (
                        <Col key={id} xs={24} sm={12} lg={8} xl={6}>
                            <TenantLoader
                                tenantId={id}
                                onRemove={() => removeTenant(id)}
                            />
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default MultiTenantComparer;

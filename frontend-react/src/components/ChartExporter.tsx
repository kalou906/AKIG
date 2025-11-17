// frontend-react/src/components/ChartExporter.tsx
/**
 * Wrapper pour exporter des graphiques en PNG/JPEG
 * Ajoute un bouton d'export au-dessus du chart
 */
import React, { ReactNode } from 'react';
import { Button, Dropdown, MenuProps, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useChartExport } from '../hooks/useChartExport';

interface ChartExporterProps {
    children: ReactNode;
    filename?: string;
    showButton?: boolean;
    buttonText?: string;
}

export const ChartExporter: React.FC<ChartExporterProps> = ({
    children,
    filename = 'solvency-chart',
    showButton = true,
    buttonText = 'Exporter',
}) => {
    const { exportRef, exportToPNG, exportToJPEG } = useChartExport();

    const handleExportPNG = async () => {
        try {
            await exportToPNG(filename);
            message.success('Graphique exporté en PNG');
        } catch (error) {
            message.error('Erreur lors de l\'export');
        }
    };

    const handleExportJPEG = async () => {
        try {
            await exportToJPEG(filename);
            message.success('Graphique exporté en JPEG');
        } catch (error) {
            message.error('Erreur lors de l\'export');
        }
    };

    const menuItems: MenuProps['items'] = [
        {
            key: 'png',
            label: 'Exporter en PNG',
            onClick: handleExportPNG,
        },
        {
            key: 'jpeg',
            label: 'Exporter en JPEG',
            onClick: handleExportJPEG,
        },
    ];

    return (
        <div style={{ position: 'relative' }}>
            {showButton && (
                <div style={{ textAlign: 'right', marginBottom: 8 }}>
                    <Dropdown menu={{ items: menuItems }} placement="bottomRight">
                        <Button icon={<DownloadOutlined />} size="small">
                            {buttonText}
                        </Button>
                    </Dropdown>
                </div>
            )}

            <div ref={exportRef} style={{ padding: 16, backgroundColor: '#fff' }}>
                {children}
            </div>
        </div>
    );
};

export default ChartExporter;

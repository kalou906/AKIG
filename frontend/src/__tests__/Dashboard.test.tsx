// Mock API client modules used in Dashboard
jest.mock('../api/client', () => ({
    Reports: {
        summary: jest.fn(async () => ({
            total_tenants: 10,
            total_rent: 100000,
            total_paid: 60000,
            total_overdue: 40000,
            payment_rate: 0.6,
            tenants_up_to_date: 7,
            tenants_overdue: 3,
        })),
        monthlyPayments: jest.fn(async () => ({ stats: [] })),
        topOverdue: jest.fn(async () => ({ items: [] })),
        topPayers: jest.fn(async () => ({ items: [] })),
    },
    Metrics: {
        getOccupancyRate: jest.fn(() => Promise.resolve(0.85)),
    },
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../pages/Dashboard';

describe('Dashboard smoke test', () => {
    test('renders KPIs and controls', async () => {
        const Dashboard = (await import('../pages/Dashboard')).default;
        render(<Dashboard />);

        // Title
        expect(await screen.findByText(/Vue d'ensemble de votre activité/i)).toBeInTheDocument();

        // KPI labels
        const locataires = await screen.findAllByText(/locataires/i);
        expect(locataires.length).toBeGreaterThan(0);
        expect(await screen.findByText(/Taux Recouvrement/i)).toBeInTheDocument();

        // Year select present
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
});

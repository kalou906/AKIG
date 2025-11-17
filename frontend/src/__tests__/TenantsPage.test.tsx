import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TenantsPage from '../pages/TenantsPage';

// Mock useQuery to return sample data immediately
jest.mock('../hooks/useQuery', () => ({
    useQuery: () => ({
        data: { items: [{ id: 1, full_name: 'John Doe', phone: '123', site: 'Alpha' }] },
        loading: false,
        error: null,
    })
}));

describe('TenantsPage smoke test', () => {
    test('renders tenants table and export buttons', () => {
        render(<TenantsPage />);
        expect(screen.getByText(/Locataires/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export PDF/i })).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
});

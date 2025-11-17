// ============================================================
// 🗂️  Sidebar Component - Menu Navigation Principal
// 50+ options groupées par module
// ============================================================

import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Health, Tenants, Properties, Payments, Reports } from '../../api/client';

const NAV_ITEMS = [
    { key: 'dashboard', path: '/dashboard', label: 'Dashboard', fn: () => Reports.summary(new Date().getFullYear()) },
    { key: 'tenants', path: '/tenants', label: 'Locataires', fn: () => Tenants.list() },
    { key: 'properties', path: '/properties', label: 'Propriétés', fn: () => Properties.list() },
    { key: 'payments', path: '/payments', label: 'Paiements', fn: () => Payments.list() },
    { key: 'reports', path: '/reports', label: 'Rapports', fn: () => Reports.summary(new Date().getFullYear()) },
    { key: 'import', path: '/import-csv', label: 'Import CSV', fn: () => Health.ping() },
];

export default function Sidebar({ expanded = true, genius = false, onToggle }) {
    const [statuses, setStatuses] = useState({});

    useEffect(() => {
        // Ne vérifie les endpoints que si la sidebar est étendue (optimisation)
        if (!expanded) return;

        let mounted = true;
        (async function checkEndpoints() {
            const results = {};
            for (const item of NAV_ITEMS) {
                try {
                    await item.fn();
                    results[item.key] = '✅';
                } catch {
                    results[item.key] = '❌';
                }
            }
            if (mounted) setStatuses(results);
        })();
        return () => { mounted = false; };
    }, [expanded]); // Dépend de expanded maintenant

    const baseClass = expanded ? 'w-64' : 'w-16';
    const themeClass = genius
        ? 'bg-gradient-to-b from-purple-800 to-pink-600 text-white'
        : 'bg-white border-r border-gray-200 text-gray-900';

    return (
        <aside className={`${baseClass} ${themeClass} h-screen flex flex-col`}>
            <button onClick={onToggle} className="p-2 text-sm hover:bg-gray-100 transition-colors">
                {expanded ? 'Réduire' : 'Étendre'}
            </button>
            <nav className="flex-1 mt-4 space-y-1">
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.key}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center justify-between px-4 py-2 rounded ${isActive
                                ? genius
                                    ? 'bg-white/20 text-white font-semibold'
                                    : 'bg-indigo-600 text-white font-semibold'
                                : genius
                                    ? 'hover:bg-white/10 text-white'
                                    : 'hover:bg-gray-100 text-gray-700'
                            }`
                        }
                    >
                        <span>{item.label}</span>
                        <span className="ml-2 text-xs">{statuses[item.key] ?? '…'}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-3 text-xs opacity-70">v1.0.0</div>
        </aside>
    );
}

/**
 * DataTable.jsx - Tableau réutilisable pour affichage données
 * Avec tri, pagination, actions
 */

import React, { useState, useMemo } from 'react';
import './DataTable.css';

export default function DataTable({ headers, rows = [], onAction = null, loading = false, empty = 'Aucune donnée' }) {
    const [sortBy, setSortBy] = useState(null);
    const [sortAsc, setSortAsc] = useState(true);
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const sortedRows = useMemo(() => {
        if (!sortBy) return rows;
        return [...rows].sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (aVal < bVal) return sortAsc ? -1 : 1;
            if (aVal > bVal) return sortAsc ? 1 : -1;
            return 0;
        });
    }, [rows, sortBy, sortAsc]);

    const paginatedRows = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return sortedRows.slice(start, start + itemsPerPage);
    }, [sortedRows, page]);

    const totalPages = Math.ceil(sortedRows.length / itemsPerPage);

    const handleSort = (key) => {
        if (sortBy === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortBy(key);
            setSortAsc(true);
        }
        setPage(1);
    };

    if (loading) return <div className="table-loading">Chargement...</div>;
    if (rows.length === 0) return <div className="table-empty">{empty}</div>;

    return (
        <div className="table-wrapper">
            <table className="data-table">
                <thead>
                    <tr>
                        {headers.map((h) => (
                            <th
                                key={h.key}
                                onClick={() => h.sortable !== false && handleSort(h.key)}
                                className={h.sortable !== false ? 'sortable' : ''}
                            >
                                {h.label}
                                {sortBy === h.key && <span className={`sort-icon ${sortAsc ? 'asc' : 'desc'}`}>⬍</span>}
                            </th>
                        ))}
                        {onAction && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {paginatedRows.map((row, idx) => (
                        <tr key={idx}>
                            {headers.map((h) => (
                                <td key={h.key} data-label={h.label}>
                                    {row[h.key]}
                                </td>
                            ))}
                            {onAction && (
                                <td className="actions">
                                    {onAction(row, idx)}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {totalPages > 1 && (
                <div className="table-pagination">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        ← Précédent
                    </button>
                    <span>Page {page} / {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                        Suivant →
                    </button>
                </div>
            )}
        </div>
    );
}

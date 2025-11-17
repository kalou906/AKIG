// ============================================================
// 📊 Table Component - Reusable Data Table with Sorting
// ============================================================

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronUp, ChevronDown } from 'lucide-react';

const Table = ({
    columns,
    data,
    onRowClick,
    sortable = true,
    striped = true,
    hoverable = true,
    compact = false,
    className = '',
    headerClassName = '',
    rowClassName = '',
    emptyMessage = 'Aucune donnée'
}) => {
    const [sortConfig, setSortConfig] = useState(null);

    // Handle sorting
    const handleSort = (columnKey) => {
        if (!sortable || !columns.find(col => col.key === columnKey)?.sortable) return;

        if (sortConfig?.key === columnKey) {
            setSortConfig({
                key: columnKey,
                direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
            });
        } else {
            setSortConfig({ key: columnKey, direction: 'asc' });
        }
    };

    // Sort data
    let sortedData = [...data];
    if (sortConfig) {
        sortedData.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    const padding = compact ? 'px-3 py-2' : 'px-6 py-3';
    const hoverClass = hoverable ? 'hover:bg-gray-50 transition-colors' : '';

    return (
        <div className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
            <table className="w-full text-left text-sm">
                {/* Header */}
                <thead className={`bg-gray-50 border-b border-gray-200 ${headerClassName}`}>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`${padding} font-semibold text-gray-900 ${column.sortable && sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''}`}
                                onClick={() => column.sortable && sortable && handleSort(column.key)}
                                width={column.width}
                            >
                                <div className="flex items-center gap-2">
                                    {column.label}
                                    {column.sortable && sortable && (
                                        <div className="w-4 h-4 text-gray-400">
                                            {sortConfig?.key === column.key ? (
                                                sortConfig.direction === 'asc' ? (
                                                    <ChevronUp size={16} />
                                                ) : (
                                                    <ChevronDown size={16} />
                                                )
                                            ) : (
                                                <span className="opacity-0 group-hover:opacity-100">⇕</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Body */}
                <tbody>
                    {sortedData.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className={`${padding} text-center text-gray-500`}>
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        sortedData.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={`border-b border-gray-200 ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white'} ${hoverClass} ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName}`}
                                onClick={() => onRowClick?.(row)}
                            >
                                {columns.map((column) => (
                                    <td key={column.key} className={`${padding} text-gray-900`}>
                                        {column.render
                                            ? column.render(row[column.key], row)
                                            : row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Footer */}
            {sortedData.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                    {sortedData.length} entrée{sortedData.length > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

Table.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        sortable: PropTypes.bool,
        width: PropTypes.string,
        render: PropTypes.func
    })).isRequired,
    data: PropTypes.array.isRequired,
    onRowClick: PropTypes.func,
    sortable: PropTypes.bool,
    striped: PropTypes.bool,
    hoverable: PropTypes.bool,
    compact: PropTypes.bool,
    className: PropTypes.string,
    headerClassName: PropTypes.string,
    rowClassName: PropTypes.string,
    emptyMessage: PropTypes.string
};

export default Table;

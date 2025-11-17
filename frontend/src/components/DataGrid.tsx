import React, { useState, useMemo } from 'react';
import { FR } from '../i18n/fr';

/**
 * Interface pour une colonne du DataGrid
 */
export interface GridColumn {
  key: string;
  header: string;
  render?: (row: any) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  className?: string;
  width?: string;
}

/**
 * Interface pour le tri
 */
interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

/**
 * Props du DataGrid
 */
export interface DataGridProps {
  data: any[];
  columns: GridColumn[];
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  onRowClick?: (row: any) => void;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  className?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: any[]) => void;
}

/**
 * Composant DataGrid
 * Tableau de données générique et réutilisable
 *
 * Caractéristiques :
 * - Tri par colonne (client-side)
 * - Sélection de lignes
 * - Rendu personnalisé par colonne
 * - Striping et hover effects
 * - Export CSV/JSON
 *
 * Exemple d'utilisation :
 * <DataGrid
 *   data={tenants}
 *   columns={[
 *     { key: 'name', header: 'Nom', sortable: true },
 *     { key: 'phone', header: 'Téléphone' },
 *     { key: 'rent', header: 'Loyer', render: (row) => formatGNF(row.rent) }
 *   ]}
 *   onRowClick={(row) => navigate(`/tenant/${row.id}`)}
 * />
 */
export function DataGrid({
  data,
  columns,
  onSort,
  onRowClick,
  striped = true,
  hoverable = true,
  compact = false,
  emptyMessage = FR.table.noData,
  className = '',
  selectable = false,
  onSelectionChange,
}: DataGridProps): React.ReactElement {
  const [sort, setSort] = useState<SortState | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Appliquer le tri
  const sortedData = useMemo(() => {
    if (!sort) return data;

    const sorted = [...data].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];

      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison =
        typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sort.dir === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sort]);

  function handleSort(column: GridColumn) {
    if (!column.sortable) return;

    const newSort: SortState =
      sort?.key === column.key && sort.dir === 'asc'
        ? { key: column.key, dir: 'desc' }
        : { key: column.key, dir: 'asc' };

    setSort(newSort);
    onSort?.(newSort.key, newSort.dir);
  }

  function toggleRowSelection(index: number) {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
    const selected = Array.from(newSelected).map((i) => sortedData[i]);
    onSelectionChange?.(selected);
  }

  function toggleAllSelection() {
    if (selectedRows.size === sortedData.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const newSelected = new Set(sortedData.map((_, i) => i));
      setSelectedRows(newSelected);
      onSelectionChange?.(sortedData);
    }
  }

  if (sortedData.length === 0) {
    return (
      <div className={`border rounded p-6 text-center text-gray-500 ${className}`}>
        <div className="text-2xl mb-2">📊</div>
        <div>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`border rounded overflow-x-auto ${className}`}>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 border-b">
          <tr>
            {selectable && (
              <th className="w-10 px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={selectedRows.size === sortedData.length}
                  onChange={toggleAllSelection}
                  className="cursor-pointer"
                />
              </th>
            )}
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`px-3 ${compact ? 'py-1' : 'py-2'} text-left font-semibold text-gray-700 ${
                  column.sortable ? 'cursor-pointer select-none hover:bg-gray-200' : ''
                } ${column.className || ''}`}
                style={{ width: column.width }}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center gap-1">
                  <span>{column.header}</span>
                  {column.sortable && (
                    <span className="text-xs">
                      {sort?.key === column.key
                        ? sort.dir === 'asc'
                          ? '▲'
                          : '▼'
                        : '⇅'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-b transition ${
                striped && rowIdx % 2 === 0 ? 'bg-gray-50' : ''
              } ${hoverable ? 'hover:bg-blue-50 cursor-pointer' : ''} ${
                selectedRows.has(rowIdx) ? 'bg-blue-100' : ''
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {selectable && (
                <td className="w-10 px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIdx)}
                    onChange={() => toggleRowSelection(rowIdx)}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  />
                </td>
              )}
              {columns.map((column, colIdx) => (
                <td
                  key={colIdx}
                  className={`px-3 ${compact ? 'py-1' : 'py-2'} ${column.className || ''}`}
                >
                  {column.render ? column.render(row) : row[column.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Variante compacte du DataGrid
 */
export function CompactDataGrid(props: DataGridProps): React.ReactElement {
  return <DataGrid {...props} compact={true} striped={true} />;
}

/**
 * Variante minimaliste du DataGrid
 */
export function MinimalDataGrid(props: DataGridProps): React.ReactElement {
  return <DataGrid {...props} striped={false} hoverable={false} />;
}

/**
 * Exporte les données du DataGrid en CSV
 * @param filename - Nom du fichier à télécharger
 * @param rows - Lignes à exporter
 * @param columns - Définition des colonnes
 *
 * Exemple :
 * exportDataGridCsv('tenants.csv', tenants, columns);
 */
export function exportDataGridCsv(
  filename: string,
  rows: any[],
  columns: GridColumn[]
): void {
  try {
    const headers = columns.map((c) => `"${c.header}"`).join(',');

    const lines = rows
      .map((row) =>
        columns
          .map((col) => {
            const value = col.render ? col.render(row) : row[col.key];
            const stringValue = String(value ?? '').replace(/"/g, '""');
            return `"${stringValue}"`;
          })
          .join(',')
      )
      .join('\n');

    const csv = `${headers}\n${lines}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur lors de l\'export CSV:', error);
  }
}

/**
 * Exporte les données en JSON
 * @param filename - Nom du fichier
 * @param data - Données à exporter
 */
export function exportDataGridJson(filename: string, data: any[]): void {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur lors de l\'export JSON:', error);
  }
}

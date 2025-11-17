'use client';

import * as React from 'react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
    SortingState,
    ColumnFiltersState,
    RowSelectionState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pageCount?: number;
    onPaginationChange?: (page: number, pageSize: number) => void;
    onRowSelectionChange?: (selected: TData[]) => void;
    loading?: boolean;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    pageCount,
    onPaginationChange,
    onRowSelectionChange,
    loading = false,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
    const [globalFilter, setGlobalFilter] = React.useState('');

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        manualPagination: !!pageCount,
        pageCount,
        state: {
            sorting,
            columnFilters,
            rowSelection,
            globalFilter,
        },
        enableRowSelection: true,
    });

    // Sync row selection with parent
    React.useEffect(() => {
        if (onRowSelectionChange) {
            const selectedRows = table.getSelectedRowModel().rows.map(r => r.original);
            onRowSelectionChange(selectedRows);
        }
    }, [rowSelection, onRowSelectionChange, table]);

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Rechercher..."
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(String(e.target.value))}
                    className="max-w-sm"
                />

                {table.getSelectedRowModel().rows.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                        {table.getSelectedRowModel().rows.length} ligne(s) sélectionnée(s)
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={cn(
                                                        'flex items-center gap-2',
                                                        header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground'
                                                    )}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {{
                                                        asc: <ChevronUp className="h-4 w-4" />,
                                                        desc: <ChevronDown className="h-4 w-4" />,
                                                    }[header.column.getIsSorted() as string] ?? (
                                                            header.column.getCanSort() && (
                                                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                            )
                                                        )}
                                                </div>
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    <div className="flex items-center justify-center">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className={cn(row.getIsSelected() && 'bg-muted/50')}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    Aucun résultat trouvé.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="flex-1 text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} sur{' '}
                    {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Précédent
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Suivant
                    </Button>
                </div>
            </div>
        </div>
    );
}

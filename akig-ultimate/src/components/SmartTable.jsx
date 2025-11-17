import { useEffect, useMemo, useState } from "react";
import { exportExcel } from "../services/excel";

const toKey = (storageKey, suffix) => `${storageKey}:${suffix}`;

const readFilters = (storageKey) => {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const stored = window.localStorage.getItem(toKey(storageKey, "filters"));
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn("SmartTable filters restore failed", error);
    return {};
  }
};

export default function SmartTable({ initialColumns, rows, storageKey }) {
  const [columns, setColumns] = useState(initialColumns);
  const [filters, setFilters] = useState(() => readFilters(storageKey));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(toKey(storageKey, "filters"), JSON.stringify(filters));
    } catch (error) {
      console.warn("SmartTable filters persist failed", error);
    }
  }, [filters, storageKey]);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const filteredRows = useMemo(() => {
    if (!rows) {
      return [];
    }

    return rows.filter((row) =>
      Object.entries(filters).every(([key, value]) => {
        if (!value) {
          return true;
        }
        const target = String(row[key] ?? "").toLowerCase();
        return target.includes(String(value).toLowerCase());
      })
    );
  }, [rows, filters]);

  const onDragStart = (startIndex) => (event) => {
    event.dataTransfer.setData("idx", String(startIndex));
  };

  const onDrop = (targetIndex) => (event) => {
    event.preventDefault();
    const from = Number(event.dataTransfer.getData("idx"));
    if (Number.isNaN(from)) {
      return;
    }
    setColumns((current) => {
      const nextColumns = [...current];
      const [moved] = nextColumns.splice(from, 1);
      nextColumns.splice(targetIndex, 0, moved);
      return nextColumns;
    });
  };

  const exportFiltered = () => {
    exportExcel(storageKey, filteredRows);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {columns.map((column) => (
          <input
            key={column.key}
            className="rounded border px-2 py-1"
            placeholder={`Filtrer ${column.label}`}
            value={filters[column.key] ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, [column.key]: event.target.value }))
            }
          />
        ))}
        <button
          type="button"
          className="ml-auto rounded bg-akig-blue px-3 py-2 text-white"
          onClick={exportFiltered}
        >
          Export Excel
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead className="bg-akig-blue50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  draggable
                  onDragStart={onDragStart(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={onDrop(index)}
                  className="cursor-move border p-2 text-left"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={column.key} className="border p-2">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

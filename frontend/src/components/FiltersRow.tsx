import React from 'react';

type Filters = Record<string, unknown>;

interface FiltersRowProps {
  filters: Filters;
  onChange: (next: Filters) => void;
}

export function FiltersRow({ filters, onChange }: FiltersRowProps) {
  const set = (key: string, value: unknown) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="card grid grid-cols-1 gap-3 md:grid-cols-4">
      <div>
        <label className="text-sm text-gray-600">Statut</label>
        <select
          value={(filters.status as string) || ''}
          onChange={(event) => set('status', event.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">Tous</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="overdue">Impayé</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600">Agence</label>
        <input
          value={(filters.agency as string) || ''}
          onChange={(event) => set('agency', event.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Ex: Lambagni"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600">Min loyer (GNF)</label>
        <input
          type="number"
          value={(filters.minRent as number | string) || ''}
          onChange={(event) => {
            const nextValue = event.target.value;
            set('minRent', nextValue === '' ? '' : Number(nextValue));
          }}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600">Max loyer (GNF)</label>
        <input
          type="number"
          value={(filters.maxRent as number | string) || ''}
          onChange={(event) => {
            const nextValue = event.target.value;
            set('maxRent', nextValue === '' ? '' : Number(nextValue));
          }}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>
    </div>
  );
}

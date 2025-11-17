import React from 'react';
import { useQuery } from '../hooks/useQuery';
import { Tenants } from '../api/client';
import { SkeletonCard } from '../components/design-system/SkeletonCard';
import { ErrorBanner } from '../components/feedback/ErrorBanner';

export default function TenantsPage() {
  const { data: tenants, loading, error } = useQuery<any>(() => Tenants.list());

  if (loading) return <SkeletonCard />;
  if (error) return <ErrorBanner message={error} />;

  function exportCSV() {
    const rows = [
      ['Nom', 'Téléphone', 'Site'],
      ...((tenants?.items || tenants || [])).map((t: any) => [t.full_name, t.phone ?? '', t.site ?? t.site_name ?? '']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tenants.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    window.print();
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Locataires</h2>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Téléphone</th>
            <th className="px-4 py-2">Site</th>
          </tr>
        </thead>
        <tbody>
          {(tenants?.items || tenants || []).map((t: any) => (
            <tr key={t.id} className="border-t">
              <td className="px-4 py-2">{t.full_name}</td>
              <td className="px-4 py-2">{t.phone ?? 'N/A'}</td>
              <td className="px-4 py-2">{t.site ?? t.site_name ?? 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-3 mt-4">
        <button onClick={exportCSV} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Export CSV
        </button>
        <button onClick={exportPDF} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Export PDF
        </button>
      </div>
    </div>
  );
}

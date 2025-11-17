/**
 * CSV Export utility
 */

export function exportCsv(filename: string, rows: any[]): void {
  if (!rows || rows.length === 0) {
    console.warn('No data to export');
    return;
  }

  const header = Object.keys(rows[0] || {});
  const lines = [header.join(',')].concat(
    rows.map((r) =>
      header
        .map((h) => JSON.stringify(r[h] ?? ''))
        .join(',')
    )
  );

  const blob = new Blob([lines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export data as JSON
 */
export function exportJson(filename: string, data: any): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Copy data to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

export function exportExcel(filename, rows) {
  if (!rows || rows.length === 0) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(","))];
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

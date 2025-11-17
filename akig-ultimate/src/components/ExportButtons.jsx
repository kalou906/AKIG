import { exportPDF } from "../services/pdf";
import { exportExcel } from "../services/excel";

export default function ExportButtons({ filename, getRows }) {
  const handlePdf = () => {
    const rows = getRows();
    if (!rows || rows.length === 0) {
      return;
    }
    exportPDF(filename, rows);
  };

  const handleExcel = () => {
    const rows = getRows();
    if (!rows || rows.length === 0) {
      return;
    }
    exportExcel(filename, rows);
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="rounded bg-akig-blue px-3 py-2 text-white"
        onClick={handlePdf}
        id="btn-export"
      >
        Exporter PDF
      </button>
      <button type="button" className="rounded bg-akig-red px-3 py-2 text-white" onClick={handleExcel}>
        Exporter Excel
      </button>
    </div>
  );
}

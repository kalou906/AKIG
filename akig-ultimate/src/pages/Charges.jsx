import { useEffect, useState } from "react";
import SmartTable from "../components/SmartTable";
import ExportButtons from "../components/ExportButtons";
import { listCharges, createItem } from "../services/api";
import { fmtMoney, fmtDate } from "../utils/format";

export default function Charges() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    listCharges().then(setRows);
  }, []);

  const columns = [
    { key: "type", label: "Type" },
    { key: "site", label: "Site" },
    { key: "date", label: "Date", render: (value) => fmtDate(value) },
    { key: "montant", label: "Montant", render: (value) => fmtMoney(value) },
    { key: "imputable", label: "Imputable" },
  ];

  const handleAdd = async () => {
    const charge = {
      type: "Eau",
      site: "Matam",
      date: new Date().toISOString(),
      montant: 100000,
      imputable: "Commun",
    };
    const created = await createItem("charges", charge);
    setRows((current) => [created, ...current]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" className="rounded bg-akig-red px-3 py-2 text-white" onClick={handleAdd}>
          + Ajouter une charge
        </button>
        <ExportButtons filename="charges" getRows={() => rows} />
      </div>
  <SmartTable initialColumns={columns} rows={rows} storageKey="charges" />
    </div>
  );
}

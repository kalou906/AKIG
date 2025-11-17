import { useEffect, useState } from "react";
import { listBuildings } from "../services/api";
import { fmtMoney } from "../utils/format";

export default function Immeubles() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    listBuildings().then(setRows);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {rows.map((building) => (
        <div key={building.id} className="rounded border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {building.type} — {building.adresse}
            </h3>
            <span className="text-sm">Lots: {building.lots}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>Occupation: {(building.occupation * 100).toFixed(0)}%</div>
            <div>Revenus mensuels: {fmtMoney(building.revenus_mois)}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded border px-3 py-2">
              Ajouter lot
            </button>
            <button type="button" className="rounded border px-3 py-2">
              Maintenance
            </button>
            <button type="button" className="rounded border px-3 py-2">
              Rapport
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

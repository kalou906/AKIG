import { useEffect, useState } from "react";
import ExportButtons from "../components/ExportButtons";
import { listTenants, listContracts, listPayments } from "../services/api";

export default function Rapports() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const [tenants, contracts, payments] = await Promise.all([
        listTenants(),
        listContracts(),
        listPayments(),
      ]);
      setRows([...tenants, ...contracts, ...payments]);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Rapports AKIG (PDF/Excel brandés)</h3>
      <ExportButtons filename="rapports-akig" getRows={() => rows} />
      <p className="text-sm">
        Préréglages: mensuel, trimestriel, propriétaire, immeuble, agent, impayés.
      </p>
    </div>
  );
}

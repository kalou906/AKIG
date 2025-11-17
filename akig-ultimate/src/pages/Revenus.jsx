import { useEffect, useRef, useState } from "react";
import Table from "../components/Table";
import ExportButtons from "../components/ExportButtons";
import { listPayments, createItem } from "../services/api";
import { fmtMoney } from "../utils/format";
import { exportQuittancePDF } from "../services/pdf";
import { queueOrSend } from "../services/offline";
import { initiateOrangeMoneyPayment } from "../services/orangeMoney";
import { notifyOwner } from "../services/realtime";
import { importTransactions } from "../utils/importers";

export default function Revenus() {
  const [rows, setRows] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    listPayments().then(setRows);
  }, []);

  const columns = [
    { key: "contrat_id", label: "Contrat" },
    { key: "periode", label: "Période" },
    { key: "montant_du", label: "Montant dû", render: (value) => fmtMoney(value) },
    { key: "montant_paye", label: "Payé", render: (value) => fmtMoney(value) },
    { key: "reste", label: "Reste", render: (value) => fmtMoney(value) },
    { key: "mode", label: "Mode" },
  ];

  const handleAdd = async () => {
    const payment = {
      contrat_id: 3,
      periode: "2025-10",
      montant_du: 900000,
      montant_paye: 900000,
      reste: 0,
      mode: "mobile",
      date_paiement: new Date().toISOString(),
      owner_id: 10,
    };

    const created = await createItem("payments", payment);
    setRows((current) => [created, ...current]);
    queueOrSend("/api/payments", created);
    notifyOwner(created.owner_id ?? 1, {
      type: "paiement",
      message: "Nouveau paiement reçu",
      payload: created,
    });
  };

  const actions = [
    {
      label: "Quittance",
      onClick: (row) =>
        exportQuittancePDF({
          proprietaire: "AKIG",
          locataire: `Contrat ${row.contrat_id}`,
          contrat: row.contrat_id,
          periode: row.periode,
          montant_du: row.montant_du,
          montant_paye: row.montant_paye,
          reste: row.reste,
        }),
    },
    {
      label: "Orange Money",
      onClick: async (row) => {
        try {
          await initiateOrangeMoneyPayment({ token: "demo-token", amount: row.montant_du });
          window.alert("Paiement Orange Money initié");
        } catch (error) {
          window.alert(error.message);
        }
      },
    },
  ];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImported = (event) => {
    const [file] = event.target.files ?? [];
    if (!file) {
      return;
    }

    importTransactions(file, (data) => {
      const parsed = data.map((entry) => ({
        id: Date.now() + Math.random(),
        contrat_id: Number(entry.contrat_id) || 0,
        periode: entry.periode,
        montant_du: Number(entry.montant_du) || 0,
        montant_paye: Number(entry.montant_paye) || 0,
        reste: Number(entry.reste) || 0,
        mode: entry.mode ?? "csv",
      }));
      setRows((current) => parsed.concat(current));
    });

    event.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" className="rounded bg-akig-blue px-3 py-2 text-white" onClick={handleAdd}>
          + Enregistrer un paiement
        </button>
        <ExportButtons filename="revenus" getRows={() => rows} />
        <button type="button" className="rounded border px-3 py-2" onClick={handleImportClick}>
          Import CSV
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImported} />
      </div>
      <Table columns={columns} data={rows} actions={actions} />
    </div>
  );
}

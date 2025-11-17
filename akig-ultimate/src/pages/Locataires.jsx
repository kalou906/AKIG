import { useEffect, useState } from "react";
import Table from "../components/Table";
import ExportButtons from "../components/ExportButtons";
import ConfirmDialog from "../components/ConfirmDialog";
import { listTenants, deleteItem, createItem, updateItem } from "../services/api";
import { fmtMoney } from "../utils/format";
import { validateTenant } from "../utils/validations";
import { useAuditStore } from "../store/auditStore";

export default function Locataires() {
  const [rows, setRows] = useState([]);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const { addLog } = useAuditStore();

  useEffect(() => {
    listTenants().then(setRows);
  }, []);

  const columns = [
    { key: "nom", label: "Nom" },
    { key: "tel", label: "Téléphone" },
    { key: "quartier", label: "Quartier" },
    { key: "statut", label: "Statut" },
    { key: "impaye", label: "Impayés", render: (value) => fmtMoney(value) },
  ];

  const actions = [
    {
      label: "Voir",
      onClick: (row) => window.alert(`Détails locataire: ${row.nom}`),
    },
    {
      label: "Modifier",
      onClick: async (row) => {
        const patch = { ...row, nom: `${row.nom} (MAJ)` };
        const error = validateTenant(patch);
        if (error) {
          window.alert(error);
          return;
        }
  await updateItem("tenants", row.id, patch);
  setRows((current) => current.map((tenant) => (tenant.id === row.id ? patch : tenant)));
  addLog("update", "tenant", { id: row.id, patch });
      },
    },
    {
      label: "Supprimer",
      className: "text-akig-red border",
      onClick: (row) => setConfirmTarget(row),
    },
    {
      label: "Rappel",
      onClick: (row) => window.alert(`Relance SMS/Email à ${row.nom}`),
    },
  ];

  const handleDelete = async () => {
    if (!confirmTarget) {
      return;
    }
  await deleteItem("tenants", confirmTarget.id);
  setRows((current) => current.filter((tenant) => tenant.id !== confirmTarget.id));
  addLog("delete", "tenant", { id: confirmTarget.id });
    setConfirmTarget(null);
  };

  const handleAdd = async () => {
    const newTenant = {
      nom: "Nouveau Locataire",
      tel: "620123456",
      quartier: "Matam",
      statut: "Actif",
      impaye: 0,
    };
    const error = validateTenant(newTenant);
    if (error) {
      window.alert(error);
      return;
    }
  const created = await createItem("tenants", newTenant);
  setRows((current) => [created, ...current]);
  addLog("create", "tenant", { id: created.id });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" className="rounded bg-akig-red px-3 py-2 text-white" onClick={handleAdd}>
          + Ajouter un locataire
        </button>
        <ExportButtons filename="locataires" getRows={() => rows} />
      </div>
      <Table columns={columns} data={rows} actions={actions} />
      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Confirmer la suppression"
        message={`Supprimer ${confirmTarget?.nom} ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

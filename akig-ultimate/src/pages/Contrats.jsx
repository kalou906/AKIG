import { useEffect, useState } from "react";
import Table from "../components/Table";
import ExportButtons from "../components/ExportButtons";
import ConfirmDialog from "../components/ConfirmDialog";
import ContractForm from "../components/ContractForm";
import { listContracts, updateItem, createItem } from "../services/api";
import { fmtMoney, fmtDate } from "../utils/format";
import { validateContract } from "../utils/validations";
import { useAuditStore } from "../store/auditStore";

export default function Contrats() {
  const [rows, setRows] = useState([]);
  const [contractToClose, setContractToClose] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { addLog } = useAuditStore();

  useEffect(() => {
    listContracts().then(setRows);
  }, []);

  const columns = [
    { key: "n_contrat", label: "N° Contrat" },
    { key: "locataire_id", label: "Locataire" },
    { key: "local_id", label: "Lot/Local" },
    { key: "montant_loyer", label: "Loyer", render: (value) => fmtMoney(value) },
    { key: "date_debut", label: "Début", render: (value) => fmtDate(value) },
    { key: "date_fin", label: "Fin", render: (value) => fmtDate(value) },
    { key: "statut", label: "Statut" },
    { key: "penalites", label: "Pénalités", render: (value) => fmtMoney(value) },
  ];

  const actions = [
    {
      label: "Voir",
      onClick: (row) => window.alert(`Contrat ${row.n_contrat}`),
    },
    {
      label: "Réviser loyer",
      onClick: async (row) => {
        const patch = { ...row, montant_loyer: row.montant_loyer * 1.03 };
        const error = validateContract(patch);
        if (error) {
          window.alert(error);
          return;
        }
  await updateItem("contracts", row.id, patch);
  setRows((current) => current.map((contract) => (contract.id === row.id ? patch : contract)));
  addLog("update", "contract", { id: row.id, patch });
      },
    },
    {
      label: "Clôturer",
      className: "text-akig-red border",
      onClick: (row) => setContractToClose(row),
    },
    {
      label: "Quitance PDF",
      onClick: (row) => window.alert(`Générer quittance pour ${row.n_contrat}`),
    },
  ];

  const handleCreate = async (payload) => {
    const contract = {
      ...payload,
      penalites: payload.penalites ?? 0,
    };

    const error = validateContract(contract);
    if (error) {
      window.alert(error);
      return;
    }

    const created = await createItem("contracts", contract);
    setRows((current) => [created, ...current]);
    addLog("create", "contract", { id: created.id });
    setShowForm(false);
  };

  const handleClose = async () => {
    if (!contractToClose) {
      return;
    }

  const patch = { ...contractToClose, statut: "Clos" };
  await updateItem("contracts", contractToClose.id, patch);
  setRows((current) => current.map((contract) => (contract.id === contractToClose.id ? patch : contract)));
  addLog("update", "contract", { id: contractToClose.id, patch });
    setContractToClose(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded bg-akig-blue px-3 py-2 text-white"
          onClick={() => setShowForm((current) => !current)}
        >
          {showForm ? "Fermer le formulaire" : "+ Ajouter un contrat"}
        </button>
        <ExportButtons filename="contrats" getRows={() => rows} />
      </div>
      {showForm ? (
        <div className="rounded border p-4">
          <h4 className="mb-3 font-semibold">Nouveau contrat</h4>
          <ContractForm onSubmit={handleCreate} />
        </div>
      ) : null}
      <Table columns={columns} data={rows} actions={actions} />
      <ConfirmDialog
        open={Boolean(contractToClose)}
        title="Clôturer le contrat"
        message={`Clôturer ${contractToClose?.n_contrat} ?`}
        onConfirm={handleClose}
        onCancel={() => setContractToClose(null)}
      />
    </div>
  );
}

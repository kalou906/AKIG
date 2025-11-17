import { useState } from "react";
import { validateContract } from "../utils/validations";

const emptyContract = {
  n_contrat: "",
  locataire_id: "",
  local_id: "",
  montant_loyer: 0,
  charges_forfaitaires: 0,
  depot_garantie: 0,
  date_debut: "",
  date_fin: "",
  statut: "Actif",
};

export default function ContractForm({ initial, onSubmit }) {
  const [contract, setContract] = useState(initial ?? emptyContract);
  const [error, setError] = useState(null);

  const change = (field, value) => {
    setContract((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    const validation = validateContract(contract);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    onSubmit?.(contract);
  };

  const reset = () => {
    setContract(initial ?? emptyContract);
    setError(null);
  };

  return (
    <div className="space-y-3">
      {error ? <div className="text-sm text-akig-red">{error}</div> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input
          className="rounded border px-3 py-2"
          placeholder="N° Contrat"
          value={contract.n_contrat}
          onChange={(event) => change("n_contrat", event.target.value)}
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Locataire ID"
          value={contract.locataire_id}
          onChange={(event) => change("locataire_id", event.target.value)}
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Lot/Local ID"
          value={contract.local_id}
          onChange={(event) => change("local_id", event.target.value)}
        />
        <input
          type="number"
          className="rounded border px-3 py-2"
          placeholder="Montant loyer"
          value={contract.montant_loyer}
          onChange={(event) => change("montant_loyer", Number(event.target.value))}
        />
        <input
          type="number"
          className="rounded border px-3 py-2"
          placeholder="Charges forfaitaires"
          value={contract.charges_forfaitaires}
          onChange={(event) => change("charges_forfaitaires", Number(event.target.value))}
        />
        <input
          type="number"
          className="rounded border px-3 py-2"
          placeholder="Dépôt de garantie"
          value={contract.depot_garantie}
          onChange={(event) => change("depot_garantie", Number(event.target.value))}
        />
        <input
          type="date"
          className="rounded border px-3 py-2"
          value={contract.date_debut}
          onChange={(event) => change("date_debut", event.target.value)}
        />
        <input
          type="date"
          className="rounded border px-3 py-2"
          value={contract.date_fin}
          onChange={(event) => change("date_fin", event.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button type="button" className="rounded bg-akig-blue px-3 py-2 text-white" onClick={handleSubmit}>
          Enregistrer
        </button>
        <button type="button" className="rounded border px-3 py-2" onClick={reset}>
          Réinitialiser
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { listBuildings, listPayments } from "../services/api";
import { fmtMoney } from "../utils/format";

export default function Proprietaires() {
  const [immeubles, setImmeubles] = useState([]);
  const [revenus, setRevenus] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [buildings, payments] = await Promise.all([listBuildings(), listPayments()]);
      if (cancelled) {
        return;
      }
      setImmeubles(buildings);
      setRevenus(payments.reduce((total, payment) => total + (payment.montant_paye ?? 0), 0));
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Espace Propriétaire</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded border p-4">
          <h4 className="font-semibold">Revenus du mois</h4>
          <div className="text-2xl">{fmtMoney(revenus)}</div>
        </div>
        <div className="rounded border p-4">
          <h4 className="font-semibold">Biens</h4>
          <ul className="text-sm">
            {immeubles.map((immeuble) => (
              <li key={immeuble.id}>
                {immeuble.type} — {immeuble.adresse} — Lots: {immeuble.lots}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded border p-4">
          <h4 className="font-semibold">Documents</h4>
          <p className="text-sm">Quittances, Contrats, États des lieux (export PDF)</p>
        </div>
      </div>
    </div>
  );
}

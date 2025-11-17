import { useEffect, useState } from "react";
import { listPayments } from "../services/api";
import { fmtMoney } from "../utils/format";
import { sendSMS } from "../services/communications";

export default function Recouvrement() {
  const [dossiers, setDossiers] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const payments = await listPayments();
      if (cancelled) {
        return;
      }
      const items = payments
        .filter((payment) => (payment.reste ?? 0) > 0)
        .map((payment) => ({
          id: payment.id,
          contrat: payment.contrat_id,
          periode: payment.periode,
          impaye: payment.reste,
          statut: "À relancer",
          historique: [],
        }));
      setDossiers(items);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const relancer = (dossier) => {
    setDossiers((current) =>
      current.map((item) =>
        item.id === dossier.id
          ? { ...item, statut: "Relancé", historique: item.historique.concat(`SMS ${new Date().toLocaleString()}`) }
          : item
      )
    );

    const message = `Bonjour, il reste ${fmtMoney(dossier.impaye)} à régler pour le contrat ${dossier.contrat}.`;
    sendSMS(dossier.tel ?? "620000000", message);
  };

  const encaisser = (dossier) => {
    setDossiers((current) =>
      current.map((item) =>
        item.id === dossier.id
          ? {
              ...item,
              statut: "Payé",
              impaye: 0,
              historique: item.historique.concat(`Encaissement ${new Date().toLocaleString()}`),
            }
          : item
      )
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Recouvrement quotidien</h3>
      <table className="w-full border">
        <thead className="bg-akig-blue50">
          <tr>
            <th className="border p-2">Contrat</th>
            <th className="border p-2">Période</th>
            <th className="border p-2">Impayé</th>
            <th className="border p-2">Statut</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {dossiers.map((dossier) => (
            <tr key={dossier.id}>
              <td className="border p-2">{dossier.contrat}</td>
              <td className="border p-2">{dossier.periode}</td>
              <td className="border p-2">{fmtMoney(dossier.impaye)}</td>
              <td className="border p-2">{dossier.statut}</td>
              <td className="border p-2">
                <div className="flex gap-2">
                  <button type="button" className="rounded border px-3 py-1" onClick={() => relancer(dossier)}>
                    Relancer SMS
                  </button>
                  <button type="button" className="rounded border px-3 py-1" onClick={() => encaisser(dossier)}>
                    Encaisser
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

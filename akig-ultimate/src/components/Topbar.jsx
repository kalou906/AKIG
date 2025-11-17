import { useState } from "react";
import { listTenants, listContracts, listPayments } from "../services/api";
import { smartSearch } from "../services/search";
import ThemeToggle from "./ThemeToggle";
import HealthIndicator from "./HealthIndicator";
import { useUIStore } from "../store/uiStore";

export default function Topbar({ onStartTour }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { pushToast } = useUIStore();

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!query.trim()) {
      pushToast({ type: "info", message: "Requête de recherche vide" });
      return;
    }

    setLoading(true);
    try {
      const [tenants, contracts, payments] = await Promise.all([
        listTenants(),
        listContracts(),
        listPayments(),
      ]);
      const { tMatches, cMatches, pMatches } = smartSearch(query, {
        tenants,
        contracts,
        payments,
      });

      pushToast({
        type: "info",
        message: `Résultats: ${tMatches.length} locataire(s), ${cMatches.length} contrat(s), ${pMatches.length} paiement(s)`,
      });
    } catch (error) {
      pushToast({ type: "error", message: "Recherche indisponible" });
      console.warn("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="flex items-center justify-between border-b p-4">
      <form onSubmit={handleSearch} className="flex-1" role="search">
        <input
          type="search"
          placeholder="Rechercher locataire, contrat, site, période..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full max-w-xl rounded border px-3 py-2"
          aria-label="Recherche AKIG"
        />
      </form>
      <div className="ml-4 flex items-center gap-3">
        <HealthIndicator />
        <ThemeToggle />
        <button
          type="button"
          className="rounded border px-3 py-2"
          onClick={onStartTour}
        >
          Guide rapide
        </button>
        <button type="button" aria-label="Notifications" className="text-akig-red">
          {loading ? "⏳" : "🔔"}
        </button>
        <img
          src="https://via.placeholder.com/40x40.png?text=AK"
          alt="Profil utilisateur"
          className="h-10 w-10 rounded-full object-cover"
        />
      </div>
    </header>
  );
}

import { NavLink } from "react-router-dom";
import logo from "../assets/logo-akig.svg";

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/locataires", label: "Locataires", id: "menu-locataires" },
  { to: "/contrats", label: "Contrats", id: "menu-contrats" },
  { to: "/immeubles", label: "Immeubles" },
  { to: "/charges", label: "Charges" },
  { to: "/revenus", label: "Revenus" },
  { to: "/saisonniere", label: "Saisonnière" },
  { to: "/recouvrement", label: "Recouvrement" },
  { to: "/maintenance", label: "Maintenance" },
  { to: "/espace-client", label: "Espace Client" },
  { to: "/rapports", label: "Rapports" },
  { to: "/parametres", label: "Paramètres" },
  { to: "/proprietaires", label: "Propriétaires" },
];

export default function Sidebar() {
  return (
    <aside className="flex w-64 flex-col bg-akig-blue text-white">
      <div className="border-b border-akig-blue50 p-4">
        <img src={logo} alt="AKIG" className="logo-akig mx-auto" />
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            id={item.id}
            className={({ isActive }) =>
              `block rounded px-3 py-2 ${isActive ? "bg-akig-blue800" : "hover:bg-akig-blue800"}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-4">
        <button className="w-full rounded bg-akig-red px-3 py-2 text-white">+ Ajouter</button>
      </div>
    </aside>
  );
}

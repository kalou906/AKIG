import { useState, useEffect } from "react";

export default function Parametres() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [availableRoles] = useState([
    { id: 1, name: "SUPER_ADMIN", description: "Accès complet au système" },
    { id: 2, name: "OWNER", description: "Propriétaire immobilier" },
    { id: 3, name: "AGENCY", description: "Agence immobilière" },
    { id: 4, name: "ACCOUNTANT", description: "Comptable" },
    { id: 5, name: "TENANT", description: "Locataire" },
    { id: 6, name: "SUPPORT", description: "Support client" },
  ]);
  const [loading, setLoading] = useState(false);

  // Charger les utilisateurs
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:4000/api/auth/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectUser = async (user) => {
    setSelectedUser(user);
    try {
      const response = await fetch(`http://localhost:4000/api/users/${user.id}/roles`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      setUserRoles(data.roles || []);
    } catch (error) {
      console.error("Erreur chargement rôles:", error);
    }
  };

  const assignRole = async (roleId) => {
    if (!selectedUser) return;
    try {
      const role = availableRoles.find(r => r.id === roleId);
      const response = await fetch(`http://localhost:4000/api/users/${selectedUser.id}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ roleName: role.name }),
      });
      if (response.ok) {
        selectUser(selectedUser);
      }
    } catch (error) {
      console.error("Erreur assignation rôle:", error);
    }
  };

  const removeRole = async (roleId) => {
    if (!selectedUser) return;
    try {
      const role = availableRoles.find(r => r.id === roleId);
      const response = await fetch(`http://localhost:4000/api/users/${selectedUser.id}/roles/${role.name}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        selectUser(selectedUser);
      }
    } catch (error) {
      console.error("Erreur suppression rôle:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Gestion des Rôles */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-6 text-lg font-semibold">🔐 Gestion des Rôles & Permissions</h3>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Liste des utilisateurs */}
          <div>
            <h4 className="mb-3 font-semibold">Utilisateurs</h4>
            {loading ? (
              <p className="text-sm text-gray-500">Chargement...</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className={`w-full rounded border p-3 text-left transition ${
                      selectedUser?.id === user.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rôles de l'utilisateur sélectionné */}
          <div>
            <h4 className="mb-3 font-semibold">
              {selectedUser ? `Rôles - ${selectedUser.name || selectedUser.email}` : "Sélectionner un utilisateur"}
            </h4>
            {selectedUser ? (
              <div className="space-y-3">
                {/* Rôles actuels */}
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Rôles actuels</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userRoles.length > 0 ? (
                      userRoles.map((role) => (
                        <div
                          key={role.id}
                          className="flex items-center justify-between rounded bg-green-50 p-2"
                        >
                          <div>
                            <p className="font-medium text-green-900">{role.name}</p>
                            <p className="text-xs text-green-700">{role.description}</p>
                          </div>
                          <button
                            onClick={() => removeRole(role.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">Aucun rôle assigné</p>
                    )}
                  </div>
                </div>

                {/* Rôles disponibles */}
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Ajouter un rôle</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableRoles
                      .filter(r => !userRoles.find(ur => ur.id === r.id))
                      .map((role) => (
                        <button
                          key={role.id}
                          onClick={() => assignRole(role.id)}
                          className="w-full rounded border border-gray-200 bg-white p-2 text-left text-sm hover:bg-blue-50"
                        >
                          <p className="font-medium">{role.name}</p>
                          <p className="text-xs text-gray-600">{role.description}</p>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sélectionnez un utilisateur pour voir ses rôles</p>
            )}
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="space-y-4">
        <h3 className="font-semibold">Paramètres & Branding</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded border p-4">
            <h4 className="mb-2 font-semibold">Couleurs AKIG</h4>
            <div className="flex gap-2">
              <div className="h-10 w-10 rounded" style={{ background: "#0B2E67" }} />
              <div className="h-10 w-10 rounded" style={{ background: "#E53935" }} />
              <div className="h-10 w-10 rounded border" style={{ background: "#FFFFFF" }} />
            </div>
          </div>
          <div className="rounded border p-4">
            <h4 className="mb-2 font-semibold">Logo</h4>
            <p className="text-sm">Utiliser SVG/PNG, object-fit: contain, hauteur max 56px.</p>
            <input type="file" accept="image/*" className="mt-2 rounded border px-3 py-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

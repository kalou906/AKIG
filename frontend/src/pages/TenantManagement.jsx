/**
 * TenantManagement.jsx - Phase 4: Gestion des Locataires
 * Frontend pour créer, modifier et gérer les locataires et leurs garanteurs
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState({ propriete_id: '', statut_contrat: 'actif' });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse_personnelle: '',
    date_naissance: '',
    profession: '',
    entreprise: '',
    salaire_mensuel: '',
    propriete_id: '',
    statut_contrat: 'actif',
    garanteur_requis: false,
  });

  const [guarantor, setGuarantor] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    profession: '',
    relation: 'parent',
  });

  // Charger les locataires
  const loadTenants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (filter.propriete_id) params.append('propriete_id', filter.propriete_id);
      if (filter.statut_contrat) params.append('statut_contrat', filter.statut_contrat);

      const response = await axios.get(`/api/tenants/list?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setTenants(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erreur lors du chargement des locataires:', error);
      alert('Erreur lors du chargement des locataires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [pagination.page, filter]);

  // Ouvrir le modal pour créer/éditer
  const openModal = (tenant = null) => {
    if (tenant) {
      setEditingId(tenant.id);
      setFormData({
        nom: tenant.nom,
        prenom: tenant.prenom,
        email: tenant.email,
        telephone: tenant.telephone,
        adresse_personnelle: tenant.adresse_personnelle || '',
        date_naissance: tenant.date_naissance || '',
        profession: tenant.profession || '',
        entreprise: tenant.entreprise || '',
        salaire_mensuel: tenant.salaire_mensuel || '',
        propriete_id: tenant.propriete_id,
        statut_contrat: tenant.statut_contrat,
        garanteur_requis: tenant.garanteur_requis,
      });

      // Charger les informations du garanteur si applicable
      if (tenant.garanteur_requis) {
        fetchGuarantorInfo(tenant.id);
      }
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const fetchGuarantorInfo = async (tenantId) => {
    try {
      const response = await axios.get(`/api/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.data.data.guarantor) {
        setGuarantor({
          nom: response.data.data.guarantor.nom || '',
          prenom: response.data.data.guarantor.prenom || '',
          email: response.data.data.guarantor.email || '',
          telephone: response.data.data.guarantor.telephone || '',
          adresse: response.data.data.guarantor.adresse || '',
          profession: response.data.data.guarantor.profession || '',
          relation: response.data.data.guarantor.relation || 'parent',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du garanteur:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse_personnelle: '',
      date_naissance: '',
      profession: '',
      entreprise: '',
      salaire_mensuel: '',
      propriete_id: '',
      statut_contrat: 'actif',
      garanteur_requis: false,
    });
    setGuarantor({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse: '',
      profession: '',
      relation: 'parent',
    });
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Mise à jour
        await axios.patch(`/api/tenants/${editingId}/update`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        // Ajouter/mettre à jour le garanteur si requis
        if (formData.garanteur_requis && (guarantor.nom || guarantor.prenom)) {
          await axios.post(`/api/tenants/${editingId}/guarantor`, guarantor, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
        }

        alert('Locataire mis à jour avec succès');
      } else {
        // Création
        const response = await axios.post('/api/tenants/create', formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        const newTenantId = response.data.data.id;

        // Ajouter le garanteur si requis
        if (formData.garanteur_requis && (guarantor.nom || guarantor.prenom)) {
          await axios.post(`/api/tenants/${newTenantId}/guarantor`, guarantor, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
        }

        alert('Locataire créé avec succès');
      }

      setShowModal(false);
      loadTenants();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du locataire');
    }
  };

  // Supprimer un locataire
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir archiver ce locataire ?')) {
      return;
    }

    try {
      await axios.delete(`/api/tenants/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      alert('Locataire archivé avec succès');
      loadTenants();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de l\'archivage du locataire');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleGuarantorChange = (e) => {
    const { name, value } = e.target;
    setGuarantor({
      ...guarantor,
      [name]: value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gestion des Locataires</h1>
            <p className="text-gray-600 mt-2">Créer, modifier et gérer les locataires</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                       text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all"
          >
            + Nouveau Locataire
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Propriété</label>
              <input
                type="number"
                placeholder="ID Propriété"
                value={filter.propriete_id}
                onChange={(e) => setFilter({ ...filter, propriete_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={filter.statut_contrat}
                onChange={(e) => setFilter({ ...filter, statut_contrat: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="actif">Actif</option>
                <option value="departi">Parti</option>
                <option value="archivé">Archivé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tableau des locataires */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement en cours...</div>
          ) : tenants.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun locataire trouvé</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nom</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Téléphone</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Profession</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {tenant.prenom} {tenant.nom}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{tenant.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{tenant.telephone}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{tenant.profession || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              tenant.statut_contrat === 'actif'
                                ? 'bg-green-100 text-green-800'
                                : tenant.statut_contrat === 'departi'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {tenant.statut_contrat}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button
                            onClick={() => openModal(tenant)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Éditer
                          </button>
                          <button
                            onClick={() => handleDelete(tenant.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Archiver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Affichage de {(pagination.page - 1) * pagination.limit + 1} à{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <span className="px-4 py-2">
                    Page {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.pages}
                    className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Locataire */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Éditer Locataire' : 'Nouveau Locataire'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white text-2xl hover:opacity-80"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Informations Personnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Naissance</label>
                    <input
                      type="date"
                      name="date_naissance"
                      value={formData.date_naissance}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                    <input
                      type="text"
                      name="adresse_personnelle"
                      value={formData.adresse_personnelle}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Informations Professionnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Professionnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profession</label>
                    <input
                      type="text"
                      name="profession"
                      value={formData.profession}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Entreprise</label>
                    <input
                      type="text"
                      name="entreprise"
                      value={formData.entreprise}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salaire Mensuel</label>
                    <input
                      type="number"
                      name="salaire_mensuel"
                      value={formData.salaire_mensuel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Informations Contrat */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Contrat</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Propriété *</label>
                    <input
                      type="number"
                      name="propriete_id"
                      value={formData.propriete_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select
                      name="statut_contrat"
                      value={formData.statut_contrat}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="actif">Actif</option>
                      <option value="departi">Parti</option>
                      <option value="archivé">Archivé</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="garanteur_requis"
                      checked={formData.garanteur_requis}
                      onChange={handleInputChange}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Ajouter un garanteur</span>
                  </label>
                </div>
              </div>

              {/* Garanteur */}
              {formData.garanteur_requis && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Garanteur</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        name="nom"
                        value={guarantor.nom}
                        onChange={handleGuarantorChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        name="prenom"
                        value={guarantor.prenom}
                        onChange={handleGuarantorChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={guarantor.email}
                        onChange={handleGuarantorChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        name="telephone"
                        value={guarantor.telephone}
                        onChange={handleGuarantorChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                      <select
                        name="relation"
                        value={guarantor.relation}
                        onChange={handleGuarantorChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="parent">Parent</option>
                        <option value="employeur">Employeur</option>
                        <option value="ami">Ami</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profession</label>
                      <input
                        type="text"
                        name="profession"
                        value={guarantor.profession}
                        onChange={handleGuarantorChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;

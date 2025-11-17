/**
 * MaintenanceTickets.jsx - Phase 5: Gestion des Tickets de Maintenance
 * Frontend pour créer et gérer les tickets de maintenance
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MaintenanceTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState({
    propriete_id: '',
    statut: '',
    priorite: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  const [formData, setFormData] = useState({
    propriete_id: '',
    description: '',
    priorite: 'normal',
    type_intervention: 'reparation',
    localisation: '',
    locataire_id: '',
    details_probleme: '',
  });

  const [assignmentData, setAssignmentData] = useState({
    technicien_id: '',
    notes: '',
    date_intervention_prevue: '',
  });

  const [completionData, setCompletionData] = useState({
    notes_completion: '',
    cout_total: '',
    date_completion: new Date().toISOString().split('T')[0],
  });

  const [ticketDetails, setTicketDetails] = useState(null);

  // Charger les tickets
  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (filter.propriete_id) params.append('propriete_id', filter.propriete_id);
      if (filter.statut) params.append('statut', filter.statut);
      if (filter.priorite) params.append('priorite', filter.priorite);

      const response = await axios.get(`/api/maintenance/list?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setTickets(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erreur lors du chargement des tickets:', error);
      alert('Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [pagination.page, filter]);

  // Ouvrir le modal pour créer/éditer
  const openModal = (ticket = null) => {
    if (ticket) {
      setEditingId(ticket.id);
      setFormData({
        propriete_id: ticket.propriete_id || '',
        description: ticket.description || '',
        priorite: ticket.priorite || 'normal',
        type_intervention: ticket.type_intervention || 'reparation',
        localisation: ticket.localisation || '',
        locataire_id: ticket.locataire_id || '',
        details_probleme: ticket.details_probleme || '',
      });
      fetchTicketDetails(ticket.id);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await axios.get(`/api/maintenance/${ticketId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTicketDetails(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement du détail du ticket:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      propriete_id: '',
      description: '',
      priorite: 'normal',
      type_intervention: 'reparation',
      localisation: '',
      locataire_id: '',
      details_probleme: '',
    });
    setAssignmentData({
      technicien_id: '',
      notes: '',
      date_intervention_prevue: '',
    });
    setCompletionData({
      notes_completion: '',
      cout_total: '',
      date_completion: new Date().toISOString().split('T')[0],
    });
    setTicketDetails(null);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Mise à jour
        await axios.patch(`/api/maintenance/${editingId}/update`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        alert('Ticket mis à jour avec succès');
      } else {
        // Création
        await axios.post('/api/maintenance/create', formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        alert('Ticket créé avec succès');
      }

      setShowModal(false);
      loadTickets();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du ticket');
    }
  };

  // Assigner un technicien
  const handleAssignment = async (e) => {
    e.preventDefault();

    if (!editingId) {
      alert('Aucun ticket sélectionné');
      return;
    }

    try {
      await axios.post(`/api/maintenance/${editingId}/assign`, assignmentData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      alert('Technicien assigné avec succès');
      setAssignmentData({
        technicien_id: '',
        notes: '',
        date_intervention_prevue: '',
      });
      fetchTicketDetails(editingId);
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      alert('Erreur lors de l\'assignation');
    }
  };

  // Marquer comme complété
  const handleCompletion = async (e) => {
    e.preventDefault();

    if (!editingId) {
      alert('Aucun ticket sélectionné');
      return;
    }

    try {
      await axios.patch(
        `/api/maintenance/${editingId}/complete`,
        completionData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      alert('Ticket marqué comme complété');
      setShowModal(false);
      loadTickets();
    } catch (error) {
      console.error('Erreur lors de la complétion:', error);
      alert('Erreur lors de la complétion');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData({
      ...assignmentData,
      [name]: value,
    });
  };

  const handleCompletionChange = (e) => {
    const { name, value } = e.target;
    setCompletionData({
      ...completionData,
      [name]: value,
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'bas':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ouvert':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_cours':
        return 'bg-blue-100 text-blue-800';
      case 'termine':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gestion de Maintenance</h1>
            <p className="text-gray-600 mt-2">Créer et gérer les tickets de maintenance</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                       text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all"
          >
            + Nouveau Ticket
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Propriété
              </label>
              <input
                type="number"
                placeholder="ID Propriété"
                value={filter.propriete_id}
                onChange={(e) =>
                  setFilter({ ...filter, propriete_id: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filter.statut}
                onChange={(e) => setFilter({ ...filter, statut: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tous</option>
                <option value="ouvert">Ouvert</option>
                <option value="en_cours">En Cours</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorité
              </label>
              <select
                value={filter.priorite}
                onChange={(e) =>
                  setFilter({ ...filter, priorite: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tous</option>
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
                <option value="bas">Bas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tableau des tickets */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement en cours...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun ticket trouvé</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-50 to-green-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Ticket
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Priorité
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Localisation
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-green-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {ticket.numero_ticket}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {ticket.description}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priorite)}`}>
                            {ticket.priorite}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.statut)}`}>
                            {ticket.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {ticket.localisation || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button
                            onClick={() => openModal(ticket)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Éditer
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
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                  {pagination.total}
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page - 1 })
                    }
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <span className="px-4 py-2">
                    Page {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page + 1 })
                    }
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

      {/* Modal Ticket */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Éditer Ticket' : 'Nouveau Ticket'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white text-2xl hover:opacity-80"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Formulaire Ticket */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Informations du Ticket
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Propriété *
                    </label>
                    <input
                      type="number"
                      name="propriete_id"
                      value={formData.propriete_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priorité
                    </label>
                    <select
                      name="priorite"
                      value={formData.priorite}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="normal">Normal</option>
                      <option value="bas">Bas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type d'intervention
                    </label>
                    <select
                      name="type_intervention"
                      value={formData.type_intervention}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="reparation">Réparation</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inspection">Inspection</option>
                      <option value="nettoyage">Nettoyage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localisation
                    </label>
                    <input
                      type="text"
                      name="localisation"
                      value={formData.localisation}
                      onChange={handleInputChange}
                      placeholder="Pièce, étage..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Détails du problème
                  </label>
                  <textarea
                    name="details_probleme"
                    value={formData.details_probleme}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
                >
                  {editingId ? 'Mettre à jour' : 'Créer'}
                </button>
              </form>

              {/* Section Assignation (si édition) */}
              {editingId && ticketDetails && (
                <div className="border-t pt-6">
                  <form onSubmit={handleAssignment} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Assigner un Technicien
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Technicien *
                        </label>
                        <input
                          type="number"
                          name="technicien_id"
                          value={assignmentData.technicien_id}
                          onChange={handleAssignmentChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date intervention
                        </label>
                        <input
                          type="date"
                          name="date_intervention_prevue"
                          value={assignmentData.date_intervention_prevue}
                          onChange={handleAssignmentChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={assignmentData.notes}
                        onChange={handleAssignmentChange}
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      Assigner
                    </button>
                  </form>
                </div>
              )}

              {/* Section Complétion (si édition) */}
              {editingId && ticketDetails && (
                <div className="border-t pt-6">
                  <form onSubmit={handleCompletion} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Marquer comme Complété
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Coût Total
                        </label>
                        <input
                          type="number"
                          name="cout_total"
                          value={completionData.cout_total}
                          onChange={handleCompletionChange}
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date Complétion
                        </label>
                        <input
                          type="date"
                          name="date_completion"
                          value={completionData.date_completion}
                          onChange={handleCompletionChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes de complétion
                      </label>
                      <textarea
                        name="notes_completion"
                        value={completionData.notes_completion}
                        onChange={handleCompletionChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
                    >
                      Marquer comme Complété
                    </button>
                  </form>
                </div>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceTickets;

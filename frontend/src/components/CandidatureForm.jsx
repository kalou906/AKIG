/**
 * CandidatureForm.jsx
 * Phase 8: Modal for new/edit candidatures
 * Multi-step form with locataire management
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function CandidatureForm({ candidature, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    local_id: '',
    proprietaire_id: '',
    locataires: [{ nom: '', prenom: '', email: '', telephone: '' }],
    statut: 'nouvelle',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [proprietaires, setProprietaires] = useState([]);

  const API_BASE = 'http://localhost:4000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (candidature) {
      setFormData(candidature);
    }
    fetchProperties();
    fetchProprietaires();
  }, [candidature]);

  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API_BASE}/properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProperties(res.data.data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchProprietaires = async () => {
    try {
      const res = await axios.get(`${API_BASE}/proprietaires`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProprietaires(res.data.data || []);
    } catch (error) {
      console.error('Error fetching proprietaires:', error);
    }
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePhone = (phone) => {
    const regex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;
    return regex.test(phone.replace(/\s/g, ''));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.local_id) newErrors.local_id = 'Requis';
    if (!formData.proprietaire_id) newErrors.proprietaire_id = 'Requis';

    formData.locataires.forEach((loc, idx) => {
      if (!loc.nom) newErrors[`locataires.${idx}.nom`] = 'Requis';
      if (!loc.prenom) newErrors[`locataires.${idx}.prenom`] = 'Requis';
      if (!validateEmail(loc.email)) newErrors[`locataires.${idx}.email`] = 'Email invalide';
      if (!validatePhone(loc.telephone)) newErrors[`locataires.${idx}.telephone`] = 'Téléphone invalide';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (candidature) {
        await axios.patch(`${API_BASE}/candidatures/${candidature.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE}/candidatures`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving candidature:', error);
      setErrors({ submit: error.response?.data?.error || 'Erreur lors de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  const addLocataire = () => {
    setFormData({
      ...formData,
      locataires: [...formData.locataires, { nom: '', prenom: '', email: '', telephone: '' }]
    });
  };

  const removeLocataire = (index) => {
    setFormData({
      ...formData,
      locataires: formData.locataires.filter((_, i) => i !== index)
    });
  };

  const updateLocataire = (index, field, value) => {
    const updated = [...formData.locataires];
    updated[index][field] = value;
    setFormData({ ...formData, locataires: updated });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {candidature ? 'Éditer Candidature' : 'Nouvelle Candidature'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <div className="text-red-800">{errors.submit}</div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Local *</label>
              <select
                value={formData.local_id}
                onChange={(e) => setFormData({ ...formData, local_id: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 ${errors.local_id ? 'border-red-500' : ''}`}
              >
                <option value="">Sélectionner un local</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.adresse} ({p.id})</option>
                ))}
              </select>
              {errors.local_id && <div className="text-red-600 text-xs mt-1">{errors.local_id}</div>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Propriétaire *</label>
              <select
                value={formData.proprietaire_id}
                onChange={(e) => setFormData({ ...formData, proprietaire_id: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 ${errors.proprietaire_id ? 'border-red-500' : ''}`}
              >
                <option value="">Sélectionner un propriétaire</option>
                {proprietaires.map(p => (
                  <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>
                ))}
              </select>
              {errors.proprietaire_id && <div className="text-red-600 text-xs mt-1">{errors.proprietaire_id}</div>}
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-semibold mb-2">Statut</label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="nouvelle">Nouvelle</option>
              <option value="acceptee">Acceptée</option>
              <option value="rejetee">Rejetée</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 h-20"
              placeholder="Notes additionnelles..."
            />
          </div>

          {/* Locataires */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Locataires *</h3>
              <button
                type="button"
                onClick={addLocataire}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                <Plus size={16} /> Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {formData.locataires.map((loc, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm">Locataire {idx + 1}</h4>
                    {formData.locataires.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLocataire(idx)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold mb-1 block">Nom *</label>
                      <input
                        type="text"
                        value={loc.nom}
                        onChange={(e) => updateLocataire(idx, 'nom', e.target.value)}
                        className={`w-full border rounded px-2 py-1 text-sm ${errors[`locataires.${idx}.nom`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`locataires.${idx}.nom`] && (
                        <div className="text-red-600 text-xs mt-1">{errors[`locataires.${idx}.nom`]}</div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold mb-1 block">Prénom *</label>
                      <input
                        type="text"
                        value={loc.prenom}
                        onChange={(e) => updateLocataire(idx, 'prenom', e.target.value)}
                        className={`w-full border rounded px-2 py-1 text-sm ${errors[`locataires.${idx}.prenom`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`locataires.${idx}.prenom`] && (
                        <div className="text-red-600 text-xs mt-1">{errors[`locataires.${idx}.prenom`]}</div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold mb-1 block">Email *</label>
                      <input
                        type="email"
                        value={loc.email}
                        onChange={(e) => updateLocataire(idx, 'email', e.target.value)}
                        className={`w-full border rounded px-2 py-1 text-sm ${errors[`locataires.${idx}.email`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`locataires.${idx}.email`] && (
                        <div className="text-red-600 text-xs mt-1">{errors[`locataires.${idx}.email`]}</div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold mb-1 block">Téléphone *</label>
                      <input
                        type="tel"
                        value={loc.telephone}
                        onChange={(e) => updateLocataire(idx, 'telephone', e.target.value)}
                        placeholder="+33 X XX XX XX XX"
                        className={`w-full border rounded px-2 py-1 text-sm ${errors[`locataires.${idx}.telephone`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`locataires.${idx}.telephone`] && (
                        <div className="text-red-600 text-xs mt-1">{errors[`locataires.${idx}.telephone`]}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

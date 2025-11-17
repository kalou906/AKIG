/**
 * 🏖️ Page Locations Saisonnières - Frontend React Premium
 * Airbnb/Booking/Réservations + Acompte/Solde
 */

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, TrendingUp, Plus, Check, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import API from '../services/api';

export default function SeasonalPage() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [revenueReport, setRevenueReport] = useState(null);
  const [showNewRes, setShowNewRes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
    guests_count: 1,
    nightly_rate_gnf: ''
  });

  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Charger propriétés (simulé pour démo)
  useEffect(() => {
    setProperties([
      { id: 1, title: 'Villa Prestige - Conakry', address: 'Kaloum', rooms: 4 },
      { id: 2, title: 'Appartement Cocody', address: 'Cocody', rooms: 2 },
      { id: 3, title: 'Maison - Kindia', address: 'Kindia', rooms: 3 }
    ]);
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      loadReservations();
      loadOccupancy();
      loadRevenueReport();
    }
  }, [selectedProperty]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await API.get(`/seasonal/reservations/${selectedProperty}`);
      setReservations(data.data || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOccupancy = async () => {
    try {
      const data = await API.get(`/seasonal/occupancy/${selectedProperty}/${currentMonth}/${currentYear}`);
      setOccupancy(data.data);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const loadRevenueReport = async () => {
    try {
      const data = await API.get(`/seasonal/revenue-report/${selectedProperty}/${currentYear}`);
      setRevenueReport(data.data);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const createReservation = async () => {
    try {
      if (!formData.guest_name || !formData.check_in_date || !formData.check_out_date) {
        alert('Remplissez tous les champs');
        return;
      }

      const result = await API.post('/seasonal/reservations', {
        property_id: selectedProperty,
        ...formData,
        guests_count: parseInt(formData.guests_count),
        nightly_rate_gnf: parseFloat(formData.nightly_rate_gnf)
      });

      alert(`✅ Réservation créée\n📊 Acompte: ${result.data.deposit} GNF\n💰 Total: ${result.data.total} GNF`);
      setFormData({
        guest_name: '', guest_email: '', guest_phone: '',
        check_in_date: '', check_out_date: '', guests_count: 1, nightly_rate_gnf: ''
      });
      setShowNewRes(false);
      loadReservations();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const recordDeposit = async (reservationId) => {
    try {
      const amount = prompt('Montant acompte (GNF):');
      if (!amount) return;

      const result = await API.post(`/seasonal/reservations/${reservationId}/deposit`, {
        amount_gnf: parseFloat(amount),
        payment_method: 'bank_transfer',
        payment_date: new Date().toISOString().split('T')[0],
        platform: 'manual'
      });

      alert(`✅ Acompte enregistré: ${result.data.amount} GNF`);
      loadReservations();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  // Données revenus mensuels
  const monthlyRevenueData = revenueReport ? revenueReport.monthlyBreakdown.map(m => ({
    month: months[m.month - 1],
    revenue: m.totalRevenue,
    nights: m.nights
  })) : [];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    checked_in: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏖️ Locations Saisonnières</h1>
          <p className="text-gray-600">Réservations, tarifs, acomptes et soldes</p>
        </div>
        <button
          onClick={() => setShowNewRes(true)}
          disabled={!selectedProperty}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Plus size={20} /> Nouvelle Réservation
        </button>
      </div>

      {/* Sélection propriété */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {properties.map(prop => (
          <div
            key={prop.id}
            onClick={() => setSelectedProperty(prop.id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition ${
              selectedProperty === prop.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <h4 className="font-semibold text-gray-900">{prop.title}</h4>
            <p className="text-xs text-gray-500 mt-1">📍 {prop.address}</p>
            <div className="mt-2 flex gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                🛏️ {prop.rooms} chambres
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Form nouvelle réservation */}
      {showNewRes && selectedProperty && (
        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <h3 className="text-lg font-semibold mb-4">➕ Nouvelle Réservation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom invité"
              value={formData.guest_name}
              onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.guest_email}
              onChange={(e) => setFormData({...formData, guest_email: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="tel"
              placeholder="Téléphone"
              value={formData.guest_phone}
              onChange={(e) => setFormData({...formData, guest_phone: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Nombre invités"
              value={formData.guests_count}
              onChange={(e) => setFormData({...formData, guests_count: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="date"
              value={formData.check_in_date}
              onChange={(e) => setFormData({...formData, check_in_date: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="date"
              value={formData.check_out_date}
              onChange={(e) => setFormData({...formData, check_out_date: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Tarif/nuit (GNF)"
              value={formData.nightly_rate_gnf}
              onChange={(e) => setFormData({...formData, nightly_rate_gnf: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={createReservation}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              ✅ Créer
            </button>
            <button
              onClick={() => setShowNewRes(false)}
              className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              ❌ Annuler
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      {selectedProperty && occupancy && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Occupation</p>
            <p className="text-3xl font-bold text-blue-600">{occupancy.occupancyRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">{occupancy.bookedNights} nuits</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Revenus</p>
            <p className="text-2xl font-bold text-green-600">{occupancy.totalRevenue.toLocaleString()} GNF</p>
            <p className="text-xs text-gray-500 mt-1">{occupancy.reservationCount} réservations</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Tarif Moyen</p>
            <p className="text-2xl font-bold text-purple-600">{occupancy.averagePricePerNight.toLocaleString()} GNF</p>
            <p className="text-xs text-gray-500 mt-1">par nuit</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Jours Dispo</p>
            <p className="text-3xl font-bold text-orange-600">{occupancy.daysInMonth - occupancy.bookedNights}</p>
            <p className="text-xs text-gray-500 mt-1">sur {occupancy.daysInMonth}</p>
          </div>
        </div>
      )}

      {/* Graphique revenus */}
      {monthlyRevenueData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">📊 Revenus Annuels</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} GNF`} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenus (GNF)" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-2">Total annuel: {revenueReport?.annualTotal.toLocaleString()} GNF</p>
        </div>
      )}

      {/* Tableau réservations */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar size={24} /> Réservations
          </h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Invité</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Dates</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Nuits</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center">Chargement...</td></tr>
            ) : reservations.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Aucune réservation</td></tr>
            ) : (
              reservations.map(res => (
                <tr key={res.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold">{res.guest_name}</p>
                      <p className="text-xs text-gray-500">{res.guest_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(res.check_in_date).toLocaleDateString('fr-FR')} →<br/>
                    {new Date(res.check_out_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 font-semibold">{res.nights} nuits</td>
                  <td className="px-6 py-4 font-bold text-green-600">{res.total_price_gnf?.toLocaleString()} GNF</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[res.status] || 'bg-gray-100'}`}>
                      {res.status === 'pending' && <Clock size={14} className="inline mr-1" />}
                      {res.status === 'confirmed' && <Check size={14} className="inline mr-1" />}
                      {res.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {res.status === 'pending' && (
                      <button
                        onClick={() => recordDeposit(res.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                      >
                        💰 Acompte
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

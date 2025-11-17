import React, { useState, useEffect } from 'react';
import api from '../api';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    contract_id: '',
    paid_at: new Date().toISOString().split('T')[0],
    amount: '',
    method: 'espèces',
    receipt_number: `REC-${Date.now()}`
  });

  useEffect(() => {
    loadPayments();
    loadContracts();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await api.get('/contracts');
      setContracts(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', formData);
      setShowForm(false);
      setFormData({
        contract_id: '',
        paid_at: new Date().toISOString().split('T')[0],
        amount: '',
        method: 'espèces',
        receipt_number: `REC-${Date.now()}`
      });
      loadPayments();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const downloadReceipt = async (paymentId, receiptNumber) => {
    try {
      const response = await api.get(`/payments/${paymentId}/receipt`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Gestion des Paiements</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {showForm ? 'Annuler' : 'Nouveau Paiement'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h3>Nouveau Paiement</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select name="contract_id" value={formData.contract_id} onChange={handleChange} required>
              <option value="">Sélectionner un contrat</option>
              {contracts.map(contract => (
                <option key={contract.id} value={contract.id}>
                  {contract.property_name} - {contract.tenant_name}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="paid_at"
              value={formData.paid_at}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="amount"
              placeholder="Montant"
              value={formData.amount}
              onChange={handleChange}
              required
            />
            <select name="method" value={formData.method} onChange={handleChange}>
              <option value="espèces">Espèces</option>
              <option value="chèque">Chèque</option>
              <option value="virement">Virement</option>
              <option value="carte">Carte</option>
            </select>
            <input
              type="text"
              name="receipt_number"
              placeholder="Numéro de reçu"
              value={formData.receipt_number}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
            Enregistrer le paiement
          </button>
        </form>
      )}

      <div>
        <h3>Liste des Paiements ({payments.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Propriété</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Locataire</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Montant</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Méthode</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{payment.property_name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{payment.tenant_name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(payment.paid_at).toLocaleDateString()}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{payment.amount} €</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{payment.method}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button 
                    onClick={() => downloadReceipt(payment.id, payment.receipt_number)}
                    style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                  >
                    📄 Reçu
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Payments;
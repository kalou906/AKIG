import React, { useState, useEffect } from 'react';
import api from '../api';

function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    property_name: '',
    tenant_name: '',
    start_date: '',
    end_date: '',
    monthly_rent: '',
    status: 'actif'
  });

  useEffect(() => {
    loadContracts();
  }, []);

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
      await api.post('/contracts', formData);
      setShowForm(false);
      setFormData({
        property_name: '',
        tenant_name: '',
        start_date: '',
        end_date: '',
        monthly_rent: '',
        status: 'actif'
      });
      loadContracts();
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Gestion des Contrats</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {showForm ? 'Annuler' : 'Nouveau Contrat'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h3>Nouveau Contrat</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input
              type="text"
              name="property_name"
              placeholder="Nom de la propriété"
              value={formData.property_name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="tenant_name"
              placeholder="Nom du locataire"
              value={formData.tenant_name}
              onChange={handleChange}
              required
            />
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="monthly_rent"
              placeholder="Loyer mensuel"
              value={formData.monthly_rent}
              onChange={handleChange}
              required
            />
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
          <button type="submit" style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
            Créer le contrat
          </button>
        </form>
      )}

      <div>
        <h3>Liste des Contrats ({contracts.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Propriété</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Locataire</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Loyer</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(contract => (
              <tr key={contract.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{contract.property_name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{contract.tenant_name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{contract.monthly_rent} €</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <span style={{ 
                    color: contract.status === 'actif' ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
                    {contract.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Contracts;
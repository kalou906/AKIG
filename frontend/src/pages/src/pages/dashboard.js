import React from 'react';

function Dashboard() {
  return (
    <div>
      <h1>Tableau de Bord AKIG</h1>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px', flex: 1 }}>
          <h3>Contrats Actifs</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px', flex: 1 }}>
          <h3>Paiements Ce Mois</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0 €</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px', flex: 1 }}>
          <h3>Reçus Générés</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
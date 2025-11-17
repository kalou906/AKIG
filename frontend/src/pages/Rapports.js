import React from 'react';

export default function Rapports() {
  return (
    <main className="page rapports">
      <div className="container">
        <h2>Rapports</h2>
        <p>Statistiques et analyses</p>

        <div className="cards">
          <div className="card">
            <h3>Revenus</h3>
            <p>Analyse des revenus locatifs</p>
          </div>
          <div className="card">
            <h3>Occupations</h3>
            <p>Taux d'occupation des biens</p>
          </div>
          <div className="card">
            <h3>Impayés</h3>
            <p>Suivi des retards de paiement</p>
          </div>
        </div>
      </div>
    </main>
  );
}
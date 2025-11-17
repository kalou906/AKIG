import React from 'react';

export default function Resilience() {
  return (
    <main className="page resilience">
      <div className="container">
        <h2>Résilience</h2>
        <p>Plan de continuité et sécurité</p>

        <div className="grid" style={{ marginTop: 16 }}>
          <div className="card" style={{ gridColumn: 'span 6' }}>
            <h3 className="title">Procédures coupure</h3>
            <div className="item">Mode offline: noter paiements sur papier + saisie ultérieure</div>
            <div className="item">Fallback SMS: confirmations critiques par SMS</div>
          </div>
          <div className="card" style={{ gridColumn: 'span 6' }}>
            <h3 className="title">Canaux locaux</h3>
            <div className="item">WhatsApp groupes propriétaires</div>
            <div className="item">Radio/annonces locales si besoin</div>
          </div>
        </div>
      </div>
    </main>
  );
}
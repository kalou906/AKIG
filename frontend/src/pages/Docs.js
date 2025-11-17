import React from 'react';

export default function Docs() {
  return (
    <main className="page docs">
      <div className="container">
        <h2>Documentation</h2>
        <p>Documentation technique et guides</p>

        <div className="grid" style={{ marginTop: 16 }}>
          <div className="card" style={{ gridColumn: 'span 6' }}>
            <h3 className="title">Diagrammes UML</h3>
            <p className="muted">Cas d'utilisation et séquences.</p>
            <div className="item">UC: Créer contrat → Valider → Générer PDF</div>
            <div className="item">UC: Enregistrer paiement → PDF → SMS</div>
          </div>
          <div className="card" style={{ gridColumn: 'span 6' }}>
            <h3 className="title">Schéma base de données</h3>
            <p className="muted">Users, Contracts, Payments.</p>
            <div className="item">users(id, name, email, role, password_hash)</div>
            <div className="item">contracts(id, property_name, tenant_name, dates, rent, status, owner_id)</div>
            <div className="item">payments(id, contract_id, paid_at, amount, method, receipt_number)</div>
          </div>
          <div className="card" style={{ gridColumn: 'span 12' }}>
            <h3 className="title">Checklists opérationnelles</h3>
            <div className="item">Matin: vérifier /api/health, sauvegardes OK</div>
            <div className="item">Jour: encaisser, relancer, envoyer résumés</div>
            <div className="item">Soir: pg_dump, copie externe</div>
          </div>
        </div>
      </div>
    </main>
  );
}
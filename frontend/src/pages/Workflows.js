import React from 'react';

export default function Workflows() {
  return (
    <main className="page workflows">
      <div className="container">
        <h2>Workflows</h2>
        <p>Automatisation des processus</p>

        <div className="grid" style={{ marginTop: 16 }}>
          <div className="card" style={{ gridColumn: 'span 4' }}>
            <h3 className="title">Authentification</h3>
            <p className="muted">JWT, OTP (optionnel).</p>
            <div className="item">Login → Token (7 jours)</div>
            <div className="item">OTP par SMS (fallback en local)</div>
          </div>
          <div className="card" style={{ gridColumn: 'span 4' }}>
            <h3 className="title">Audit logs</h3>
            <p className="muted">Traçabilité "qui a fait quoi, quand".</p>
            <div className="item">Création contrat — Agent — 10:32</div>
            <div className="item">Paiement — Comptable — 14:05</div>
          </div>
          <div className="card" style={{ gridColumn: 'span 4' }}>
            <h3 className="title">Sauvegardes</h3>
            <p className="muted">Local + cloud (quand dispo).</p>
            <div className="item">pg_dump quotidien</div>
            <div className="item">Copie sur disque externe</div>
          </div>
        </div>
      </div>
    </main>
  );
}
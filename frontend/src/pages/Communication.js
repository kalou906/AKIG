import React from 'react';

export default function Communication() {
  return (
    <main className="page communication">
      <div className="container">
        <h2>Communication</h2>
        <p>Gérer les communications avec les locataires</p>

        <div className="cards">
          <div className="card">
            <h3>Email</h3>
            <p>Envoyer des emails automatisés</p>
          </div>
          <div className="card">
            <h3>SMS</h3>
            <p>Envoyer des notifications SMS</p>
          </div>
          <div className="card">
            <h3>Documents</h3>
            <p>Gérer les documents importants</p>
          </div>
        </div>
      </div>
    </main>
  );
}
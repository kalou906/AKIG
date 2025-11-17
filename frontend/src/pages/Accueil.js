import React from 'react';

export default function Accueil() {
  return (
    <main className="page accueil">
      <div className="container">
        <h2>Bienvenue sur AKIG</h2>
        <p>Tableau de bord de gestion immobilière — aperçu rapide</p>

        <section className="cards">
          <div className="card">Contrats actifs<br/><strong>12</strong></div>
          <div className="card">Paiements ce mois<br/><strong>8</strong></div>
          <div className="card">Tickets ouverts<br/><strong>3</strong></div>
        </section>
      </div>
    </main>
  );
}

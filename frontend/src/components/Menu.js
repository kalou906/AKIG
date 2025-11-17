import React from 'react';

export default function Menu({ tab, setTab }) {
  const items = [
    { id: 'accueil', label: 'Accueil' },
    { id: 'dashboards', label: 'Dashboards' },
    { id: 'contrats', label: 'Contrats' },
    { id: 'paiements', label: 'Paiements' },
    { id: 'communication', label: 'Communication' },
    { id: 'rapports', label: 'Rapports' },
    { id: 'workflows', label: 'Workflows' },
    { id: 'docs', label: 'Docs' },
    { id: 'resilience', label: 'Résilience' },
  ];

  return (
    <aside className="akig-menu">
      <nav>
        <ul>
          {items.map((it) => (
            <li key={it.id} className={tab === it.id ? 'active' : ''}>
              <button onClick={() => setTab(it.id)}>{it.label}</button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

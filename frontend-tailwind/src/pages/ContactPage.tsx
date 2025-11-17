const CHANNELS = [
  {
    label: 'Conciergerie AKIG Première',
    value: '+224 620 00 00 77',
    description: 'Support prioritaire 24/7 pour les clients premium.'
  },
  {
    label: 'Direction Patrimoine',
    value: 'patrimoine@akig-premiere.com',
    description: 'Coordination stratégique et arbitrages d’investissement.'
  },
  {
    label: 'Support juridique',
    value: 'legal@akig-premiere.com',
    description: 'Gestion des baux, avenants et contentieux.'
  }
];

export default function ContactPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-akig-blue">Votre équipe dédiée</h2>
        <p className="mt-2 text-sm text-akig-blue/70">
          Retrouvez tous les points de contact stratégiques pour piloter votre portefeuille immobilier AKIG.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {CHANNELS.map((channel) => (
            <div key={channel.label} className="rounded-2xl border border-akig-blue/10 bg-white/80 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-akig-blue/60">{channel.label}</p>
              <p className="mt-2 text-base font-semibold text-akig-blue">{channel.value}</p>
              <p className="mt-2 text-akig-blue/60">{channel.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-akig-blue">Planifier un comité stratégique</h3>
          <p className="mt-2 text-sm text-akig-blue/70">
            Organisez un comité trimestriel pour piloter investissements, arbitrages et priorités d’expansion.
          </p>
          <form className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-akig-blue/60" htmlFor="fullname">Nom complet</label>
              <input
                id="fullname"
                type="text"
                placeholder="Nom et prénom"
                className="mt-1 w-full rounded-xl border border-akig-blue/20 bg-white/80 px-4 py-2 text-sm text-akig-blue outline-none ring-akig-blue/30 focus:ring-2"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-akig-blue/60" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="vous@entreprise.com"
                  className="mt-1 w-full rounded-xl border border-akig-blue/20 bg-white/80 px-4 py-2 text-sm text-akig-blue outline-none ring-akig-blue/30 focus:ring-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-akig-blue/60" htmlFor="slot">Créneau souhaité</label>
                <select
                  id="slot"
                  className="mt-1 w-full rounded-xl border border-akig-blue/20 bg-white/80 px-4 py-2 text-sm text-akig-blue outline-none ring-akig-blue/30 focus:ring-2"
                >
                  <option>Comité stratégique (90 min)</option>
                  <option>Session département juridique (60 min)</option>
                  <option>Visite terrain (demi-journée)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-akig-blue/60" htmlFor="message">Objectifs</label>
              <textarea
                id="message"
                rows={4}
                placeholder="Décrivez vos priorités pour la prochaine session"
                className="mt-1 w-full rounded-xl border border-akig-blue/20 bg-white/80 px-4 py-2 text-sm text-akig-blue outline-none ring-akig-blue/30 focus:ring-2"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-akig-blue px-5 py-2 text-sm font-semibold text-white shadow"
            >
              🤝 Planifier avec AKIG
            </button>
          </form>
        </div>

        <aside className="glass-card space-y-4 p-6">
          <div>
            <h3 className="text-base font-semibold text-akig-blue">Services exclusifs</h3>
            <p className="text-sm text-akig-blue/70">Des experts mobilisés selon vos enjeux prioritaire.</p>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="rounded-2xl border border-akig-blue/10 bg-white/80 p-4">
              <p className="font-semibold text-akig-blue">Audit patrimoine & digital twin</p>
              <p className="text-akig-blue/60">Cartographie 3D et scénarios de valorisation.</p>
            </li>
            <li className="rounded-2xl border border-akig-blue/10 bg-white/80 p-4">
              <p className="font-semibold text-akig-blue">Modélisation financière</p>
              <p className="text-akig-blue/60">Prévisions de cash-flow et arbitrages d’investissement.</p>
            </li>
            <li className="rounded-2xl border border-akig-blue/10 bg-white/80 p-4">
              <p className="font-semibold text-akig-blue">Observatoire réglementaire</p>
              <p className="text-akig-blue/60">Veille foncière et recommandations légales.</p>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

import React from 'react';

interface NoAccessProps {
  role: string;
  featureCount: number;
}

export default function NoAccess({ role, featureCount }: NoAccessProps): React.ReactElement {
  return (
    <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8 text-center text-rose-100">
      <h3 className="text-2xl font-semibold">Accès restreint</h3>
      <p className="mt-4 text-sm text-rose-200">
        Le rôle <strong className="font-semibold text-white">{role}</strong> ne dispose pas d’autorisations actives pour les modules sélectionnés.
      </p>
      <p className="mt-2 text-xs text-rose-200/80">
        {featureCount === 0
          ? 'Aucun feature flag activé. Activez les modules prioritaires dans FEATURE_FLAGS.'
          : 'Vérifiez les feature flags et la matrice des rôles pour débloquer l’interface.'}
      </p>
    </div>
  );
}

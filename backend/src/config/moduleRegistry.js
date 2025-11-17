const MODULE_REGISTRY = [
  {
    id: 'payments',
    name: 'Enregistrement des paiements',
    description: 'Encaissez les loyers plus vite et réduisez les erreurs de saisie.',
    route: '/app/paiements',
    featureFlag: 'payments',
    requiredRoles: ['admin', 'manager', 'agent'],
    category: 'finance',
  },
  {
    id: 'sms',
    name: 'Communication SMS',
    description: 'Envoyez des confirmations et rappels instantanés aux bailleurs.',
    route: '/app/sms',
    featureFlag: 'sms',
    requiredRoles: ['admin', 'manager'],
    category: 'communication',
  },
  {
    id: 'dashboard',
    name: 'Tableaux de bord',
    description: 'Visualisez vos retards et priorisez les relances en un coup d’œil.',
    route: '/app/impayes',
    featureFlag: 'dashboard',
    requiredRoles: ['admin', 'manager', 'analyst'],
    category: 'analytics',
  },
];

function serializeModules(featureFlagMap) {
  return MODULE_REGISTRY.map((module) => {
    const flagKey = module.featureFlag || module.id;
    const enabled = Boolean(
      typeof featureFlagMap.get === 'function'
        ? featureFlagMap.get(flagKey)
        : featureFlagMap[flagKey]
    );

    return {
      ...module,
      enabled,
    };
  });
}

function getActiveModules(featureFlagMap) {
  return serializeModules(featureFlagMap).filter((module) => module.enabled);
}

module.exports = {
  MODULE_REGISTRY,
  serializeModules,
  getActiveModules,
};

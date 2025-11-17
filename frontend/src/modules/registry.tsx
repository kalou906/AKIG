import React, { lazy } from 'react';
import type { FeatureFlagMap } from '../config/environment';

export interface FrontendModuleDefinition {
  id: string;
  title: string;
  description: string;
  featureFlag: string;
  route: string;
  requiredRoles: string[];
  icon: string;
  Component: React.LazyExoticComponent<React.ComponentType<unknown>>;
}

export interface ResolvedModule extends FrontendModuleDefinition {
  accessible: boolean;
  reason?: string;
}

const MODULE_DEFINITIONS: FrontendModuleDefinition[] = [
  {
    id: 'payments',
    title: 'Enregistrement rapide des paiements',
    description: 'Saisissez un loyer en moins de deux minutes et gardez un historique complet.',
    featureFlag: 'payments',
    route: '/app/paiements',
    requiredRoles: ['admin', 'manager', 'agent'],
    icon: '💳',
    Component: lazy(() => import('./PaymentsQuickAction')),
  },
  {
    id: 'sms',
    title: 'SMS automatiques aux propriétaires',
    description: 'Confirmez chaque paiement et envoyez des rappels transparents aux bailleurs.',
    featureFlag: 'sms',
    route: '/app/sms',
    requiredRoles: ['admin', 'manager'],
    icon: '📨',
    Component: lazy(() => import('./SmsAutomationModule')),
  },
  {
    id: 'dashboard',
    title: 'Tableau de bord des impayés',
    description: 'Visualisez les loyers en retard et priorisez les relances immédiates.',
    featureFlag: 'dashboard',
    route: '/app/impayes',
    requiredRoles: ['admin', 'manager', 'analyst'],
    icon: '📊',
    Component: lazy(() => import('./ArrearsDashboardModule')),
  },
];

export function resolveModules(featureFlags: FeatureFlagMap, userRole: string): ResolvedModule[] {
  return MODULE_DEFINITIONS.map((definition) => {
    const flagEnabled = Boolean(featureFlags[definition.featureFlag]);
    const roleAllowed = definition.requiredRoles.length === 0 || definition.requiredRoles.includes(userRole);
    const accessible = flagEnabled && roleAllowed;

    let reason: string | undefined;
    if (!flagEnabled) {
      reason = 'Module désactivé par feature flag';
    } else if (!roleAllowed) {
      reason = `Rôle ${userRole} non autorisé`;
    }

    return {
      ...definition,
      accessible,
      reason,
    };
  });
}

export { MODULE_DEFINITIONS };

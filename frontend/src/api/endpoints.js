// Central registry of backend API endpoints for Pro / Genius modes
// Categorized for UI grouping and exploration.

export const ENDPOINT_CATEGORIES = [
  {
    id: 'core',
    label: 'Core',
    items: [
      { key: 'auth', path: '/api/auth' },
      { key: 'contracts', path: '/api/contracts' },
      { key: 'payments', path: '/api/payments' },
      { key: 'properties', path: '/api/properties' },
      { key: 'tenants', path: '/api/tenants' },
      { key: 'users', path: '/api/users' },
      { key: 'roles', path: '/api/roles' },
      { key: 'clients', path: '/api/clients' },
      { key: 'owners', path: '/api/owners' },
      { key: 'units', path: '/api/units' },
      { key: 'health', path: '/api/health' },
    ]
  },
  {
    id: 'finance',
    label: 'Finance / Reports',
    items: [
      { key: 'exports', path: '/api/exports' },
      { key: 'reports', path: '/api/reports' },
      { key: 'reporting', path: '/api/reporting' },
      { key: 'metrics', path: '/api/metrics' },
      { key: 'arrears', path: '/api/arrears' },
      { key: 'rentPayments', path: '/api/rentPayments' },
      { key: 'paymentsAdvanced', path: '/api/payments-advanced' },
      { key: 'paymentsNew', path: '/api/payments-new' },
      { key: 'paymentsReport', path: '/api/payments-report' },
      { key: 'phase2_payments', path: '/api/phase2_payments' },
    ]
  },
  {
    id: 'ai',
    label: 'AI & Predictions',
    items: [
      { key: 'ai', path: '/api/ai' },
      { key: 'aiPredictions', path: '/api/ai-predictions' },
      { key: 'proactiveAI', path: '/api/proactive-ai' },
      { key: 'aiAssist', path: '/api/aiAssist' },
      { key: 'aiAdvanced', path: '/api/ai-advanced' },
      { key: 'machineLearning', path: '/api/machine-learning' },
    ]
  },
  {
    id: 'advanced',
    label: 'Advanced / Ops',
    items: [
      { key: 'alerts', path: '/api/alerts' },
      { key: 'notifications', path: '/api/notifications' },
      { key: 'tasks', path: '/api/tasks' },
      { key: 'ownerPortal', path: '/api/ownerPortal' },
      { key: 'tenantPortal', path: '/api/tenant-portal' },
      { key: 'opsDashboard', path: '/api/opsDashboard' },
      { key: 'maintenance', path: '/api/maintenance' },
      { key: 'attachments', path: '/api/attachments' },
      { key: 'import', path: '/api/import' },
      { key: 'dataExport', path: '/api/dataExport' },
      { key: 'search', path: '/api/search' },
      { key: 'widgets', path: '/api/widgets' },
      { key: 'webhooks', path: '/api/webhooks' },
      { key: 'preferences', path: '/api/preferences' },
      { key: 'validation', path: '/api/validation' },
      { key: 'recouvrement', path: '/api/recouvrement' },
    ]
  },
  {
    id: 'market',
    label: 'Marché & Géographie',
    items: [
      { key: 'marketReporting', path: '/api/market-reporting' },
      { key: 'placeMarche', path: '/api/place-marche' },
      { key: 'cartographie', path: '/api/cartographie-géographique' },
      { key: 'guinea', path: '/api/guinea' },
    ]
  },
  {
    id: 'dashboards',
    label: 'Dashboards & Analytics',
    items: [
      { key: 'dashboard', path: '/api/dashboard' },
      { key: 'superDashboard', path: '/api/super-dashboard' },
      { key: 'analytics', path: '/api/analytics' },
      { key: 'analyticsAdvanced', path: '/api/analytics-advanced' },
      { key: 'dashboardPerso', path: '/api/dashboard-personnalisé' },
    ]
  },
  {
    id: 'authz',
    label: 'Sécurité & Auth',
    items: [
      { key: 'authNew', path: '/api/auth-new' },
      { key: 'authExamples', path: '/api/auth-examples' },
      { key: 'secureExample', path: '/api/secureExample' },
      { key: 'privacy', path: '/api/privacy' },
      { key: 'rbac', path: '/api/rbac-example' },
      { key: 'twoFA', path: '/api/2fa' },
    ]
  },
];

export function buildEndpointUrl(path) {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  return base + path;
}

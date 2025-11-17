# AKIG — Inventaire exhaustif (généré)

Date: 2025-11-08

Ce document recense, par catégories, les éléments principaux du logiciel présents actuellement dans le dépôt. Il couvre surtout le code (backend/src et frontend/src) et le registre d’API. La documentation est massive et déjà indexée via de nombreux fichiers d’index au root (INDEX_*.md/txt, README_*.md, etc.).

---

## Résumé quantitatif

- Backend (routes Express): 240 fichiers trouvés
- Frontend
  - Components: 248 fichiers
  - Pages: 208 fichiers
  - API (clients/services centralisés): 10 fichiers
  - Context: 2 fichiers
  - Hooks: 30 fichiers
  - Services (legacy/auxiliaires): 8 fichiers
  - Store (slices): 6 fichiers
  - Utils: 14 fichiers
  - Modules: 8 fichiers

Base URL API (frontend): `REACT_APP_API_URL || http://localhost:4000`

---

## Registre API — catégories et endpoints (frontend/src/api/endpoints.js)

- Core: /api/auth, /api/contracts, /api/payments, /api/properties, /api/tenants, /api/users, /api/roles, /api/clients, /api/owners, /api/units, /api/health
- Finance / Reports: /api/exports, /api/reports, /api/reporting, /api/metrics, /api/arrears, /api/rentPayments, /api/payments-advanced, /api/payments-new, /api/payments-report, /api/phase2_payments
- AI & Predictions: /api/ai, /api/ai-predictions, /api/proactive-ai, /api/aiAssist, /api/ai-advanced, /api/machine-learning
- Advanced / Ops: /api/alerts, /api/notifications, /api/tasks, /api/ownerPortal, /api/tenant-portal, /api/opsDashboard, /api/maintenance, /api/attachments, /api/import, /api/dataExport, /api/search, /api/widgets, /api/webhooks, /api/preferences, /api/validation, /api/recouvrement
- Marché & Géographie: /api/market-reporting, /api/place-marche, /api/cartographie-géographique, /api/guinea
- Dashboards & Analytics: /api/dashboard, /api/super-dashboard, /api/analytics, /api/analytics-advanced, /api/dashboard-personnalisé
- Sécurité & Auth: /api/auth-new, /api/auth-examples, /api/secureExample, /api/privacy, /api/rbac-example, /api/2fa

---

## Backend — routes Express (liste complète)

(240 fichiers; certains peuvent apparaître en doublon selon la recherche)

c:\AKIG\backend\src\routes\alerts.js
c:\AKIG\backend\src\routes\aiContractSuggestions.js
c:\AKIG\backend\src\routes\audit.js
c:\AKIG\backend\src\routes\auth-examples.js
c:\AKIG\backend\src\routes\attachments.js
c:\AKIG\backend\src\routes\arrears.js
c:\AKIG\backend\src\routes\archive.js
c:\AKIG\backend\src\routes\application-mobile.routes.js
c:\AKIG\backend\src\routes\analytics.ts
c:\AKIG\backend\src\routes\analytics.js
c:\AKIG\backend\src\routes\analytics-advanced.routes.js
c:\AKIG\backend\src\routes\aiAssist.ts
c:\AKIG\backend\src\routes\ai.js
c:\AKIG\backend\src\routes\ai-predictions.js
c:\AKIG\backend\src\routes\auth-new.js
c:\AKIG\backend\src\routes\ai-advanced.routes.js
c:\AKIG\backend\src\routes\agents.ts
c:\AKIG\backend\src\routes\agents.js
c:\AKIG\backend\src\routes\auth.js
c:\AKIG\backend\src\routes\agents-expert.js
c:\AKIG\backend\src\routes\agency.js
c:\AKIG\backend\src\routes\auth_logout.js
c:\AKIG\backend\src\routes\advanced-features.routes.js
c:\AKIG\backend\src\routes\accounting-genius.js
c:\AKIG\backend\src\routes\2fa.js
c:\AKIG\backend\src\routes\branding.routes.js
c:\AKIG\backend\src\routes\csvImport.js
c:\AKIG\backend\src\routes\core.js
c:\AKIG\backend\src\routes\contractTemplates.js
c:\AKIG\backend\src\routes\contracts.ts
c:\AKIG\backend\src\routes\contracts.js
c:\AKIG\backend\src\routes\contracts-new.js
c:\AKIG\backend\src\routes\contracts-expert.js
c:\AKIG\backend\src\routes\ged.js
c:\AKIG\backend\src\routes\feedback.js
c:\AKIG\backend\src\routes\feedback-simple.js
c:\AKIG\backend\src\routes\exports.routes.js
c:\AKIG\backend\src\routes\exports.js
c:\AKIG\backend\src\routes\disputes-expert.js
c:\AKIG\backend\src\routes\devPortal.js
c:\AKIG\backend\src\routes\deposits.js
c:\AKIG\backend\src\routes\dataExport.js
c:\AKIG\backend\src\routes\dashboard.ts
c:\AKIG\backend\src\routes\dashboard.js
c:\AKIG\backend\src\routes\governance-blockchain.js
c:\AKIG\backend\src\routes\dashboard-personnalisé.routes.js
c:\AKIG\backend\src\routes\modules.js
c:\AKIG\backend\src\routes\notifications.js
c:\AKIG\backend\src\routes\notices.ts
c:\AKIG\backend\src\routes\opsDashboard.js
c:\AKIG\backend\src\routes\metrics.js
c:\AKIG\backend\src\routes\market-reporting.routes.js
c:\AKIG\backend\src\routes\maintenance.js
c:\AKIG\backend\src\routes\machine-learning.routes.js
c:\AKIG\backend\src\routes\ownerPortal.js
c:\AKIG\backend\src\routes\leads.routes.js
c:\AKIG\backend\src\routes\importPayments.js
c:\AKIG\backend\src\routes\import.js
c:\AKIG\backend\src\routes\immobilier-loyer.js
c:\AKIG\backend\src\routes\i18n.routes.js
c:\AKIG\backend\src\routes\hyperscalability.js
c:\AKIG\backend\src\routes\healthCheckMultiLevel.ts
c:\AKIG\backend\src\routes\owners.js
c:\AKIG\backend\src\routes\health.js
c:\AKIG\backend\src\routes\guinea.routes.js
c:\AKIG\backend\src\routes\clients.js
c:\AKIG\backend\src\routes\chatbot.routes.js
c:\AKIG\backend\src\routes\chat.js
c:\AKIG\backend\src\routes\cartographie-géographique.routes.js
c:\AKIG\backend\src\routes\paiements-avancé.routes.js
c:\AKIG\backend\src\routes\payments.js
c:\AKIG\backend\src\routes\paymentsImport.ts
c:\AKIG\backend\src\routes\payments-new.js
c:\AKIG\backend\src\routes\payments-expert.js
c:\AKIG\backend\src\routes\payments-advanced.js
c:\AKIG\backend\src\routes\pdf.routes.js
c:\AKIG\backend\src\routes\paymentsReport.js
c:\AKIG\backend\src\routes\carte.ts
c:\AKIG\backend\src\routes\candidatures.js
c:\AKIG\backend\src\routes\privacy.js
c:\AKIG\backend\src\routes\proactive-ai.js
c:\AKIG\backend\src\routes\properties-expert.js
c:\AKIG\backend\src\routes\preferences.js
c:\AKIG\backend\src\routes\preavis.js
c:\AKIG\backend\src\routes\place-marche.routes.js
c:\AKIG\backend\src\routes\phase5_maintenance.js
c:\AKIG\backend\src\routes\properties.js
c:\AKIG\backend\src\routes\phase4_tenants.js
c:\AKIG\backend\src\routes\phase3_reports.js
c:\AKIG\backend\src\routes\phase2_payments.js
c:\AKIG\backend\src\routes\rapports-email.routes.js
c:\AKIG\backend\src\routes\roles.js
c:\AKIG\backend\src\routes\reports_phase10.js
c:\AKIG\backend\src\routes\reports.js
c:\AKIG\backend\src\routes\reporting.js
c:\AKIG\backend\src\routes\reporting-expert.js
c:\AKIG\backend\src\routes\search.js
c:\AKIG\backend\src\routes\secureExample.js
c:\AKIG\backend\src\routes\tenants-new.js
c:\AKIG\backend\src\routes\tenants.ts
c:\AKIG\backend\src\routes\tenants.js
c:\AKIG\backend\src\routes\webhooks.js
c:\AKIG\backend\src\routes\widgets.js
c:\AKIG\backend\src\routes\validation.js
c:\AKIG\backend\src\routes\user_profile.js
c:\AKIG\backend\src\routes\users.js
c:\AKIG\backend\src\routes\units.js
c:\AKIG\backend\src\routes\test.routes.js
c:\AKIG\backend\src\routes\tenants-expert.js
c:\AKIG\backend\src\routes\tenant-portal.js
c:\AKIG\backend\src\routes\tasks.js
c:\AKIG\backend\src\routes\super-dashboard.routes.js
c:\AKIG\backend\src\routes\settlements.js
c:\AKIG\backend\src\routes\rentPayments.js
c:\AKIG\backend\src\routes\rentalContracts.js
c:\AKIG\backend\src\routes\recouvrement.ts
c:\AKIG\backend\src\routes\recherche-avancée.routes.js
c:\AKIG\backend\src\routes\rbac-example.js
c:\AKIG\backend\src\routes\routes\exports.routes.js
c:\AKIG\backend\src\routes\__tests__\exports.test.js
(… et re-listings possibles selon l’outil de recherche)

---

## Frontend — Components (liste complète)

(248 fichiers trouvés)

c:\AKIG\frontend\src\components\AddButton.tsx
c:\AKIG\frontend\src\components\ActionBar.tsx
c:\AKIG\frontend\src\components\AdvancedRealtimeDashboard.jsx
c:\AKIG\frontend\src\components\AiContractAssistant.tsx
c:\AKIG\frontend\src\components\AiCommandPalette.tsx
c:\AKIG\frontend\src\components\AiAssistant.tsx
c:\AKIG\frontend\src\components\Alert.jsx
c:\AKIG\frontend\src\components\AlertSimple.tsx
c:\AKIG\frontend\src\components\AutoLogout.tsx
c:\AKIG\frontend\src\components\AKIGAssistant.tsx
c:\AKIG\frontend\src\components\AiSearch.tsx
c:\AKIG\frontend\src\components\AiRecoveryAssistant.tsx
c:\AKIG\frontend\src\components\DeleteTenantButton.tsx
c:\AKIG\frontend\src\components\DiagnosticsPanel.tsx
c:\AKIG\frontend\src\components\EnhancedContractGenerator.tsx
c:\AKIG\frontend\src\components\DepositTable.jsx
c:\AKIG\frontend\src\components\DataTable.tsx
c:\AKIG\frontend\src\components\DataGrid.tsx
c:\AKIG\frontend\src\components\DarkModeToggle.tsx
c:\AKIG\frontend\src\components\ContractGenerator.tsx
c:\AKIG\frontend\src\components\ContractEngineDemo.tsx
c:\AKIG\frontend\src\components\ExportButtons.tsx
c:\AKIG\frontend\src\components\ai\AIInsights.jsx
c:\AKIG\frontend\src\components\Footer.js
c:\AKIG\frontend\src\components\FocusTrap.tsx
c:\AKIG\frontend\src\components\FiltersRow.tsx
c:\AKIG\frontend\src\components\FiltersBar.tsx
c:\AKIG\frontend\src\components\FileUploader.jsx
c:\AKIG\frontend\src\components\FormBuilder.tsx
c:\AKIG\frontend\src\components\ErrorBoundaryRobust.tsx
c:\AKIG\frontend\src\components\ErrorBoundaryRobust.jsx
c:\AKIG\frontend\src\components\ErrorBoundaryRobust.d.ts
c:\AKIG\frontend\src\components\FormBuilderPremium.tsx
c:\AKIG\frontend\src\components\ErrorBoundary.tsx
c:\AKIG\frontend\src\components\FormField.jsx
c:\AKIG\frontend\src\components\ErrorBoundary.jsx
c:\AKIG\frontend\src\components\ConfirmModal.tsx
c:\AKIG\frontend\src\components\ChatWindow.jsx
c:\AKIG\frontend\src\components\CardSimple.tsx
c:\AKIG\frontend\src\components\Card.jsx
c:\AKIG\frontend\src\components\CandidatureForm.jsx
c:\AKIG\frontend\src\components\ButtonSimple.tsx
c:\AKIG\frontend\src\components\ButtonSimple.jsx
c:\AKIG\frontend\src\components\ButtonGroup.tsx
c:\AKIG\frontend\src\components\Button.jsx
c:\AKIG\frontend\src\components\FormField.tsx
c:\AKIG\frontend\src\components\BulkActions.tsx
c:\AKIG\frontend\src\components\BootGate.tsx
c:\AKIG\frontend\src\components\Badge.tsx
c:\AKIG\frontend\src\components\Badge.jsx
c:\AKIG\frontend\src\components\genius\GeniusPanel.jsx
c:\AKIG\frontend\src\components\OwnerKPI.tsx
c:\AKIG\frontend\src\components\OwnerKPI.examples.tsx
c:\AKIG\frontend\src\components\genius\EndpointStatusGrid.jsx
c:\AKIG\frontend\src\components\Pagination.tsx
c:\AKIG\frontend\src\components\genius\ApiExplorer.jsx
c:\AKIG\frontend\src\components\PaymentsChart.tsx
c:\AKIG\frontend\src\components\Payments.js
c:\AKIG\frontend\src\components\Feedback\Feedback.examples.tsx
c:\AKIG\frontend\src\components\PaymentMethodsComponent.jsx
c:\AKIG\frontend\src\components\NotificationCenter.tsx
c:\AKIG\frontend\src\components\Feedback\FeedbackDashboard.tsx
c:\AKIG\frontend\src\components\NoAccess.tsx
c:\AKIG\frontend\src\components\NetworkBanner.tsx
c:\AKIG\frontend\src\components\PropertyAnalysisDashboard.jsx
c:\AKIG\frontend\src\components\PrimaryButton.test.jsx
c:\AKIG\frontend\src\components\PrimaryButton.jsx
c:\AKIG\frontend\src\components\Feedback\FeedbackForm.tsx
c:\AKIG\frontend\src\components\PortfolioAnalytics.jsx
c:\AKIG\frontend\src\components\Branding\ResponsiveHero.tsx
c:\AKIG\frontend\src\components\RoleRibbon.tsx
c:\AKIG\frontend\src\components\ReviewsChart.tsx
c:\AKIG\frontend\src\components\RequireAuthStandardized.jsx
c:\AKIG\frontend\src\components\RequireAuth.jsx
c:\AKIG\frontend\src\components\RealEstateDashboard.jsx
c:\AKIG\frontend\src\components\QuickActions.tsx
c:\AKIG\frontend\src\components\ProtectedComponent.tsx
c:\AKIG\frontend\src\components\Protected.tsx
c:\AKIG\frontend\src\components\Navigation.jsx
c:\AKIG\frontend\src\components\ScheduledReminders.tsx
c:\AKIG\frontend\src\components\Navbar.tsx
c:\AKIG\frontend\src\components\Modal.jsx
c:\AKIG\frontend\src\components\Menu.js
c:\AKIG\frontend\src\components\MediaGallery.jsx
c:\AKIG\frontend\src\components\LayoutStandardized.jsx
c:\AKIG\frontend\src\components\Layout.tsx
c:\AKIG\frontend\src\components\SearchBar.tsx
c:\AKIG\frontend\src\components\StatusBadge.jsx
c:\AKIG\frontend\src\components\notifications\NotificationCenter.jsx
c:\AKIG\frontend\src\components\Slider.tsx
c:\AKIG\frontend\src\components\SkeletonCard.tsx
c:\AKIG\frontend\src\components\SettlementForm.jsx
c:\AKIG\frontend\src\components\SectorsComponent.jsx
c:\AKIG\frontend\src\components\Toggle.tsx
c:\AKIG\frontend\src\components\Toast.tsx
c:\AKIG\frontend\src\components\Table.jsx
c:\AKIG\frontend\src\components\TenantItem.tsx
c:\AKIG\frontend\src\components\StatusBadgeYear.tsx
c:\AKIG\frontend\src\components\StatusBadge.tsx
c:\AKIG\frontend\src\components\NoticeSystem\ManagerDashboard.tsx
c:\AKIG\frontend\src\components\LanguageSwitcher.jsx
c:\AKIG\frontend\src\components\InputPhone.tsx
c:\AKIG\frontend\src\components\Input.tsx
c:\AKIG\frontend\src\components\index.ts
c:\AKIG\frontend\src\components\index.js
c:\AKIG\frontend\src\components\ImpayesChart.tsx
c:\AKIG\frontend\src\components\HealthStatus.jsx
c:\AKIG\frontend\src\components\HealthStatus.d.ts
c:\AKIG\frontend\src\components\Header.jsx
c:\AKIG\frontend\src\components\VirtualList.tsx
c:\AKIG\frontend\src\components\Header.js
c:\AKIG\frontend\src\components\layout\Navbar.jsx
c:\AKIG\frontend\src\components\layout\Sidebar.basic.jsx
c:\AKIG\frontend\src\components\layout\Navbar.genius.jsx
c:\AKIG\frontend\src\components\layout\Navbar.basic.jsx
c:\AKIG\frontend\src\components\layout\MainLayout.jsx
c:\AKIG\frontend\src\components\layout\Sidebar.genius.jsx
c:\AKIG\frontend\src\components\layout\Sidebar.jsx
c:\AKIG\frontend\src\components\search\GlobalSearch.jsx
c:\AKIG\frontend\src\components\UI\Button.jsx
c:\AKIG\frontend\src\components\UI\Tabs.jsx
c:\AKIG\frontend\src\components\UI\ModuleLayout.jsx
c:\AKIG\frontend\src\components\UI\DataTable.jsx
c:\AKIG\frontend\src\components\UI\Card.jsx
(… liste complète dans le dépôt — ce bloc reprend les résultats fournis par la recherche)

---

## Frontend — Pages (liste complète)

(208 fichiers trouvés)

c:\AKIG\frontend\src\pages\Contracts.jsx
c:\AKIG\frontend\src\pages\ContractsEnhanced.tsx
c:\AKIG\frontend\src\pages\Dashboard.simplified.jsx
c:\AKIG\frontend\src\pages\Dashboard.old.jsx
c:\AKIG\frontend\src\pages\Dashboard.jsx
c:\AKIG\frontend\src\pages\Dashboard.genius.jsx
c:\AKIG\frontend\src\pages\Dashboard.basic.jsx
c:\AKIG\frontend\src\pages\Dashboard.tsx
c:\AKIG\frontend\src\pages\ContractsManagePage.tsx
c:\AKIG\frontend\src\pages\DashboardEnhanced.tsx
c:\AKIG\frontend\src\pages\ContractsList.tsx
c:\AKIG\frontend\src\pages\ContractsDashboard.tsx
c:\AKIG\frontend\src\pages\Communication.js
c:\AKIG\frontend\src\pages\CommandCenter.tsx
c:\AKIG\frontend\src\pages\ClientsEnhanced.tsx
c:\AKIG\frontend\src\pages\Clients.jsx
c:\AKIG\frontend\src\pages\ChargesEnhanced.tsx
c:\AKIG\frontend\src\pages\Charges.jsx
c:\AKIG\frontend\src\pages\Candidatures.jsx
c:\AKIG\frontend\src\pages\BlockchainGovernance.tsx
c:\AKIG\frontend\src\pages\BankSync.jsx
c:\AKIG\frontend\src\pages\AuditLog.tsx
c:\AKIG\frontend\src\pages\ApiConsole.tsx
c:\AKIG\frontend\src\pages\AnnualSettlement.jsx
c:\AKIG\frontend\src\pages\Analytics.jsx
c:\AKIG\frontend\src\pages\AkigPro.tsx
c:\AKIG\frontend\src\pages\AgentsScoreboard.jsx
c:\AKIG\frontend\src\pages\AdaptiveUX.tsx
c:\AKIG\frontend\src\pages\Accueil.js
c:\AKIG\frontend\src\pages\DashboardPhase8-10.jsx
c:\AKIG\frontend\src\pages\DashboardPremium.jsx
c:\AKIG\frontend\src\pages\ProjectsEnhanced.tsx
c:\AKIG\frontend\src\pages\PropertiesEnhanced.tsx
c:\AKIG\frontend\src\pages\Properties.jsx
c:\AKIG\frontend\src\pages\Projects.jsx
c:\AKIG\frontend\src\pages\Rapports.js
c:\AKIG\frontend\src\pages\ProactiveIntelligence.tsx
c:\AKIG\frontend\src\pages\Preavis.jsx
c:\AKIG\frontend\src\pages\PaymentsEnhanced.tsx
c:\AKIG\frontend\src\pages\Payments.jsx
c:\AKIG\frontend\src\pages\PaymentProcessing.jsx
c:\AKIG\frontend\src\pages\OpsDashboard.tsx
c:\AKIG\frontend\src\pages\NotFound.jsx
c:\AKIG\frontend\src\pages\TenantsPage.tsx
c:\AKIG\frontend\src\pages\TenantsListYear.tsx
c:\AKIG\frontend\src\pages\TenantsList.tsx
c:\AKIG\frontend\src\pages\TenantsEnhanced.tsx
c:\AKIG\frontend\src\pages\Tenants.jsx
c:\AKIG\frontend\src\pages\Workflows.js
c:\AKIG\frontend\src\pages\ValidationMasterPlan.tsx
c:\AKIG\frontend\src\pages\UserProfile.jsx
c:\AKIG\frontend\src\pages\UltraScalabilityEngine.tsx
c:\AKIG\frontend\src\pages\TenantPaymentsDetail.jsx
c:\AKIG\frontend\src\pages\TenantPortal\index.jsx
c:\AKIG\frontend\src\pages\Modules\Proprietes\Index.jsx
c:\AKIG\frontend\src\pages\Modules\Recouvrement\Index.jsx
c:\AKIG\frontend\src\pages\Modules\Reporting\Index.jsx
c:\AKIG\frontend\src\pages\Modules\Paiements\Index.jsx
c:\AKIG\frontend\src\pages\Modules\Proprietaires\Index.jsx
c:\AKIG\frontend\src\pages\Modules\Maintenance\Index.jsx
c:\AKIG\frontend\src\pages\Modules\Locataires\Index.jsx
c:\AKIG\frontend\src\pages\Modules\Litiges\Index.jsx
c:\AKIG\frontend\src\pages\TenantManagement.jsx
c:\AKIG\frontend\src\pages\TenantDetailPage.tsx
c:\AKIG\frontend\src\pages\TenantDetail.tsx
c:\AKIG\frontend\src\pages\SuperDashboard.jsx
c:\AKIG\frontend\src\pages\Modules\CRM\Index.jsx
c:\AKIG\frontend\src\pages\Modules\Agents\Index.jsx
c:\AKIG\frontend\src\pages\Modules\Contrats\Index.jsx
c:\AKIG\frontend\src\pages\SettingsEnhanced.tsx
c:\AKIG\frontend\src\pages\Settings.jsx
c:\AKIG\frontend\src\pages\ServerError.jsx
c:\AKIG\frontend\src\pages\Seasonal.jsx
c:\AKIG\frontend\src\pages\SCI.jsx
c:\AKIG\frontend\src\pages\Resilience.js
c:\AKIG\frontend\src\pages\ResetPassword.jsx
c:\AKIG\frontend\src\pages\ReportsEnhanced.tsx
c:\AKIG\frontend\src\pages\Reports.jsx
c:\AKIG\frontend\src\pages\Register.jsx
c:\AKIG\frontend\src\pages\MaintenanceTickets.jsx
c:\AKIG\frontend\src\pages\Logout.jsx
c:\AKIG\frontend\src\pages\Login.jsx
c:\AKIG\frontend\src\pages\LazyCharts.tsx
c:\AKIG\frontend\src\pages\JupiterVision.tsx
c:\AKIG\frontend\src\pages\ImportPayments.tsx
c:\AKIG\frontend\src\pages\ImportCsvPayments.tsx
c:\AKIG\frontend\src\pages\HumanDimension.tsx
c:\AKIG\frontend\src\pages\GuineaProperties.jsx
c:\AKIG\frontend\src\pages\ForgotPassword.jsx
c:\AKIG\frontend\src\pages\Fiscal.jsx
c:\AKIG\frontend\src\pages\FinancialDashboard.jsx
c:\AKIG\frontend\src\pages\FinanceDashboard.jsx
c:\AKIG\frontend\src\pages\ExtremeResilience.tsx
c:\AKIG\frontend\src\pages\ExportsVerification.jsx
c:\AKIG\frontend\src\pages\ExhaustiveValidationRunner.tsx
c:\AKIG\frontend\src\pages\Docs.js
c:\AKIG\frontend\src\pages\DetailedReports.jsx
c:\AKIG\frontend\src\pages\DepositManagement.jsx
c:\AKIG\frontend\src\pages\src\api.js
c:\AKIG\frontend\src\pages\src\pages\Payments.js
c:\AKIG\frontend\src\pages\src\pages\dashboard.js
c:\AKIG\frontend\src\pages\src\pages\contracts.js
c:\AKIG\frontend\src\pages\Modules\IA\Index.jsx
c:\AKIG\frontend\src\pages\Modules\Utilisateurs\Index.jsx
(… voir dépôt pour la liste complète — ce bloc reprend les résultats fournis par la recherche)

---

## Frontend — API/Context/Hooks/Services/Store/Utils/Modules

- API (10)
  - c:\AKIG\frontend\src\api\http-client.ts
  - c:\AKIG\frontend\src\api\endpoints.js
  - c:\AKIG\frontend\src\api\client.ts
  - c:\AKIG\frontend\src\api\apiService.js
  - c:\AKIG\frontend\src\api\apiClientStandardized.ts
- Context (2)
  - c:\AKIG\frontend\src\context\UIConfigContext.jsx
- Hooks (30)
  - Ex.: c:\AKIG\frontend\src\hooks\useLocalStorage.js, useAuth.tsx/js, useNotification.tsx, usePagedSearch.ts, …
- Services (8)
  - Ex.: c:\AKIG\frontend\src\services\api.js, alertsService.ts, aiPrescriptive.js, phase8-10.services.js
- Store (6)
  - Ex.: c:\AKIG\frontend\src\store\slices\auth.slice.ts, ui.slice.ts, contracts.slice.ts
- Utils (14)
  - Ex.: c:\AKIG\frontend\src\utils\analytics.ts, export.ts/exportUtils.js, date.ts, logger.ts, monitoring.ts
- Modules (8)
  - Ex.: c:\AKIG\frontend\src\modules\registry.tsx, PaymentsQuickAction.tsx, ArrearsDashboardModule.tsx, SmsAutomationModule.tsx

---

## Fonctionnalités Pro / Génie (emplacements clés)

- Panneau Génie: `frontend/src/components/genius/GeniusPanel.jsx`
- Explorer API: `frontend/src/components/genius/ApiExplorer.jsx`
- Grille statut endpoints: `frontend/src/components/genius/EndpointStatusGrid.jsx`
- Recherche globale: `frontend/src/components/search/GlobalSearch.jsx` (ouverture via Navbar / Ctrl+P)
- Centre notifications: `frontend/src/components/notifications/NotificationCenter.jsx` (intégré à la Navbar)
- AI Insights: `frontend/src/components/ai/AIInsights.jsx` (intégré au Dashboard)
- Contexte UI (modes: classic/modern/pro + genius auto): `frontend/src/context/UIConfigContext.jsx`
- Navbar intégration Pro (glass + raccourcis): `frontend/src/components/layout/Navbar.jsx`
- Layout/SIDEBAR mode Pro: `frontend/src/components/layout/MainLayout.jsx`, `frontend/src/components/layout/Sidebar.jsx`
- Dashboard Pro: `frontend/src/pages/Dashboard.jsx` (sections API System Overview + AI Insights en mode Pro)

---

## Navigation actuelle (router minimal)

`frontend/src/routes.tsx`
- "/" → Accueil
- "/dashboard" → Dashboard
- "/tenants" → TenantsList
- "/tenant/:tenantId" → TenantDetailPage
- "/import-csv" → ImportCsvPayments
- "*" → redirection /dashboard

Note: la Sidebar expose davantage d’entrées; plusieurs variantes d’App/Router existent dans le dépôt.

---

## Notes

- De nombreux fichiers de documentation existent au root (INDEX_*, README_*, GUIDES_*). Pour un inventaire documentaire, voir aussi: `FILE_LISTING.txt`, `FILE_MANIFEST.md`, `FILES_INDEX.md`, `INDEX_ALL_FILES_CREATED.md` (et autres index présents).
- Cet inventaire reflète l’état courant; il peut y avoir des doublons issus de la recherche glob et des variantes (JS/TS) conservées pour compatibilité.

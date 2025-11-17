# Guide Complet des Composants Avancés AKIG

## 📋 Table des matières

1. [Notifications](#notifications)
2. [Formulaires](#formulaires)
3. [Modales](#modales)
4. [Authentification](#authentification)
5. [Cache et Stockage](#cache-et-stockage)
6. [Export de Données](#export-de-données)
7. [Actions en Masse](#actions-en-masse)
8. [Logging et Monitoring](#logging-et-monitoring)

---

## 🔔 Notifications

### NotificationProvider + useNotification

Wrapper global pour gérer les notifications toast.

```tsx
import { NotificationProvider, useNotification, useNotificationShortcuts } from '@akig/components';

// Wrapper au top niveau (App.tsx)
<NotificationProvider>
  <App />
</NotificationProvider>

// Dans un composant
function MyComponent() {
  const { addNotification } = useNotification();
  
  const handleSuccess = () => {
    addNotification('Opération réussie', 'success', { 
      duration: 3000 
    });
  };
  
  // Ou utiliser les raccourcis
  const { success, error, warning } = useNotificationShortcuts();
  
  return (
    <button onClick={() => success('Succès!')}>
      Notifier
    </button>
  );
}

// Afficher les toasts
<NotificationContainer position="top-right" />
```

### NotificationCenter (Agrégation)

Affiche les alertes, rappels et recherche IA ensemble.

```tsx
<NotificationCenter
  tenants={tenantsList}
  contracts={contractsList}
  onFilters={(filters) => applyFilters(filters)}
  showAiSearch
  showAlerts
  showReminders
/>
```

---

## 📝 Formulaires

### FormBuilder avec Validation

Construire des formulaires avec validation automatique.

```tsx
import { FormBuilder, Validators } from '@akig/components';

<FormBuilder
  config={{
    fields: [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        validate: [Validators.email],
        placeholder: 'votre@email.com'
      },
      {
        name: 'password',
        label: 'Mot de passe',
        type: 'password',
        required: true,
        validate: [Validators.minLength(8)]
      },
      {
        name: 'confirmPassword',
        label: 'Confirmer',
        type: 'password',
        validate: [
          Validators.match('password', 'Mot de passe')
        ]
      },
      {
        name: 'message',
        label: 'Message',
        type: 'textarea',
        multiline: true,
        rows: 4,
        validate: [Validators.minLength(10), Validators.maxLength(500)]
      },
      {
        name: 'country',
        label: 'Pays',
        type: 'select',
        required: true,
        options: [
          { value: 'GN', label: 'Guinée' },
          { value: 'SN', label: 'Sénégal' }
        ]
      }
    ],
    onSubmit: async (data) => {
      await api.submitForm(data);
      success('Formulaire envoyé');
    },
    submitText: 'Envoyer'
  }}
/>
```

### useForm Hook

Gérer l'état d'un formulaire manuellement.

```tsx
function MyForm() {
  const form = useForm({
    email: '',
    name: ''
  });

  return (
    <form>
      <input
        name="email"
        value={form.values.email}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
      />
      {form.touched.email && form.errors.email && (
        <span className="error">{form.errors.email}</span>
      )}
      <button onClick={() => form.reset()}>Reset</button>
    </form>
  );
}
```

---

## 🔲 Modales

### Modal Simple

```tsx
import { Modal, useModal } from '@akig/components';

function MyComponent() {
  const modal = useModal();

  return (
    <>
      <button onClick={modal.open}>Ouvrir</button>

      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title="Titre"
        size="lg"
      >
        <p>Contenu</p>
      </Modal>
    </>
  );
}
```

### ConfirmModal

```tsx
<ConfirmModal
  isOpen={showConfirm}
  title="Supprimer"
  message="Êtes-vous sûr ?"
  type="danger"
  onConfirm={() => deleteTenant()}
  onCancel={() => setShowConfirm(false)}
  confirmText="Supprimer"
  cancelText="Annuler"
/>
```

---

## 🔐 Authentification

### AuthProvider + useAuth

```tsx
// App.tsx
<AuthProvider>
  <AppRoutes />
</AuthProvider>

// Dans un composant
function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div>
      <UserMenu onLogout={() => window.location.href = '/login'} />
      <p>Bonjour {user?.name}</p>
    </div>
  );
}
```

### ProtectedRoute

```tsx
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>
```

### Session Timeout

```tsx
function App() {
  useSessionTimeout(30 * 60 * 1000); // Logout après 30 min d'inactivité

  return <AppRoutes />;
}
```

---

## 💾 Cache et Stockage

### useCache (avec API)

```tsx
function TenantsList() {
  const { data, isLoading, refresh } = useCache(
    'tenants-list',
    () => fetch('/api/tenants').then(r => r.json()),
    {
      expiresIn: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isLoading) return <div>Chargement...</div>;

  return (
    <>
      {data?.map(t => <TenantCard key={t.id} tenant={t} />)}
      <button onClick={() => refresh()}>Actualiser</button>
    </>
  );
}
```

### useLocalStorage

```tsx
function UserPreferences() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [pageSize, setPageSize] = useLocalStorage('pageSize', 25);

  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option>light</option>
        <option>dark</option>
      </select>
    </div>
  );
}
```

### useSyncStorage (entre onglets)

```tsx
function MultiTabSync() {
  const [state, setState, isSynced] = useSyncStorage('shared-state', {});

  return (
    <div>
      {!isSynced && <p>⚠️ Pas synchronisé</p>}
      <SyncStatus isSynced={isSynced} />
    </div>
  );
}
```

---

## 📊 Export de Données

### ExportManager

```tsx
<ExportManager
  data={tenants}
  filename="tenants-list"
  onExport={(format) => {
    logger.info(`Export en ${format}`);
  }}
/>
```

### QuickExport

```tsx
<QuickExport
  data={payments}
  filename="payments-2025"
  formats={['csv', 'json']}
/>
```

### ExportPanel (avec options avancées)

```tsx
<ExportPanel
  data={tenants}
  columns={['name', 'phone', 'rent']}
  filename="export"
/>
```

---

## ✋ Actions en Masse

### BulkActions + useBulkSelection

```tsx
function TenantsTable() {
  const { selectedItems, toggleItem, toggleAll, clearSelection } = useBulkSelection();

  const handleBulkAction = async (action, items) => {
    if (action === 'delete') {
      await api.deleteTenants(items.map(i => i.id));
      clearSelection();
    }
  };

  return (
    <div>
      <BulkActions
        selectedItems={selectedItems}
        onAction={handleBulkAction}
        actions={[
          { label: 'Supprimer', action: 'delete', color: 'danger', requiresConfirm: true },
          { label: 'Exporter', action: 'export' }
        ]}
      />

      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedItems.length > 0}
                onChange={() => toggleAll(tenants)}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {tenants.map(tenant => (
            <SelectableTableRow
              key={tenant.id}
              item={tenant}
              isSelected={selectedItems.some(s => s.id === tenant.id)}
              onToggle={toggleItem}
            >
              {/* Colonnes du tableau */}
            </SelectableTableRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 📊 Logging et Monitoring

### useLogger

```tsx
import { useLogger } from '@akig/components';

function MyComponent() {
  const log = useLogger('MyComponent');

  useEffect(() => {
    log.info('Composant monté');
    return () => log.info('Composant démonté');
  }, [log]);

  const handleClick = () => {
    try {
      doSomething();
    } catch (err) {
      log.error('Erreur dans handleClick', { error: err });
    }
  };
}
```

### LogViewer (Debug Panel)

```tsx
import { LogViewer } from '@akig/components';

// En développement
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 left-4 w-96">
    <LogViewer maxHeight="300px" autoScroll />
  </div>
)}
```

### PerformanceMonitor

```tsx
<PerformanceMonitor componentName="Dashboard">
  <Dashboard />
</PerformanceMonitor>
```

### ErrorBoundary

```tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <Dashboard />
</ErrorBoundary>
```

---

## 🚀 Patterns Avancés

### Combinaison: Cache + Notifications

```tsx
function SmartDataLoader() {
  const { data, isLoading, error, refresh } = useCache('key', fetcher);
  const { error: errorNotif } = useNotificationShortcuts();

  useEffect(() => {
    if (error) {
      errorNotif(error.message);
    }
  }, [error]);

  return <LoadingSpinner isLoading={isLoading}>{...}</LoadingSpinner>;
}
```

### Combinaison: Authentification + Fetch

```tsx
function DataComponent() {
  const fetchWithAuth = useFetch();

  useEffect(() => {
    fetchWithAuth('/api/data')
      .then(r => r.json())
      .then(data => setData(data))
      .catch(err => logger.error('Erreur API', err));
  }, [fetchWithAuth]);
}
```

### Combinaison: BulkActions + Export

```tsx
const handleBulkAction = async (action, items) => {
  if (action === 'export') {
    exportToCSV(items, 'export');
    success('Fichier téléchargé');
  }
};
```

---

## 📚 Ressources

- `src/index.ts` - Export centralisé
- `src/components/` - Composants UI
- `src/hooks/` - Hooks personnalisés
- `src/utils/` - Utilitaires et helpers
- `src/i18n/fr.ts` - Traductions


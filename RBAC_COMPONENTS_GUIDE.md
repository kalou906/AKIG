// ============================================================================
// RBAC Components & Features Documentation
// File: RBAC_COMPONENTS_GUIDE.md
// Purpose: Complete guide for UI components, AI features, and role ribbons
// ============================================================================

# RBAC Components & Features Guide

Complete documentation for permission-gated UI components, AI search features, and role display components.

## Table of Contents

1. [Role Ribbon Component](#role-ribbon-component)
2. [Action Bar Component](#action-bar-component)
3. [AI Search Component](#ai-search-component)
4. [Integration Examples](#integration-examples)
5. [Backend AI Route](#backend-ai-route)
6. [Advanced Patterns](#advanced-patterns)

---

## Role Ribbon Component

Display styled badges for user roles with color coding.

### Files

- **Frontend**: `frontend/src/components/RoleRibbon.tsx`
- **Type**: React Functional Component
- **Permissions**: None required (display-only)

### Basic Usage

```typescript
import { RoleRibbon } from './components/RoleRibbon';

function UserProfile({ user }) {
  return (
    <div>
      <h2>{user.email}</h2>
      <RoleRibbon role="COMPTA" />
    </div>
  );
}
```

### Color Scheme

| Role | Colors | Use Case |
|------|--------|----------|
| PDG | Blue 600 / White | CEO / Full Access |
| COMPTA | Amber 500 / White | Accounting / Financial |
| AGENT | Green 600 / White | Field Agent / Operations |
| LOCATAIRE | Gray 200 / Gray 800 | Tenant / Read-only |
| PROPRIETAIRE | Blue 100 / Blue 800 | Owner / Limited Access |

### Components

#### `<RoleRibbon />`

Display single role badge.

```typescript
interface RoleRibbonProps {
  role: 'PDG' | 'COMPTA' | 'AGENT' | 'LOCATAIRE' | 'PROPRIETAIRE';
  className?: string;  // Additional Tailwind classes
}

// Example
<RoleRibbon role="COMPTA" className="mb-4" />
```

#### `<RoleList />`

Display multiple role badges.

```typescript
interface RoleListProps {
  roles: RoleType[];
  className?: string;
}

// Example
<RoleList roles={['PDG', 'COMPTA']} className="gap-3" />
```

### Styling Examples

```typescript
// Change colors
<RoleRibbon role="AGENT" className="bg-purple-600" />

// Increase size
<RoleRibbon role="PDG" className="px-4 py-2 text-base" />

// Inline with other content
<div className="flex items-center gap-2">
  <span>{user.name}</span>
  <RoleRibbon role={user.role} />
</div>
```

---

## Action Bar Component

Display permission-based action buttons in a bar layout.

### Files

- **Frontend**: `frontend/src/components/ActionBar.tsx`
- **Type**: React Functional Component
- **Required Permission**: Individual permission per button

### Basic Usage

```typescript
import { ActionBar } from './components/ActionBar';
import { useUser } from './context/UserContext';

function ContractPage() {
  const { user } = useUser();

  return (
    <>
      <h1>Contracts</h1>
      <ActionBar
        user={user}
        onGenerateContract={() => handleGenerate()}
        onSendReminder={() => handleReminder()}
        onExport={() => handleExport()}
      />
    </>
  );
}
```

### Components

#### `<ActionBar />`

Main action bar component.

```typescript
interface ActionBarProps {
  user: User | null | undefined;
  tenant?: any;
  onGenerateContract?: () => void;
  onSendReminder?: () => void;
  onExport?: () => void;
  onImportPayments?: () => void;
  disabled?: boolean;
  className?: string;
}

// Example with all options
<ActionBar
  user={user}
  tenant={tenant}
  onGenerateContract={() => console.log('Generate')}
  onSendReminder={() => console.log('Remind')}
  onExport={() => console.log('Export')}
  onImportPayments={() => console.log('Import')}
  disabled={isLoading}
  className="mb-4"
/>
```

**Features:**
- Shows only buttons user has permission for
- Each button wrapped in `<Protected>` component
- Disabled state support
- Fallback message if no permissions
- Responsive flex layout

**Permission Mapping:**
| Button | Permission | Role |
|--------|-----------|------|
| Generate Contract | `contracts.generate` | PDG, AGENT |
| Send Reminder | `reminders.send` | PDG, COMPTA, AGENT |
| Export | `reports.view` | PDG, COMPTA, PROPRIETAIRE |
| Import Payments | `payments.import` | PDG, COMPTA |

#### `<ActionButton />`

Single action button with permission check.

```typescript
interface ActionButtonProps {
  user: User | null | undefined;
  perm: Permission;
  icon?: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
}

// Example
<ActionButton
  user={user}
  perm="contracts.generate"
  icon="📄"
  label="Generate"
  onClick={handleGenerate}
  variant="primary"
/>
```

### Usage Examples

#### Example 1: Dashboard with Actions

```typescript
function Dashboard({ user, contract }) {
  return (
    <div className="space-y-4">
      <header>
        <h1>{contract.name}</h1>
        <RoleRibbon role={user.role} />
      </header>

      <ActionBar
        user={user}
        onGenerateContract={() => navigate('/generate')}
        onSendReminder={() => openReminderModal()}
      />

      <section>
        {/* Contract details */}
      </section>
    </div>
  );
}
```

#### Example 2: Conditional Buttons

```typescript
function FormActions({ user, isLoading }) {
  return (
    <ActionBar
      user={user}
      disabled={isLoading}
      onExport={() => handleExport()}
    />
  );
}
```

---

## AI Search Component

AI-powered natural language search with permission gating and scope filtering.

### Files

- **Frontend**: `frontend/src/components/AiSearch.tsx`
- **Backend**: `backend/src/routes/aiAssist.ts`
- **Required Permission**: `ai.assist`
- **Allowed Roles**: PDG, COMPTA, AGENT

### Basic Usage

```typescript
import { AiSearch } from './components/AiSearch';
import { useUser } from './context/UserContext';

function SearchPage() {
  const { user } = useUser();
  const [filters, setFilters] = useState({});

  return (
    <>
      <h1>Search</h1>
      <AiSearch
        user={user}
        onFilters={(f) => setFilters(f)}
        onLoading={(loading) => setIsLoading(loading)}
      />

      {/* Apply filters to results */}
    </>
  );
}
```

### Components

#### `<AiSearch />`

Full-featured AI search component.

```typescript
interface AiSearchProps {
  user?: User | null;
  onFilters: (filters: Record<string, any>) => void;
  onLoading?: (loading: boolean) => void;
}

// Example
<AiSearch
  user={user}
  onFilters={(filters) => applyFilters(filters)}
  onLoading={(loading) => setLoading(loading)}
/>
```

**Features:**
- Permission-gated with `<Protected>`
- Natural language processing
- Multi-language support (French + English)
- Suggestion display
- Error handling
- Loading states

#### `<AiSearchCompact />`

Inline compact search bar.

```typescript
interface AiSearchProps {
  user?: User | null;
  onFilters: (filters: Record<string, any>) => void;
  onLoading?: (loading: boolean) => void;
}

// Example in toolbar
<div className="flex gap-2">
  <input type="text" placeholder="Search..." />
  <AiSearchCompact
    user={user}
    onFilters={(f) => applyFilters(f)}
  />
</div>
```

### AI Search Prompts

The AI search understands natural language in French and English:

#### Status Filters
```
"Show overdue contracts"
"Affiche les contrats en retard"
"impayés"
"retards"
```
→ Applies: `status: 'overdue'`

#### Payment Method
```
"Orange Money payments"
"paiements Orange Money"
"virement bancaire"
```
→ Applies: `payment_method: 'orange_money'` or `'bank_transfer'`

#### Amount Filters
```
"Contracts over 1 million"
"Supérieur à 500 mille"
"> 2 million"
```
→ Applies: `min_amount: 1000000`

#### Time Periods
```
"This month"
"Ce mois"
"Cette année"
"This quarter"
```
→ Applies: `period: 'current_month'` or `'current_year'`

#### Regions
```
"Dakar contracts"
"Contrats à Kaolack"
"Saint-Louis"
```
→ Applies: `region: 'Dakar'`

### Suggestion Examples

When user searches:

**Input**: `"Show overdue contracts over 1 million"`
**Suggestions**:
1. Contrats en retard (Status: overdue, Min: 1M)
2. Priorisation recouvrement (Sort by arrears, COMPTA only)

**Input**: `"Orange Money payments this month"`
**Suggestions**:
1. Paiements Orange Money (Method filter)
2. Rapports ce mois (Period filter)

**Input**: `"Matam contracts 2024"`
**Suggestions**:
1. Contrats - Matam (Region filter, AGENT only)
2. Rapports 2024 (Year filter)

---

## Integration Examples

### Example 1: Complete Dashboard

```typescript
import { useUser } from './context/UserContext';
import { RoleRibbon, ActionBar, AiSearch } from './components';

function Dashboard() {
  const { user } = useUser();
  const [filters, setFilters] = useState({});
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    // Fetch contracts with filters
    fetch('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(filters)
    })
      .then(r => r.json())
      .then(d => setContracts(d.contracts));
  }, [filters]);

  return (
    <div className="p-6 space-y-6">
      {/* User header */}
      <header className="flex justify-between items-center">
        <div>
          <h1>{user.email}</h1>
          <RoleRibbon role={user.roles[0]} />
        </div>
      </header>

      {/* AI Search */}
      <AiSearch
        user={user}
        onFilters={setFilters}
      />

      {/* Actions */}
      <ActionBar
        user={user}
        onGenerateContract={() => navigate('/generate')}
        onExport={() => exportData()}
      />

      {/* Results */}
      <section>
        <h2>Results</h2>
        <div className="grid gap-4">
          {contracts.map(c => (
            <div key={c.id} className="card">
              <h3>{c.name}</h3>
              <p>Status: {c.status}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

### Example 2: User Management Page

```typescript
function UserList({ users }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.email}</td>
            <td>
              <RoleRibbon role={user.role} />
            </td>
            <td>
              <ActionButton
                user={user}
                perm="contracts.generate"
                label="Edit"
                onClick={() => editUser(user.id)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Example 3: Tenant Portal

```typescript
function TenantPortal({ user }) {
  return (
    <div>
      <h1>My Contracts</h1>

      {/* Show AI search only if user has permission */}
      <AiSearch
        user={user}
        onFilters={(f) => applyFilters(f)}
      />

      {/* Compact action bar for tenants */}
      <ActionBar
        user={user}
        onExport={() => downloadPDF()}
      />

      {/* Contract list */}
    </div>
  );
}
```

---

## Backend AI Route

The AI search backend processes natural language and returns suggestions.

### Endpoint

```
POST /api/ai/assist
Authorization: Bearer JWT_TOKEN
```

### Request

```json
{
  "prompt": "Show overdue contracts over 1 million",
  "context": {
    "year": 2024
  }
}
```

### Response

```json
{
  "ok": true,
  "suggestions": [
    {
      "title": "Contrats en retard",
      "description": "Affiche les contrats avec impayés supérieurs à 1000000",
      "filters": {
        "status": "overdue",
        "min_arrears": 1000000,
        "year": 2024
      },
      "icon": "⏰"
    }
  ],
  "filters": {
    "status": "overdue",
    "min_amount": 1000000,
    "year": 2024,
    "owner_id": 5
  },
  "appliedRoles": ["COMPTA"]
}
```

### Features

**Scope Filtering:**
- PROPRIETAIRE: Only suggestions for their properties
- LOCATAIRE: Only suggestions for their contracts
- PDG/COMPTA/AGENT: All suggestions

**Multi-language Support:**
- French keywords: "impayé", "contrat", "paiement", "année"
- English keywords: "overdue", "contract", "payment", "year"

**Audit Logging:**
- Every search logged to `audit_log` table
- Tracks: prompt, suggestion count, role used

**Error Handling:**
- 400: Missing or invalid prompt
- 401: User not authenticated
- 403: User lacks permission
- 500: Server error

---

## Advanced Patterns

### Pattern 1: Dynamic Action Menu

```typescript
function DynamicActions({ user, resourceType }) {
  const actionsByResource = {
    contract: [
      { perm: 'contracts.generate', label: '📄 Generate' },
      { perm: 'reminders.send', label: '📤 Remind' }
    ],
    payment: [
      { perm: 'payments.import', label: '💳 Import' },
      { perm: 'reports.view', label: '📊 Export' }
    ]
  };

  const actions = actionsByResource[resourceType] || [];

  return (
    <div className="flex gap-2">
      {actions.map(action => (
        <ActionButton
          key={action.perm}
          user={user}
          perm={action.perm}
          label={action.label}
        />
      ))}
    </div>
  );
}
```

### Pattern 2: AI Search with Debouncing

```typescript
import { useCallback } from 'react';
import { useDebounce } from './hooks/useDebounce';

function SmartSearch({ user }) {
  const [filters, setFilters] = useState({});
  const debouncedFilters = useDebounce(filters, 500);

  const handleFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  useEffect(() => {
    // Fetch with debounced filters
    applyFilters(debouncedFilters);
  }, [debouncedFilters]);

  return (
    <AiSearch
      user={user}
      onFilters={handleFilters}
    />
  );
}
```

### Pattern 3: Conditional Toolbar

```typescript
function Toolbar({ user }) {
  const canManage = user?.permissions?.includes('contracts.generate');
  const canExport = user?.permissions?.includes('reports.view');

  if (!canManage && !canExport) {
    return <div className="text-gray-500">No tools available</div>;
  }

  return (
    <ActionBar
      user={user}
      onGenerateContract={canManage ? handleGenerate : undefined}
      onExport={canExport ? handleExport : undefined}
    />
  );
}
```

---

## Styling & Customization

### Tailwind Classes

All components use Tailwind CSS. Customize with `className` prop:

```typescript
// Size variants
<RoleRibbon role="PDG" className="px-2 py-1 text-xs" />   // Small
<RoleRibbon role="PDG" className="px-4 py-2 text-base" /> // Large

// Color customization
<ActionBar className="bg-gray-50 p-4 rounded-lg" />

// Spacing
<AiSearch className="mb-6" />
```

### CSS Modules

To use CSS Modules instead:

```typescript
import styles from './ActionBar.module.css';

<ActionBar className={styles.customBar} />
```

### Headless UI

Components are unstyled-friendly. Remove `className` and style with your own:

```typescript
<Protected user={user} perm="contracts.generate">
  <button className={myCustomClass}>
    Custom Button
  </button>
</Protected>
```

---

## Testing Components

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { RoleRibbon } from './RoleRibbon';

it('renders role with correct styling', () => {
  render(<RoleRibbon role="COMPTA" />);
  const element = screen.getByText('COMPTA');
  expect(element).toHaveClass('bg-amber-500');
});
```

### Component Tests

```typescript
it('shows action buttons only for permitted user', () => {
  const user = { permissions: ['contracts.generate'] };
  render(<ActionBar user={user} />);
  
  expect(screen.getByText(/Generate/)).toBeInTheDocument();
  expect(screen.queryByText(/Send Reminder/)).not.toBeInTheDocument();
});
```

### Integration Tests

```typescript
it('applies AI search filters', async () => {
  render(<AiSearch user={user} onFilters={handleFilters} />);
  
  const input = screen.getByPlaceholderText(/AI Search/);
  await userEvent.type(input, 'overdue contracts');
  await userEvent.click(screen.getByText('🔍'));
  
  expect(handleFilters).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'overdue' })
  );
});
```

---

## Accessibility

All components follow WCAG guidelines:

- ✅ Keyboard navigation support
- ✅ ARIA labels on buttons
- ✅ Color contrast (WCAG AA minimum)
- ✅ Focus indicators
- ✅ Screen reader friendly

```typescript
// Good accessibility
<button
  aria-label="Generate a new contract"
  title="Generate a new contract"
  onClick={handleGenerate}
>
  📄 Generate
</button>
```

---

## Performance Considerations

### Memoization

```typescript
const MemoizedActionBar = React.memo(ActionBar);
```

### Lazy Loading

```typescript
const AiSearch = React.lazy(() => import('./AiSearch'));

<Suspense fallback={<div>Loading...</div>}>
  <AiSearch user={user} onFilters={onFilters} />
</Suspense>
```

---

## Summary

**New Components Delivered:**
- ✅ RoleRibbon - Display roles with color coding
- ✅ ActionBar - Permission-based action buttons
- ✅ AiSearch - Natural language AI search

**Backend Integration:**
- ✅ AI Assist Route - Process natural language queries
- ✅ Scope filtering - Apply to suggestions
- ✅ Audit logging - Track searches

**Features:**
- ✅ Full permission gating
- ✅ Multi-language support
- ✅ Responsive design
- ✅ Error handling
- ✅ Type-safe TypeScript
- ✅ Zero compilation errors


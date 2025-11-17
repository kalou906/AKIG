# Système d'Internationalisation (i18n) AKIG

## 🌍 Vue d'ensemble

Système complet d'internationalisation supportant **3 langues** :
- 🇫🇷 **Français** (par défaut)
- 🇬🇧 **Anglais**
- 🇸🇦 **Arabe** (RTL - Droite à Gauche)

## 📦 Installation des dépendances

```bash
npm install i18next react-i18next i18next-browser-languagedetector i18next-http-backend
npm install -D i18next-parser
```

## 🗂️ Structure des fichiers

```
frontend/src/i18n/
├── config.ts                 # Configuration i18next
├── hooks.ts                  # Custom React hooks
├── utils.ts                  # Fonctions utilitaires
├── components/
│   └── LanguageSelector.tsx  # Composant sélecteur de langue
└── locales/
    ├── fr.json              # Traductions FR (racine)
    ├── en.json              # Traductions EN (racine)
    ├── ar.json              # Traductions AR (racine)
    └── namespaces/
        ├── fr/
        │   ├── common.json
        │   ├── payments.json
        │   ├── contracts.json
        │   ├── tenants.json
        │   ├── errors.json
        │   └── validation.json
        ├── en/
        │   └── [...files identiques]
        └── ar/
            └── [...files identiques]
```

## 🚀 Utilisation dans les composants React

### 1. Traduction simple avec namespace

```tsx
import { useI18n } from '@/i18n/hooks';

function MyComponent() {
  const t = useI18n('payments');  // Namespace payments
  
  return (
    <div>
      <h1>{t('title')}</h1>                           {/* "Paiements" */}
      <p>{t('subtitle')}</p>                          {/* "Gestion des paiements..." */}
      <button>{t('list.actions.view_details')}</button> {/* "Voir les détails" */}
    </div>
  );
}
```

### 2. Traduction multi-namespace

```tsx
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { t } = useTranslation(['common', 'payments', 'contracts']);
  
  return (
    <div>
      <h1>{t('common:app_name')}</h1>                    {/* "AKIG" */}
      <p>{t('payments:title')}</p>                       {/* "Paiements" */}
      <p>{t('contracts:title')}</p>                      {/* "Contrats" */}
    </div>
  );
}
```

### 3. Gestion de la langue

```tsx
import { useLanguage } from '@/i18n/hooks';

function LanguageControl() {
  const { language, setLanguage, getAvailableLanguages, isRTL } = useLanguage();
  
  return (
    <div style={{ direction: isRTL() ? 'rtl' : 'ltr' }}>
      <p>Langue actuelle: {language}</p>
      
      <button onClick={() => setLanguage('fr')}>Français</button>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('ar')}>العربية</button>
    </div>
  );
}
```

### 4. Formatage de date et devise

```tsx
import { useDateFormatter, useNumberFormatter } from '@/i18n/hooks';

function InvoiceDisplay({ amount, date }) {
  const { formatDate } = useDateFormatter();
  const { formatCurrency, formatNumber } = useNumberFormatter();
  
  return (
    <div>
      <p>Date: {formatDate(date)}</p>                    {/* "25/10/2025" en FR */}
      <p>Montant: {formatCurrency(amount, 'EUR')}</p>   {/* "1 250,00 €" en FR */}
      <p>Pourcentage: {formatNumber(0.95)}</p>          {/* "0,95" en FR */}
    </div>
  );
}
```

### 5. Messages d'erreur et validation

```tsx
import { useValidationMessages } from '@/i18n/hooks';

function FormValidator() {
  const { getErrorMessage, getHttpErrorMessage } = useValidationMessages();
  
  const validateEmail = (email) => {
    if (!email.includes('@')) {
      return getErrorMessage('email');  {/* "Veuillez entrer une adresse email valide" */}
    }
  };
  
  const handleApiError = (statusCode) => {
    const message = getHttpErrorMessage(statusCode);  {/* "Non autorisé" pour 401 */}
    console.error(message);
  };
}
```

### 6. Messages de notification

```tsx
import { useMessages } from '@/i18n/hooks';

function PaymentForm() {
  const { success, deleted, error, confirmDelete } = useMessages();
  
  const handleDelete = () => {
    if (window.confirm(confirmDelete())) {  {/* "Êtes-vous sûr..." */}
      // Delete logic
      alert(deleted());  {/* "Suppression réussie" */}
    }
  };
}
```

### 7. Sélecteur de langue prêt à l'emploi

```tsx
import { LanguageSelector } from '@/i18n/components/LanguageSelector';

function Header() {
  return (
    <header>
      <h1>AKIG</h1>
      
      {/* Dropdown */}
      <LanguageSelector variant="dropdown" />
      
      {/* Boutons */}
      <LanguageSelector variant="buttons" />
      
      {/* Flags/Icons */}
      <LanguageSelector variant="icons" />
    </header>
  );
}
```

## 📚 Namespaces disponibles

| Namespace | Contenu | Exemple |
|-----------|---------|---------|
| `common` | Éléments généraux UI | app_name, welcome, logout, etc. |
| `payments` | Paiements et reçus | title, list, form, receipt, arrears |
| `contracts` | Gestion des contrats | list, form, renewal, termination |
| `tenants` | Gestion des locataires | profile, documents, communication |
| `errors` | Messages d'erreur | HTTP errors, validation, auth |
| `validation` | Règles de validation | required, email, phone, etc. |

## 🔧 Fonctions utilitaires

```typescript
import * as i18nUtils from '@/i18n/utils';

// Traduction directe
i18nUtils.t('payments:title');  // "Paiements"

// Changer la langue
await i18nUtils.changeLanguage('en');

// Obtenir langue courante
const lang = i18nUtils.getCurrentLanguage();  // "en"

// Langues disponibles
const langs = i18nUtils.getAvailableLanguages();  // ["fr", "en", "ar"]

// Vérifier RTL
if (i18nUtils.isRTL()) {
  // Appliquer style RTL
}

// Formater date
i18nUtils.formatDateByLanguage(new Date());  // "25/10/2025" en FR

// Formater devise
i18nUtils.formatCurrencyByLanguage(1250, 'EUR');  // "1 250,00 €" en FR

// Direction du texte
const dir = i18nUtils.getTextDirection();  // "ltr" ou "rtl"
```

## 🌐 Initialisation dans l'app

```tsx
// App.tsx
import i18n from '@/i18n/config';
import { Suspense } from 'react';

export default function App() {
  return (
    <Suspense fallback={<div>Loading translations...</div>}>
      <YourAppContent />
    </Suspense>
  );
}
```

## 🎯 Bonnes pratiques

### ✅ À faire

```tsx
// Utiliser namespace approprié
const t = useI18n('payments');  // Pour page paiements
const { t: tCommon } = useTranslation('common');

// Formater date/devise
formatDate(new Date(), { year: 'numeric', month: 'long' });

// Utiliser clés imbriquées logiquement
t('list.columns.amount')  // payments:list.columns.amount
```

### ❌ À éviter

```tsx
// Ne pas mélanger namespaces dans clés
t('payments_title');  // Utiliser namespace: payments:title

// Ne pas interpoler directement
const msg = `Bonjour ${name}`;  // Utiliser t('hello', { name })

// Ne pas oublier namespaces
useI18n();  // Spécifier namespace pour meilleure perf
```

## 📝 Ajouter une nouvelle traduction

### 1. Ajouter aux fichiers JSON

```json
// locales/namespaces/fr/payments.json
{
  "new_feature": {
    "title": "Nouvelle fonctionnalité",
    "description": "Description de la nouvelle fonctionnalité"
  }
}
```

```json
// locales/namespaces/en/payments.json
{
  "new_feature": {
    "title": "New Feature",
    "description": "Description of the new feature"
  }
}
```

### 2. Utiliser dans le composant

```tsx
const t = useI18n('payments');
const title = t('new_feature.title');
```

## 🔄 Interpolation et formatage

```tsx
// Interpolation simple
t('greeting', { name: 'Jean' })
// Résultat: "Bonjour Jean"

// Formatage spécial
t('amount, { value: 1250, formatNumber: 'currency' }')
// Résultat: "1 250,00 €"

// Options multiples
t('date', {
  date: new Date(),
  formatDate: 'date'  // Utilise format configuré
})
```

## 📱 Support RTL (Arabe)

```tsx
import { useLanguage } from '@/i18n/hooks';

function Component() {
  const { isRTL } = useLanguage();
  
  return (
    <div style={{
      direction: isRTL() ? 'rtl' : 'ltr',
      textAlign: isRTL() ? 'right' : 'left'
    }}>
      Contenu adapté RTL
    </div>
  );
}
```

## 🔒 Considérations de sécurité

- Les traductions ne contiennent pas de données sensibles
- XSS protection: `escapeValue: false` configuré pour HTML formatting
- Les clés sont statiques (pas d'interpolation de clés)
- Les variables d'interpolation sont échappées par défaut

## 📊 Performance

- Lazy loading des traductions via HTTP backend
- Cache localStorage pour préférence utilisateur
- Détection automatique langue navigateur
- Namespaces pour split code par domaine

## 🐛 Debugging

```typescript
// En développement, activer debug
// Modifié dans config.ts: debug: process.env.NODE_ENV === 'development'

// Vérifier traductions manquantes
i18n.on('missingKey', (lngs, namespace, key) => {
  console.warn(`Missing translation: ${namespace}:${key} for ${lngs}`);
});
```

## 📖 Ressources

- [Documentation i18next](https://www.i18next.com/)
- [React-i18next](https://react.i18next.com/)
- [Language Detector](https://github.com/i18next/i18next-browser-languageDetector)

---

**Dernière mise à jour**: 25 Octobre 2025

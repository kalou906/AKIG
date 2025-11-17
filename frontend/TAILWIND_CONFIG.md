# 🎨 Configuration Tailwind CSS - AKIG

## 📋 Fichiers de Configuration

### `tailwind.config.js`
Configuration principale de Tailwind avec thème personnalisé AKIG.

**Couleurs disponibles:**
```js
// Accès via: bg-akig-blue, text-akig-red, etc.
akig: {
  blue: '#0F2557',      // Couleur primaire
  blueDeep: '#0B1F4B',  // Tonalité premium
  red: '#C62828',       // Rouge
  gold: '#F59E0B',      // Or/Ambre
  bg: '#F5F7FB',        // Fond clair
  text: '#0A0A0A',      // Texte noir
  muted: '#4B5563',     // Texte discret
  success: '#0EA5E9',   // Cyan succès
  warn: '#F59E0B',      // Jaune avertissement
  error: '#DC2626',     // Rouge erreur
  border: '#E5E7EB',    // Bordures
  hover: '#F3F4F6',     // États hover
  dark: '#1F2937',      // Noir foncé
  light: '#F9FAFB',     // Blanc très clair
  overlay: 'rgba(15,37,87,0.15)',
  flag: {
    red: '#CE1126',
    yellow: '#FCD116',
    green: '#009460',
  },
}
```

**Police de caractères:**
- `font-sans` - Montserrat → Inter
- `font-heading` - Poppins → Montserrat
- `font-display` - Montserrat Alternates (héros, têtes de chapitre)

**Gradients prêts à l’emploi:**

```js
backgroundImage: {
  'akig-flag-band': 'linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #FCD116 33.34%, #FCD116 66.66%, #009460 66.67%)',
  'akig-flag-diagonal': 'linear-gradient(135deg, #CE1126 0%, #CE1126 32%, #FCD116 32%, #FCD116 66%, #009460 66%, #009460 100%)',
  'akig-hero': 'radial-gradient(circle at top right, rgba(15,37,87,0.18), transparent 55%), linear-gradient(135deg, rgba(15,37,87,0.92), rgba(198,40,40,0.88))',
}
```

**Border Radius:**
- `rounded-xl` - 12px
- `rounded-2xl` - 16px

**Ombres personnalisées:**
```css
shadow-premium   /* 0 10px 30px rgba(15,37,87,0.15) */
shadow-sm        /* 0 1px 2px rgba(0,0,0,0.05) */
shadow-md        /* 0 4px 6px rgba(0,0,0,0.1) */
shadow-lg        /* 0 10px 15px rgba(0,0,0,0.1) */
shadow-xl        /* 0 20px 25px rgba(0,0,0,0.15) */
shadow-2xl       /* 0 25px 50px rgba(0,0,0,0.25) */
shadow-inner     /* inset 0 2px 4px rgba(0,0,0,0.06) */
```

### `postcss.config.js`
Configuration PostCSS pour Tailwind et autoprefixer.

```js
module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
  },
};
```

### `src/globals.css`
Styles globaux et composants Tailwind réutilisables.

**Classes de composants disponibles:**

#### Boutons
```html
<!-- Variantes -->
<button class="btn btn-primary">Primaire</button>
<button class="btn btn-secondary">Secondaire</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-warning">Avertissement</button>
<button class="btn btn-success">Succès</button>

<!-- Tailles -->
<button class="btn btn-sm">Petit</button>
<button class="btn">Normal</button>
<button class="btn btn-lg">Grand</button>

<!-- États -->
<button class="btn" disabled>Désactivé</button>
```

#### Formulaires
```html
<!-- Inputs -->
<input class="form-input" type="text" />
<select class="form-select"></select>
<textarea class="form-textarea"></textarea>

<!-- Labels et erreurs -->
<label class="form-label">Libellé</label>
<span class="form-error">Message d'erreur</span>
<span class="form-hint">Conseil d'utilisation</span>
```

#### Cartes
```html
<!-- Carte normale -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Titre</h3>
  </div>
  <div class="card-body">Contenu</div>
  <div class="card-footer">Pied de page</div>
</div>

<!-- Carte compacte -->
<div class="card-compact">Contenu</div>
```

#### Badges
```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-info">Info</span>
```

#### Alertes
```html
<div class="alert alert-primary">
  <span>Message d'information</span>
</div>
<div class="alert alert-success">Succès!</div>
<div class="alert alert-warning">Attention</div>
<div class="alert alert-error">Erreur</div>
<div class="alert alert-info">Info</div>
```

#### Tableaux
```html
<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>Colonne 1</th>
        <th>Colonne 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Data 1</td>
        <td>Data 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### Modales
```html
<div class="modal-backdrop">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">Titre</h3>
      <button>×</button>
    </div>
    <div class="modal-body">Contenu</div>
    <div class="modal-footer">
      <button>Annuler</button>
      <button>Confirmer</button>
    </div>
  </div>
</div>
```

#### Utilitaires de texte
```html
<!-- Limitation à 1 ligne avec ellipsis -->
<p class="truncate-lines-1">Texte très long...</p>

<!-- Limitation à 2 lignes -->
<p class="truncate-lines-2">Texte très long...</p>

<!-- Limitation à 3 lignes -->
<p class="truncate-lines-3">Texte très long...</p>
```

#### Animations
```html
<!-- Fade in -->
<div class="animate-fadeIn">Contenu</div>

<!-- Slide up -->
<div class="animate-slideInUp">Contenu</div>

<!-- Slide down -->
<div class="animate-slideInDown">Contenu</div>

<!-- Pulse custom -->
<div class="animate-pulse-custom">Contenu</div>
```

### `tailwind.d.ts`
Fichier de types TypeScript pour Tailwind (optionnel).

---

## 🚀 Utilisation en React

### Import des styles
```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css'; // ← Import global CSS

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Utilisation des classes Tailwind
```tsx
// src/components/MyComponent.tsx
export function MyComponent() {
  return (
    <div className="card">
      <h2 className="card-title">Titre</h2>
      <p className="text-akig-muted">Texte discret</p>
      <button className="btn btn-primary">Cliquez-moi</button>
    </div>
  );
}
```

### Utilisation des variables CSS
```tsx
export function StyledComponent() {
  return (
    <div style={{
      color: 'var(--color-primary)',
      backgroundColor: 'var(--color-bg)',
      boxShadow: 'var(--shadow-premium)',
    }}>
      Contenu stylisé
    </div>
  );
}
```

### Utilitaires Tailwind personnalisés
```tsx
// Couleurs AKIG
<div className="bg-akig-blue text-white">Primary Blue</div>
<div className="border-2 border-akig-error">Error border</div>

// Ombres
<div className="shadow-premium">Premium shadow</div>

// Spacing
<div className="space-y-4">Espacement personnalisé</div>

// Responsive
<div className="text-sm md:text-base lg:text-lg">
  Texte responsive
</div>
```

---

## 📱 Breakpoints Responsive

```js
{
  xs: '320px',   // Très petit écran
  sm: '640px',   // Petit (mobile)
  md: '768px',   // Moyen (tablet)
  lg: '1024px',  // Large (desktop)
  xl: '1280px',  // Très large
  '2xl': '1536px', // Ultra large
  '3xl': '1920px', // Murs d'écrans / salles de démo
}
```

**Utilisation:**
```html
<!-- S'applique à md et au-delà -->
<div class="text-sm md:text-base">Texte</div>

<!-- Hidden sur mobile, visible sur lg -->
<div class="hidden lg:block">Desktop only</div>

<!-- Responsive padding -->
<div class="px-4 md:px-6 lg:px-8">Contenu</div>
```

---

## 🎨 Personnalisation AKIG

### Ajouter une nouvelle couleur

Dans `tailwind.config.js`:
```js
colors: {
  akig: {
    // ... couleurs existantes
    custom: '#HEXCOLOR',
  },
}
```

Utilisation:
```html
<div class="bg-akig-custom text-akig-custom">Contenu</div>
```

### Ajouter un composant CSS

Dans `src/globals.css`:
```css
.my-custom-component {
  @apply px-4 py-2 rounded-lg bg-akig-blue text-white;
}
```

Utilisation:
```html
<div class="my-custom-component">Contenu</div>
```

### Ajouter une animation

Dans `tailwind.config.js`:
```js
extend: {
  keyframes: {
    customAnimation: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
  },
  animation: {
    customAnimation: 'customAnimation 0.3s ease-in-out',
  },
}
```

Utilisation:
```html
<div class="animate-customAnimation">Contenu</div>
```

---

## 🔍 Debugging

### Vérifier les classes générées
```bash
# Production build inclut toutes les classes utilisées
npm run build

# Development mode à chaque changement
npm run dev
```

### Classes non appliquées?
1. Vérifier que le fichier CSS global est importé
2. Vérifier que PostCSS est configuré
3. Vérifier que `tailwind.config.js` a le bon `content`
4. Vérifier les safelist pour les classes dynamiques

### Purger le cache
```bash
rm -rf node_modules/.cache
npm run dev
```

---

## ✅ Checklist d'Intégration

- [ ] `tailwind.config.js` créé (conteneurs, gradients, couleurs AKIG)
- [ ] `postcss.config.js` créé
- [ ] `src/globals.css` créé
- [ ] `src/styles/index.css` importé dans `main.tsx`
- [ ] Tailwind CSS dépendance installée (`npm install -D tailwindcss postcss autoprefixer`)
- [ ] Classes Tailwind fonctionnent en dev
- [ ] Build production génère les classes CSS

---

## 📚 Ressources

- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Tailwind UI Components](https://tailwindui.com)
- [AKIG Design System](./DESIGN_SYSTEM.md)

---

**Configuration Tailwind CSS AKIG - Prête pour la production** ✨

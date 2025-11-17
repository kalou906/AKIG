# 🎨 CSS Integration Guide - AKIG

## Fichier Principal: src/index.css

Ce fichier constitue la base CSS de toute l'application AKIG.

### Contenu

#### 1. Directives Tailwind
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
Charge les couches Tailwind CSS.

#### 2. Variables CSS AKIG
```css
:root {
  --color-primary: #0F2557;
  --color-secondary: #1e40af;
  --color-accent: #F59E0B;
  /* ... */
}
```
Définit les tokens design réutilisables.

#### 3. Composants Tailwind
```css
.btn-primary {
  @apply bg-akig-blue text-white hover:bg-opacity-90;
}

.card {
  @apply bg-white rounded-xl shadow-premium p-4;
}
```
Classes réutilisables construites avec `@apply`.

---

## 🔧 Intégration dans main.tsx

**IMPORTANT:** Assurez-vous que ce fichier CSS est importé dans `main.tsx`:

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // ← ESSENTIAL

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 📚 Classes Disponibles

### Composants

#### Cartes
```html
<!-- Carte normale -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Titre</h3>
  </div>
  <div class="card-body">Contenu</div>
</div>

<!-- Carte compacte -->
<div class="card-compact">Contenu</div>
```

#### Boutons
```html
<!-- Variantes -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-warning">Warning</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-outline">Outline</button>

<!-- Tailles -->
<button class="btn btn-sm">Petit</button>
<button class="btn">Normal</button>
<button class="btn btn-lg">Grand</button>
```

#### Formulaires
```html
<label class="form-label">Email</label>
<input type="email" class="form-input" />
<span class="form-error">Message d'erreur</span>
<span class="form-hint">Conseil utile</span>
```

#### Alertes
```html
<div class="alert alert-success">✓ Succès!</div>
<div class="alert alert-warning">⚠ Attention</div>
<div class="alert alert-error">✗ Erreur</div>
<div class="alert alert-info">ℹ Information</div>
```

#### Badges
```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
```

#### Tables
```html
<div class="table-wrapper">
  <table>
    <thead>
      <tr><th>Colonne</th></tr>
    </thead>
    <tbody>
      <tr><td>Données</td></tr>
    </tbody>
  </table>
</div>
```

### Utilitaires

#### Texte Tronqué
```html
<p class="truncate-lines-1">Long text...</p>
<p class="truncate-lines-2">Long text...</p>
<p class="truncate-lines-3">Long text...</p>
```

#### Animations
```html
<div class="animate-fadeIn">Fade in</div>
<div class="animate-slideInUp">Slide up</div>
<div class="animate-slideInDown">Slide down</div>
<div class="animate-slideInLeft">Slide left</div>
<div class="animate-slideInRight">Slide right</div>
```

#### Responsive
```html
<div class="container-adaptive px-4 md:px-6">
  Contenu avec padding responsive
</div>
```

---

## 🎯 Variables CSS

Disponibles via `var(--color-*)`:

```css
body {
  color: var(--color-text);
  background: var(--color-bg);
}

.my-element {
  border-color: var(--color-border);
  box-shadow: var(--shadow-premium);
}
```

---

## ⚠️ Avertissements Linter

Le linter CSS peut afficher des avertissements pour:
- `@tailwind` - Directiven Tailwind (normal)
- `@apply` - Directive Tailwind (normal)

Ces avertissements sont **sans danger** et disparaîtront au runtime avec Tailwind CLI/PostCSS.

---

## ✅ Checklist d'Intégration

- [ ] `src/index.css` en place
- [ ] Tailwind CSS installé (`npm install -D tailwindcss postcss autoprefixer`)
- [ ] `tailwind.config.js` configuré
- [ ] `postcss.config.js` configuré
- [ ] `import './index.css'` dans `main.tsx`
- [ ] Classes Tailwind fonctionnent en dev
- [ ] Classes personnalisées affichées correctement

---

## 🚀 Utilisation dans React

```tsx
import './index.css';

export function MyComponent() {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Mon Titre</h3>
      </div>
      <div className="card-body space-y-4">
        <input className="form-input" placeholder="Email" />
        <button className="btn btn-primary">Envoyer</button>
      </div>
    </div>
  );
}
```

---

**CSS AKIG - Production Ready** ✨

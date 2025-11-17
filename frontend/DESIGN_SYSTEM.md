# 🎨 Thème AKIG - Design System

## 📂 Structure des fichiers de configuration

```
frontend/
├── tailwind.config.js          # Config Tailwind CSS
├── postcss.config.js           # Config PostCSS
├── tailwind.d.ts               # Types TypeScript
├── src/
│   ├── globals.css             # Styles globaux
│   ├── styles/
│   │   └── index.css           # Import CSS
│   └── theme/
│       └── akigTheme.ts        # Tokens de design
```

---

## 🎨 Palette de Couleurs

### Couleurs Primaires

| Nom | Hex | Usage |
|-----|-----|-------|
| **Primary** | `#0F2557` | Boutons, headers, accents principaux |
| **Primary Deep** | `#0B1F4B` | Sections premium, héro, CTA alternatifs |
| **Secondary** | `#1e40af` | Éléments secondaires, hover states |
| **Accent** | `#F59E0B` | Highlights, notifications |
| **Overlay** | `rgba(15,37,87,0.15)` | Légères superpositions, cartes sur fond clair |

### Couleurs de Statut

| Nom | Hex | Usage |
|-----|-----|-------|
| **Success** | `#0EA5E9` | Confirmations, validations |
| **Warning** | `#F59E0B` | Avertissements, attention requise |
| **Error** | `#DC2626` | Erreurs, données critiques |
| **Info** | `#3B82F6` | Information générale |

### Couleurs Neutres

| Nom | Hex | Usage |
|-----|-----|-------|
| **Background** | `#F5F7FB` | Fond clair app |
| **Background Light** | `#FFFFFF` | Cartes, sections |
| **Background Hover** | `#F3F4F6` | États hover |
| **Text** | `#0A0A0A` | Texte principal |
| **Text Muted** | `#4B5563` | Texte secondaire |
| **Text Light** | `#6B7280` | Texte discret |
| **Border** | `#E5E7EB` | Bordures standard |
| **Border Light** | `#F3F4F6` | Bordures légères |

### Drapeau guinéen

| Nom | Hex |
|-----|-----|
| **Flag Red** | `#CE1126` |
| **Flag Yellow** | `#FCD116` |
| **Flag Green** | `#009460` |

Utiliser `bg-akig-flag-band` ou `bg-akig-flag-diagonal` pour afficher les trois bandes.

### Gradients

| Classe | Description |
|--------|-------------|
| `bg-akig-hero` | Gradient héro (bleu profond → rouge) avec halo radial |
| `bg-akig-flag-band` | Bande horizontale rouge/jaune/vert |
| `bg-akig-flag-diagonal` | Version diagonale de la bande guinéenne |
| `bg-akig-flag-vertical` | Bande verticale (gauche/droite) |

---

## 📏 Système d'Espacement

```ts
// Multiples de 0.25rem (4px)
xs: '0.25rem'    // 4px
sm: '0.5rem'     // 8px
md: '1rem'       // 16px
lg: '1.5rem'     // 24px
xl: '2rem'       // 32px
2xl: '3rem'      // 48px
3xl: '4rem'      // 64px
```

**Utilisation Tailwind:**
```html
<!-- Padding -->
<div class="p-md">Contenu</div>

<!-- Margin -->
<div class="m-lg">Contenu</div>

<!-- Gap -->
<div class="gap-sm flex">Contenu</div>

<!-- Space-y -->
<div class="space-y-md">
  <p>Paragraphe 1</p>
  <p>Paragraphe 2</p>
</div>
```

---

## 🔤 Système Typographique

### Polices

- **Sans Serif:** Montserrat (fallback Inter)
  - Lisible, géométrique, pensée pour les interfaces
- **Heading:** Poppins (fallback Montserrat)
  - Distinctive, idéale pour les titres et CTA
- **Display:** Montserrat Alternates
  - Usage ponctuel pour slogans, chiffres-clés ou sections héro

### Tailles

| Classe | Taille | Utilisation |
|--------|--------|-------------|
| `text-xs` | 0.75rem | Petits labels |
| `text-sm` | 0.875rem | Sous-texte |
| `text-base` | 1rem | Texte normal |
| `text-lg` | 1.125rem | Texte prominent |
| `text-xl` | 1.25rem | Sous-titres |
| `text-2xl` | 1.5rem | Titres secondaires |
| `text-3xl` | 1.875rem | Titres principaux |
| `text-4xl` | 2.25rem | Héros |

### Line Height

```html
<p class="leading-tight">Ligne serrée (1.25)</p>
<p class="leading-normal">Ligne normale (1.5)</p>
<p class="leading-relaxed">Ligne aérée (1.625)</p>
```

---

## 🎛️ Système de Rayon de Bordure

```ts
sm: '4px'      // Petits éléments
md: '8px'      // Standard
lg: '12px'     // Grands éléments
xl: '16px'     // Sections principales
```

**Utilisation:**
```html
<button class="rounded-lg">Normal</button>
<div class="rounded-xl">Grande section</div>
```

---

## 🌓 Système d'Ombres

```ts
sm:      '0 1px 2px rgba(0,0,0,0.05)'
md:      '0 4px 6px rgba(0,0,0,0.1)'
lg:      '0 10px 15px rgba(0,0,0,0.1)'
xl:      '0 20px 25px rgba(0,0,0,0.15)'
2xl:     '0 25px 50px rgba(0,0,0,0.25)'
premium: '0 10px 30px rgba(15,37,87,0.15)'
hero:    '0 25px 55px rgba(11,31,75,0.22)'
inner:   'inset 0 2px 4px rgba(0,0,0,0.06)'
```

**Utilisation:**
```html
<div class="shadow-md">Ombre moyenne</div>
<div class="shadow-premium">Ombre premium</div>
```

---

## 📱 Points de Rupture Responsive

```ts
xs:  '320px'   // Très petit mobile
sm:  '640px'   // Mobile standard
md:  '768px'   // Tablet
lg:  '1024px'  // Desktop
xl:  '1280px'  // Grand desktop
2xl: '1536px'  // Ultra large
3xl: '1920px'  // TV, murs d'écrans, salles de démonstration
```

**Utilisation:**
```html
<!-- Hidden on mobile, visible on md+ -->
<div class="hidden md:block">Desktop content</div>

<!-- Responsive font -->
<h1 class="text-xl md:text-2xl lg:text-3xl">Title</h1>

<!-- Responsive layout -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <div>Card</div>
</div>
```

---

## ⏱️ Transitions

```ts
fast: '150ms ease-in-out'   // Interactions rapides
base: '200ms ease-in-out'   // Standard
slow: '300ms ease-in-out'   // Animations majeures
```

**Utilisation:**
```html
<div class="transition-colors duration-200 hover:bg-akig-blue">
  Hover effect
</div>
```

---

## 🎯 Utilisation en TypeScript/React

### Import du thème

```tsx
import { akigTheme, getColor, cn } from '@/theme/akigTheme';

// Utiliser les tokens
const primaryColor = akigTheme.colors.primary;
const spacing = akigTheme.spacing.md;
```

### Utilitaires pratiques

```tsx
// cn() - Fusionner les classes
import { cn } from '@/theme/akigTheme';

const buttonClass = cn(
  'btn',
  isPrimary && 'btn-primary',
  isLarge && 'btn-lg'
);

// getColor() - Couleur avec opacité
import { getColor } from '@/theme/akigTheme';

const style = {
  backgroundColor: getColor('primary', 0.5), // RGBA
  color: getColor('text'),
};

// getResponsive() - Classes responsive
import { getResponsive } from '@/theme/akigTheme';

const classes = getResponsive({
  sm: 'w-full',
  md: 'w-1/2',
  lg: 'w-1/3',
});
```

### Status Colors

```tsx
import { statusColors } from '@/theme/akigTheme';

// Utiliser les couleurs de statut
const successColor = statusColors.success.text;
const errorBg = statusColors.error.bg;

// Dans un composant
export function Alert({ type }: { type: 'success' | 'error' | 'warning' | 'info' }) {
  const colors = statusColors[type];
  return (
    <div style={{ 
      backgroundColor: colors.bg, 
      borderColor: colors.border, 
      color: colors.text 
    }}>
      Message
    </div>
  );
}
```

### Component Sizes

```tsx
import { sizes } from '@/theme/akigTheme';

// Récupérer les dimensions
const buttonSmall = sizes.button.sm;
const inputMedium = sizes.input.md;
const cardLarge = sizes.card.lg;

// Appliquer au style
const buttonStyle = {
  ...sizes.button.md,
  backgroundColor: akigTheme.colors.primary,
};
```

---

## 🚀 Exemples Complets

### Bouton Stylisé

```tsx
import { cn, akigTheme } from '@/theme/akigTheme';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  disabled,
  children,
}: React.PropsWithChildren<ButtonProps>) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  
  return (
    <button 
      className={cn(baseClass, variantClass, sizeClass, disabled && 'opacity-50 cursor-not-allowed')}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### Carte Responsive

```tsx
export function Card({ title, children }) {
  return (
    <div className="card gap-md">
      <div className="card-header">
        <h3 className="card-title text-lg md:text-xl font-heading">{title}</h3>
      </div>
      <div className="card-body space-y-md">
        {children}
      </div>
    </div>
  );
}
```

### Alert avec Statut

```tsx
import { statusColors } from '@/theme/akigTheme';

export function StatusAlert({ status, message }: { status: 'success' | 'error' | 'warning' | 'info'; message: string }) {
  const colors = statusColors[status];
  
  return (
    <div 
      className="alert p-md rounded-lg"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderLeftWidth: '4px',
        color: colors.text,
      }}
    >
      {message}
    </div>
  );
}
```

---

## 🎨 Personnalisation

### Ajouter une nouvelle couleur

1. **Dans `tailwind.config.js`:**
```js
colors: {
  akig: {
    // ...
    custom: '#HEXCOLOR',
  }
}
```

2. **Dans `akigTheme.ts`:**
```ts
colors: {
  // ...
  custom: '#HEXCOLOR',
}
```

3. **Utilisation:**
```html
<div class="bg-akig-custom text-akig-custom">Contenu</div>
```

### Ajouter une animation

1. **Dans `tailwind.config.js`:**
```js
extend: {
  keyframes: {
    bounce: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
  },
  animation: {
    bounce: 'bounce 2s infinite',
  },
}
```

2. **Utilisation:**
```html
<div class="animate-bounce">Bouncing element</div>
```

---

## ✅ Checklist d'Utilisation

- [ ] Tailwind CSS installé et configuré
- [ ] `globals.css` importé dans `main.tsx`
- [ ] Thème `akigTheme.ts` accessible
- [ ] Classes de composants Tailwind utilisées
- [ ] Variables CSS utilisées où pertinent
- [ ] Design responsive implémenté
- [ ] Tests de contraste de couleurs passés
- [ ] Toutes les parties du site utilisent le thème

---

## 📚 Ressources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [AKIG Tailwind Config](./TAILWIND_CONFIG.md)
- [Design Tokens](./src/theme/akigTheme.ts)

---

**Thème AKIG - Design System Complet** ✨

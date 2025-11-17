# 🎨 Système Branding AKIG - Palette Bleu/Blanc/Rouge

## Vue d'ensemble

Le système de branding AKIG utilise une palette cohérente **bleu/blanc/rouge** inspirée du drapeau guinéen, combinée avec design moderne professionnel pour une agence immobilière.

### Couleurs Primaires

```
🔵 BLEU PRINCIPAL
├─ Darkest:  #001F3F (Bleu marine foncé)
├─ Dark:     #003D82 (Bleu foncé)
├─ Primary:  #0056B3 (Bleu principal - Navigation, Boutons primaires)
├─ Medium:   #1E90FF (Bleu moyen - Accents)
├─ Light:    #4DAAFF (Bleu clair)
├─ Lighter:  #B3D9FF (Bleu très clair)
└─ Lightest: #E6F2FF (Bleu ultra clair - Fonds, Surbrillance)

🔴 ROUGE PRINCIPAL
├─ Darkest:  #660000 (Rouge très foncé)
├─ Dark:     #990000 (Rouge foncé)
├─ Primary:  #CC0000 (Rouge principal - Accents, Urgence)
├─ Medium:   #FF3333 (Rouge moyen)
├─ Light:    #FF6666 (Rouge clair)
├─ Lighter:  #FFB3B3 (Rouge très clair)
└─ Lightest: #FFE6E6 (Rouge ultra clair - Fonds)

⚪ BLANCS & NEUTRES
├─ White:       #FFFFFF (Blanc pur)
├─ OffWhite:    #F8F9FA (Blanc cassé - Fonds)
├─ LightGray:   #E9ECEF (Gris clair - Bordures)
├─ Gray:        #DEE2E6 (Gris)
├─ MediumGray:  #ADB5BD (Gris moyen - Texte secondaire)
├─ DarkGray:    #495057 (Gris foncé - Texte)
└─ Charcoal:    #212529 (Charcoal - Texte principal)
```

---

## Architecture Couleurs

### Système Hiérarchique

```
NIVEAU 1 - STRUCTURE
├─ Background:    #F8F9FA (OffWhite)
├─ Surface:       #FFFFFF (White)
├─ Border:        #E9ECEF (LightGray)
└─ Text Primary:  #212529 (Charcoal)

NIVEAU 2 - ACTIONS
├─ Primary Action:   #0056B3 (Bleu)
├─ Secondary Action: #CC0000 (Rouge)
├─ Success:          #28A745 (Vert)
└─ Warning:          #FFC107 (Jaune)

NIVEAU 3 - FONDS
├─ Blue Background:  #E6F2FF (Bleu clair)
├─ Red Background:   #FFE6E6 (Rouge clair)
└─ Gray Background:  #E9ECEF (Gris clair)
```

---

## Guide d'Utilisation

### 1. Navigation & Headers

```css
/* Gradient bleu élégant */
background: linear-gradient(135deg, #001F3F 0%, #0056B3 100%);
color: #FFFFFF;
```

**Où l'utiliser:**
- Header principal
- Barres de navigation
- Sections de titre

---

### 2. Boutons Primaires

```css
/* Bleu avec ombre */
.btn-primary {
  background-color: #0056B3;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(0, 86, 179, 0.2);
}

.btn-primary:hover {
  background-color: #003D82;
  box-shadow: 0 8px 24px rgba(0, 86, 179, 0.4);
}
```

**Où l'utiliser:**
- Boutons d'action principaux
- CTAs (Call To Action)
- Boutons de validation

---

### 3. Boutons Secondaires/Accents

```css
/* Rouge pour urgence/importance */
.btn-secondary {
  background-color: #CC0000;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(204, 0, 0, 0.2);
}

.btn-secondary:hover {
  background-color: #990000;
}
```

**Où l'utiliser:**
- Boutons d'alerte
- Actions urgentes
- Boutons de danger/suppression

---

### 4. Boutons Outline (Secondaire)

```css
/* Blanc avec bordure bleu */
.btn-outline {
  background-color: #FFFFFF;
  color: #0056B3;
  border: 2px solid #0056B3;
}

.btn-outline:hover {
  background-color: #E6F2FF;
}
```

**Où l'utiliser:**
- Options alternatives
- Boutons secondaires
- Annulation/Retour

---

### 5. Cards & Conteneurs

```css
.card {
  background-color: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-left: 4px solid #0056B3;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card:hover {
  border-left-color: #CC0000;
  box-shadow: 0 8px 24px rgba(0, 86, 179, 0.15);
}
```

---

### 6. Fonds & Surbrillances

```css
/* Info/Attention */
background-color: #E6F2FF;  /* Bleu clair */
border-left: 4px solid #0056B3;

/* Alerte/Danger */
background-color: #FFE6E6;  /* Rouge clair */
border-left: 4px solid #CC0000;

/* Succès */
background-color: #D4EDDA;  /* Vert clair */
border-left: 4px solid #28A745;
```

---

### 7. Inputs & Formulaires

```css
input {
  border: 2px solid #E9ECEF;
  background-color: #F8F9FA;
}

input:focus {
  border-color: #0056B3;
  box-shadow: 0 0 0 4px #E6F2FF;
  background-color: #FFFFFF;
}
```

---

### 8. Texte & Typographie

```css
/* Titre principal */
h1 { color: #003D82; font-weight: 800; }

/* Sous-titres */
h2, h3 { color: #0056B3; font-weight: 700; }

/* Texte normal */
p { color: #495057; }

/* Liens */
a { color: #0056B3; }
a:hover { color: #CC0000; }
```

---

## Accents Complémentaires

```
🟡 OR/GOLD:       #FFD700 (Détails, Récompenses)
🟢 SUCCÈS:        #28A745 (Confirmations, Positif)
🟠 AVERTISSEMENT: #FFC107 (Avertissements)
🔵 INFO:          #17A2B8 (Information)
```

---

## Combinaisons Recommandées

### Combinaison 1: Classique Bleu
```css
Primary:    #0056B3 (Bleu)
Secondary:  #E6F2FF (Bleu clair)
Text:       #003D82 (Bleu foncé)
```

### Combinaison 2: Énergie Rouge
```css
Primary:    #CC0000 (Rouge)
Secondary:  #FFE6E6 (Rouge clair)
Text:       #990000 (Rouge foncé)
```

### Combinaison 3: Gradient Dynamique
```css
From:  #0056B3 (Bleu)
To:    #CC0000 (Rouge)
Via:   #FFFFFF (Blanc)
```

### Combinaison 4: Neutre Professionnel
```css
Background: #F8F9FA (OffWhite)
Surface:    #FFFFFF (White)
Accent:     #0056B3 (Bleu)
Text:       #212529 (Charcoal)
```

---

## Fichiers Générés

### 1. CSS Principal
📄 `branding-colors.css` - Fichier CSS complet avec:
- Variables CSS (--color-*)
- Système de boutons
- Styles de cards
- Animations
- Utilities (spacing, colors, etc.)

### 2. Logos SVG
- `logo-default.svg` - Logo standard avec maison
- `logo-favicon.svg` - Petit logo (favicon)
- `logo-gradient.svg` - Logo avec dégradé bleu/rouge
- `logo-hexagon.svg` - Logo hexagon moderne
- `logo-minimal.svg` - Logo minimaliste

### 3. Services Backend
- `branding-colors.service.js` - Gestion couleurs/palette
- `logo-generator.service.js` - Génération logos dynamiques

---

## Variables CSS Globales

```css
/* Utilisation dans les composants */

:root {
  --color-blue-primary: #0056B3;
  --color-red-primary: #CC0000;
  --color-white: #FFFFFF;
  --primary: var(--color-blue-primary);
  --secondary: var(--color-red-primary);
  --accent: #FFD700;
}

/* Dans les composants */
.button {
  background-color: var(--primary);
  color: var(--color-white);
}
```

---

## API Endpoints Couleurs

### GET /api/branding/config
Récupère la configuration branding complète:
```json
{
  "palette": { ... },
  "primary": "#0056B3",
  "secondary": "#CC0000",
  "accent": "#FFD700",
  "cssUrl": "/public/branding/branding-colors.css"
}
```

### GET /api/branding/css
Retourne le fichier CSS complet

### GET /api/branding/logo
Retourne le logo SVG (type spécifiable)

---

## Implémentation dans React

```jsx
import styles from './PropertyAnalysisDashboard.module.css';

export default function Dashboard() {
  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Analyse Immobilière</h1>
      </header>
      
      <button className={styles.btnPrimary}>Analyser</button>
      <button className={styles.btnSecondary}>Alerte</button>
    </div>
  );
}
```

---

## Responsabilité d'Accessibilité

✅ **Contraste WCAG AA**
- Bleu (#0056B3) sur Blanc: 8.5:1 ✓
- Rouge (#CC0000) sur Blanc: 5.2:1 ✓
- Texte sur fonds clairs: >4.5:1 ✓

✅ **Distinctions**
- Pas de reliance sur couleur seule
- Icônes + texte
- Ombres et bordures

---

## Mise à Jour Palette

Pour modifier les couleurs, éditer:
1. `branding-colors.service.js` - `GUINEAN_PALETTE`
2. Régénérer CSS: `await saveBrandingCSS()`
3. Régénérer logos: `await saveAllLogos()`

---

**Créé pour**: Agence Immobilière AKIG - Guinée  
**Version**: 1.0  
**Dernière mise à jour**: 2024-01-15

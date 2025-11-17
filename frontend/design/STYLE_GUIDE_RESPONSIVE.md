# Guide Responsive AKIG

> **But** : garantir un rendu cohérent (mobile → bureau) en respectant la charte AKIG (bleu, rouge, or + bande guinéenne).

## Points de rupture

| Alias | Largeur min. | Usage clé |
|-------|--------------|-----------|
| `xs`  | 320px        | Appareils très compacts, écrans d’accueil |
| `sm`  | 640px        | Mobiles portrait, flux linéaires |
| `md`  | 768px        | Tablettes, panneaux côte à côte |
| `lg`  | 1024px       | Bureau standard, navigation latérale |
| `xl`  | 1280px       | Tableaux de bord riches |
| `2xl` | 1536px       | Grands écrans, présentations |
| `3xl` | 1920px       | TV murale / salle de réunion |

### Exemple

```tsx
<section className="px-6 py-12 md:px-10 lg:px-18">
	<h1 className="text-3xl md:text-4xl lg:text-5xl">Gestion AKIG</h1>
	<p className="mt-4 text-base md:text-lg lg:text-xl text-akig-muted">
		Optimisée pour smartphone, tablette et desktop.
	</p>
</section>
```

## Conteneur & largeur

- Utiliser `container` pour centrer la zone de contenu.
- Tampons automatiques : `1.5rem` (base) → `4rem` (`2xl`).
- Largeurs utiles : `max-w-content` (1152px), `max-w-content-wide` (1280px), `max-w-screen-3xl` (1920px).

```tsx
<header className="bg-akig-hero">
	<div className="container max-w-content text-white py-16">
		...
	</div>
</header>
```

## Palette responsive

### Couleurs AKIG

- Bleu primaire : `bg-akig-blue` (CTA sobres)
- Bleu profond : `bg-akig-blueDeep` (fonds premium)
- Rouge : `text-akig-red` (alertes)
- Or : `border-akig-gold` (surbrillance)
- Superposition : `bg-akig-hero` (gradients prêts à l’emploi)

### Bande guinéenne

- `bg-akig-flag-band` : bande horizontale 3 couleurs
- `bg-akig-flag-diagonal` : diagonale pour cartes
- `bg-akig-flag-vertical` : liseré vertical (bordure gauche/droite)
- `text-akig-flag-red|yellow|green` : micro-indicateurs

```tsx
<span className="inline-block h-1 w-16 rounded bg-akig-flag-band" aria-hidden />
```

## Comportements recommandés

- **Navigation** : passer en `flex-col` et masquer les labels < `md`.
- **Statistiques** : `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` pour garder la densité.
- **Actions** : regrouper les boutons en `flex-col sm:flex-row`.
- **Tableaux** : utiliser `overflow-x-auto` avec badges colorés (`text-akig-flag-yellow`).

## Ressources

- Tokens TypeScript : `src/theme/akigTheme.ts`
- Configuration Tailwind : `tailwind.config.js`
- Variantes CSS legacy : `src/index.css`
- QA exports premium (référence visuelle) : `docs/PREMIUM_EXPORTS_QA.md`

---

**Checklist responsive**

- [ ] Banners : gradient `bg-akig-hero`
- [ ] Grilles : `grid-cols-1` sur mobile, >2 colonnes à partir de `md`
- [ ] Boutons : `w-full` sur mobile, `w-auto` dès `sm`
- [ ] PDF / exports : bande guinéenne présente
- [ ] Tests visuels sur viewport 375px, 768px, 1280px

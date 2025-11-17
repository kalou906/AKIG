# Composant PrimaryButton

## Vue d'ensemble

Le composant `PrimaryButton` est le bouton principal de l'application AKIG. Il offre une expérience utilisateur cohérente avec accessibilité intégrée.

## Utilisation basique

```jsx
import PrimaryButton from './components/PrimaryButton';

export default function MyComponent() {
  const handleClick = () => {
    console.log('Bouton cliqué!');
  };

  return (
    <PrimaryButton 
      label="Cliquez-moi" 
      onClick={handleClick}
    />
  );
}
```

## Props

### Props requises

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Texte du bouton |

### Props optionnelles

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `onClick` | `function` | `undefined` | Fonction appelée au clic |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Type du bouton HTML |
| `disabled` | `boolean` | `false` | Désactiver le bouton |
| `loading` | `boolean` | `false` | État de chargement |
| `className` | `string` | `''` | Classes CSS supplémentaires |
| `ariaLabel` | `string` | `label` | Label pour l'accessibilité |
| `dataTestId` | `string` | `primary-button-{label}` | Attribut data-testid |
| `title` | `string` | `undefined` | Tooltip du bouton |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille du bouton |
| `icon` | `ReactNode` | `null` | Icône à afficher |
| `fullWidth` | `boolean` | `false` | Largeur complète du parent |

## Exemples d'utilisation

### Bouton simple

```jsx
<PrimaryButton label="Envoyer" />
```

### Bouton avec onClick

```jsx
<PrimaryButton 
  label="Supprimer" 
  onClick={() => deleteItem(id)}
/>
```

### Bouton de soumission de formulaire

```jsx
<form onSubmit={handleSubmit}>
  <input type="email" name="email" required />
  <PrimaryButton 
    label="S'inscrire"
    type="submit"
  />
</form>
```

### Bouton désactivé

```jsx
<PrimaryButton 
  label="Accepter" 
  disabled={!hasAcceptedTerms}
/>
```

### Bouton avec état de chargement

```jsx
const [loading, setLoading] = useState(false);

const handleSave = async () => {
  setLoading(true);
  try {
    await saveData();
  } finally {
    setLoading(false);
  }
};

<PrimaryButton 
  label="Enregistrer" 
  onClick={handleSave}
  loading={loading}
/>
```

### Bouton avec tailles différentes

```jsx
<PrimaryButton label="Petit" size="sm" />
<PrimaryButton label="Moyen" size="md" />
<PrimaryButton label="Grand" size="lg" />
```

### Bouton avec icône

```jsx
import { FiDownload } from 'react-icons/fi';

<PrimaryButton 
  label="Télécharger" 
  icon={<FiDownload />}
/>
```

### Bouton pleine largeur

```jsx
<PrimaryButton 
  label="Continuer" 
  fullWidth={true}
/>
```

### Bouton personnalisé avec plusieurs props

```jsx
<PrimaryButton 
  label="Payer maintenant"
  type="submit"
  size="lg"
  fullWidth={true}
  onClick={handlePayment}
  loading={isProcessing}
  disabled={!isFormValid}
  title="Cliquer pour procéder au paiement"
  ariaLabel="Procéder au paiement de la facture"
  dataTestId="payment-submit-btn"
  icon={<FiCreditCard />}
/>
```

## États visuels

### État normal (hover)

- Gradient plus foncé
- Ombre légère
- Légèrement soulevé (translateY -1px)

```css
background: linear-gradient(135deg, #089 0%, #067 100%);
box-shadow: 0 4px 12px rgba(0, 181, 85, 0.3);
transform: translateY(-1px);
```

### État actif (pressed)

- Ombre réduite
- Revient à la position normale

```css
transform: translateY(0);
box-shadow: 0 2px 6px rgba(0, 181, 85, 0.2);
```

### État désactivé

- Opacité réduite
- Couleur grisée
- Pas de curseur pointeur

```css
background: #ccc;
color: #666;
cursor: not-allowed;
opacity: 0.6;
```

### État loading

- Spinner rotatif
- Bouton désactivé
- Opacité légèrement réduite

```css
pointer-events: none;
opacity: 0.8;
```

## Accessibilité

### Features d'accessibilité intégrées

✅ **Sémantique HTML**
- Élément `<button>` standard (pas de `<div>`)
- Attribut `type` approprié
- Attributs ARIA pour les états

✅ **Clavier**
- Navigation avec Tab/Shift+Tab
- Activation avec Entrée/Espace
- Focus visible avec outline 2px

✅ **Lecteurs d'écran**
- `aria-label` pour le texte du bouton
- `aria-busy="true"` pendant le chargement
- Annonce "est en cours de traitement" en loading
- Icônes marquées `aria-hidden="true"`

✅ **Contraste**
- Ratio de contraste ≥ 4.5:1
- Couleurs du design validées

✅ **Mouvement réduit**
- Respecte `prefers-reduced-motion`
- Animations désactivées si activé

## Styles personnalisés

### Override des styles CSS Modules

```jsx
import PrimaryButton from './PrimaryButton';
import styles from './MyComponent.module.css';

<PrimaryButton 
  label="Custom" 
  className={styles.customButton}
/>
```

```css
/* MyComponent.module.css */
.customButton {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: 700;
  font-size: 18px;
}
```

### Utiliser avec Tailwind CSS (si applicable)

```jsx
<PrimaryButton 
  label="Tailwind" 
  className="bg-blue-500 hover:bg-blue-700"
/>
```

## Tests

### Exécuter les tests

```bash
npm test -- PrimaryButton.test.jsx
```

### Couverture des tests

- ✅ Rendu basique
- ✅ Props et attributs
- ✅ État désactivé
- ✅ État loading
- ✅ Gestion des clics
- ✅ Accessibilité
- ✅ Intégration avec formulaires
- ✅ Edge cases

### Exemple de test

```jsx
test('appelle onClick lors du clic', () => {
  const handleClick = jest.fn();
  
  render(
    <PrimaryButton 
      label="Test" 
      onClick={handleClick}
    />
  );
  
  const button = screen.getByRole('button');
  fireEvent.click(button);
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## Bonnes pratiques

✅ **À faire**:
- Utiliser des labels clairs et concis
- Désactiver quand l'action n'est pas valide
- Afficher le loading lors de requêtes async
- Fournir des titles pour les actions critiques
- Tester l'accessibilité au clavier

❌ **À éviter**:
- Utiliser comme simple div avec onClick
- Oublier le disabled pour actions invalides
- Textes de bouton trop longs (>30 caractères)
- Overlayer plusieurs boutons sans contexte
- Utiliser pour la navigation (utiliser `<Link>`)

## Tailles recommandées

| Taille | Utilisation |
|--------|-------------|
| `sm` | Boutons secondaires, actions mineures |
| `md` | Boutons principaux, actions courantes |
| `lg` | CTAs critiques, actions majeures |

## Performance

- Composant fonctionnel léger
- Pas de re-render inutiles avec React.memo (à considérer)
- CSS Modules pour l'isolation des styles
- Aucune animation lourde

## Compatibilité navigateurs

- ✅ Chrome/Edge ≥ 90
- ✅ Firefox ≥ 88
- ✅ Safari ≥ 14
- ✅ iOS Safari ≥ 14
- ✅ Android Browser ≥ 9

## Ressources

- `frontend/src/components/PrimaryButton.jsx` - Composant
- `frontend/src/components/PrimaryButton.module.css` - Styles
- `frontend/src/components/PrimaryButton.test.jsx` - Tests (50+ cas)
- `COMPONENT_LIBRARY.md` - Catalogue complet des composants

---

**Un bon bouton = une meilleure UX** ✨

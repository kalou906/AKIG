# 📋 GUIDE COMPLET - AJOUTER VOTRE LOGO À AKIG

## 🎯 Vue d'ensemble

Votre logo personnel peut être intégré à **3 endroits clés** du système:
1. ✅ **Page de connexion** (Login)
2. ✅ **Sidebar (Barre latérale)**
3. ✅ **Navbar (Barre de navigation)**
4. ✅ **Favicon** (Icône du navigateur)

---

## 📁 ÉTAPE 1: Préparer votre logo

### Option A: Format PNG (RECOMMANDÉ)
```
Format: PNG avec transparence
Dimensions: 512x512 pixels (minimum)
Poids: < 100 KB
```

### Option B: Format SVG (OPTIMAL)
```
Format: SVG vectoriel
Dimensions: Scalable (automatique)
Poids: < 50 KB
Avantage: Reste net à toutes les tailles
```

### Option C: Format JPG
```
Format: JPG standard
Dimensions: 512x512 pixels
Poids: < 100 KB
```

---

## 🚀 ÉTAPE 2: Placer le fichier logo

### Créer un dossier pour les assets
```powershell
# Naviguez au dossier frontend
cd c:\AKIG\frontend\public

# Créez un sous-dossier pour les logos
mkdir assets
mkdir assets\logos
```

### Copier votre logo
**Placer votre fichier logo dans:**
```
c:\AKIG\frontend\public\assets\logos\
```

**Nommer le fichier:**
```
Exemples valides:
- my-logo.png
- company-logo.svg
- logo.png
- branding.svg
```

### Pour ce guide, nous utiliserons le nom:
```
c:\AKIG\frontend\public\assets\logos\my-logo.png
```

---

## 🎨 ÉTAPE 3: Intégrer le logo - PAGE DE CONNEXION

### Localiser le fichier
```
c:\AKIG\frontend\src\pages\Login.jsx
```

### Trouver cette section (lignes 69-77):
```jsx
{/* Logo & Header */}
<div className="text-center mb-8">
    <div className="flex items-center justify-center gap-3 mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-white to-blue-100 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-blue-600">A</span>
        </div>
        <div>
            <h1 className="text-3xl font-bold text-white">AKIG</h1>
            <p className="text-blue-100 text-sm">Gestion Immobilière Premium</p>
        </div>
    </div>
</div>
```

### Option 1: Logo carré standard (Recommandé)
Remplacer par:
```jsx
{/* Logo & Header */}
<div className="text-center mb-8">
    <div className="flex items-center justify-center gap-3 mb-4">
        <img 
            src="/assets/logos/my-logo.png" 
            alt="Logo" 
            className="w-14 h-14 object-contain drop-shadow-lg"
        />
        <div>
            <h1 className="text-3xl font-bold text-white">AKIG</h1>
            <p className="text-blue-100 text-sm">Gestion Immobilière Premium</p>
        </div>
    </div>
</div>
```

### Option 2: Logo large (Logo en vedette)
Remplacer par:
```jsx
{/* Logo & Header */}
<div className="text-center mb-8">
    <img 
        src="/assets/logos/my-logo.png" 
        alt="Logo" 
        className="w-24 h-24 mx-auto mb-4 drop-shadow-xl"
    />
    <h1 className="text-3xl font-bold text-white">AKIG</h1>
    <p className="text-blue-100 text-sm">Gestion Immobilière Premium</p>
</div>
```

### Option 3: Logo horizontal (Avec texte intégré)
Remplacer par:
```jsx
{/* Logo & Header */}
<div className="text-center mb-8">
    <div className="flex items-center justify-center gap-2 mb-4">
        <img 
            src="/assets/logos/my-logo.png" 
            alt="Logo" 
            className="h-16 object-contain drop-shadow-lg"
        />
    </div>
    <p className="text-blue-100 text-sm">Gestion Immobilière Premium</p>
</div>
```

---

## 🎨 ÉTAPE 4: Intégrer le logo - SIDEBAR

### Localiser le fichier
```
c:\AKIG\frontend\src\components\Navbar.jsx
```

### Chercher la section du logo (généralement en haut du composant):
```jsx
<div className="logo-akig">
    <div className="logo-akig-symbol">A</div>
    <div className="logo-akig-text">
        <span>AKIG</span>
        <span>Premium</span>
    </div>
</div>
```

### Remplacer par:
```jsx
<div className="logo-akig">
    <img 
        src="/assets/logos/my-logo.png" 
        alt="Logo AKIG" 
        className="logo-akig-image"
    />
    <div className="logo-akig-text">
        <span>AKIG</span>
        <span>Premium</span>
    </div>
</div>
```

### Ajouter le CSS dans `index.css`:
```css
/* Ajouter après la section .logo-akig existante */

.logo-akig-image {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-md);
    object-fit: contain;
    box-shadow: 0 10px 25px rgba(15, 37, 87, 0.35);
}

@media (max-width: 768px) {
    .logo-akig-image {
        width: 40px;
        height: 40px;
    }
}
```

---

## 🎨 ÉTAPE 5: Intégrer le logo - NAVBAR (Barre de navigation)

### Localiser le fichier
```
c:\AKIG\frontend\src\components\Navbar.jsx
```

### Chercher la section du logo navbar:
```jsx
<div className="flex items-center gap-2">
    <span className="text-xl font-bold">AKIG</span>
</div>
```

### Remplacer par:
```jsx
<div className="flex items-center gap-2">
    <img 
        src="/assets/logos/my-logo.png" 
        alt="Logo" 
        className="h-8 w-8 object-contain"
    />
    <span className="text-xl font-bold">AKIG</span>
</div>
```

---

## 🎨 ÉTAPE 6: Ajouter un Favicon

### Préparer votre favicon
```
Format: PNG 32x32 ou PNG 64x64
Emplacement: c:\AKIG\frontend\public\favicon.png
```

### Localiser le fichier HTML
```
c:\AKIG\frontend\public\index.html
```

### Chercher la section HEAD:
```html
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
```

### Ajouter après les meta tags:
```html
<link rel="icon" type="image/png" href="/favicon.png" />
<link rel="shortcut icon" href="/favicon.png" />
<link rel="apple-touch-icon" href="/favicon.png" />
```

---

## 📊 ÉTAPE 7: Personnaliser l'apparence du logo

### Styles de logo disponibles:

**Logo avec ombre légère:**
```jsx
<img src="/assets/logos/my-logo.png" className="drop-shadow-lg" />
```

**Logo avec bordure:**
```jsx
<img src="/assets/logos/my-logo.png" className="border-2 border-white rounded-lg" />
```

**Logo avec effet de glow:**
```jsx
<img 
    src="/assets/logos/my-logo.png" 
    className="drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
/>
```

**Logo avec background:**
```jsx
<div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2">
    <img src="/assets/logos/my-logo.png" className="w-full h-full object-contain" />
</div>
```

---

## 🔧 ÉTAPE 8: Tests et vérification

### Après avoir fait les modifications:

1. **Redémarrer le serveur frontend:**
```powershell
cd c:\AKIG\frontend
npm start
```

2. **Vérifier les emplacements:**
   - ✅ Page de connexion: `http://localhost:3000/login`
   - ✅ Dashboard: `http://localhost:3000/dashboard` (après connexion)
   - ✅ Favicon: Icône dans l'onglet du navigateur

3. **Corriger les erreurs 404:**
   - Si le logo n'apparaît pas, vérifier:
     - Chemin du fichier correct
     - Nom du fichier sans espace
     - Fichier réellement présent dans `public\assets\logos\`

---

## 📝 FICHIERS À MODIFIER - RÉSUMÉ

| Fichier | Modification | Priorité |
|---------|-------------|----------|
| `Login.jsx` | Remplacer le "A" par le logo | 🔴 HAUTE |
| `Navbar.jsx` | Ajouter logo à la barre de nav | 🟡 MOYENNE |
| `index.html` | Ajouter favicon | 🟢 BASSE |
| `index.css` | Ajouter `.logo-akig-image` style | 🟡 MOYENNE |

---

## 🎯 CONFIGURATION RECOMMANDÉE

**Meilleure combinaison:**

1. Logo 512x512 PNG avec transparence
2. Favicon 64x64 PNG
3. Utiliser Option 1 (Logo carré standard) pour la page de connexion
4. Utiliser l'image logo dans Navbar avec texte AKIG

**Résultat: Logo professionnel et unifié partout** ✨

---

## ❓ DÉPANNAGE

### Le logo n'apparaît pas?
```
✓ Vérifier le chemin: /assets/logos/my-logo.png
✓ Le fichier existe-t-il? Oui/Non
✓ Redémarrer npm: npm start
✓ Vider le cache: Ctrl+Shift+R (navigateur)
```

### Le logo est déformé?
```
✓ Ajouter: object-fit: contain;
✓ Spécifier les dimensions: w-14 h-14
✓ Utiliser un logo carré 1:1
```

### Le logo est trop petit/gros?
```
✓ Modifier les classes Tailwind:
  - w-8 (petit)
  - w-14 (moyen)
  - w-24 (grand)
```

---

## 📞 SUPPORT

Pour plus d'informations sur le redimensionnement des images:
- Utiliser un logiciel gratuit: **GIMP**, **Paint.NET**, ou **Photopea**
- Format optimal: **PNG transparence** ou **SVG vectoriel**

**Vos modifications sont maintenant actives! 🚀**

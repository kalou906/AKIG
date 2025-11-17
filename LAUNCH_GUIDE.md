# 🎯 AKIG - Guide de Lancement Rapide

## 📋 Fichiers de Lancement Disponibles

| Fichier | Type | Usage | Niveau |
|---------|------|-------|--------|
| **QUICK_LAUNCH.bat** | Batch | Double-clic 🖱️ | 🟢 Débutant |
| **LAUNCH_AKIG_SIMPLE.bat** | Batch | Double-clic 🖱️ | 🟢 Débutant |
| **LAUNCH_AKIG.ps1** | PowerShell | `.\LAUNCH_AKIG.ps1` | 🟡 Intermédiaire |
| **LAUNCH_AKIG.sh** | Shell | `./LAUNCH_AKIG.sh` | 🟡 Linux/Mac |
| **VERIFY_SYSTEM.bat** | Batch | Double-clic 🖱️ | 🟢 Diagnostic |

---

## 🚀 Trois Façons de Lancer AKIG

### Option 1️⃣ : Le Plus Simple (Windows)
```
Double-clic sur QUICK_LAUNCH.bat
```
**Avantages :**
- ✅ Aucune connaissance requise
- ✅ Interface claire et colorée
- ✅ Affiche l'URL d'accès automatiquement
- ✅ Installe les dépendances automatiquement

**Résultat :** Deux fenêtres s'ouvrent (Backend & Frontend)

---

### Option 2️⃣ : Alternative Simple (Windows)
```
Double-clic sur LAUNCH_AKIG_SIMPLE.bat
```
**Similaire à l'option 1 mais légèrement différent**

---

### Option 3️⃣ : PowerShell Avancé (Windows)
```powershell
# Dans PowerShell (Win+X puis PowerShell)
cd C:\AKIG
.\LAUNCH_AKIG.ps1
```
**Avantages :**
- ✅ Plus de détails et logs
- ✅ Listing complet des modules
- ✅ Meilleur contrôle des erreurs
- ✅ Sortie colorée et détaillée

---

### Option 4️⃣ : Linux / Mac
```bash
chmod +x LAUNCH_AKIG.sh
./LAUNCH_AKIG.sh
```

---

## 🔍 Avant de Lancer

### Vérifier que tout est prêt
```
Double-clic sur VERIFY_SYSTEM.bat
```

Cela vérifie :
- ✓ Node.js installé
- ✓ npm disponible
- ✓ Répertoires backend/ et akig-ultimate/ présents
- ✓ Fichiers package.json présents
- ✓ Ports disponibles

---

## 📱 Après le Lancement

### Accédez à AKIG

**URL Principale:**
```
http://localhost:5173
```

**Endpoints API:**
- Health Check: `http://localhost:4000/api/health`
- Info Système: `http://localhost:4000/api/info`
- API Routes: `http://localhost:4000/api/*`

---

## 🎨 Modules Visibles

Une fois lancé, vous verrez 8 modules cliquables :

```
┌─────────────────────────────────────────────────────┐
│  1. Gestion Immobilière                             │
│  2. Recouvrement & Paiements                        │
│  3. Opérations & Maintenance                        │
│  4. Reporting & Analytics                           │
│  5. Portails Client                                 │
│  6. Administration (+ Gestion des Rôles)           │
│  7. IA & Recherche Avancée                         │
│  8. Cartographie & Géolocalisation                 │
└─────────────────────────────────────────────────────┘
```

### Gestion des Rôles
Cliquez sur **Paramètres** → **Gestion des Rôles** pour :
- Voir tous les utilisateurs
- Assigner des rôles
- Gérer les permissions
- Visualiser les accès

---

## ⚙️ Configuration

**Backend (.env) - Prédéfini :**
```
PORT=4000
DATABASE_URL=postgres://localhost/akig
JWT_SECRET=supersecret
DISABLE_REDIS=true
```

**Frontend (.env) - Prédéfini :**
```
VITE_API_URL=http://localhost:4000
VITE_API_PROXY=http://localhost:4000
```

---

## 📊 Infos Techniques

### Backend
- **Framework:** Express.js 4.18
- **Runtime:** Node.js 22
- **Database:** PostgreSQL (fallback: Mock)
- **Auth:** JWT
- **Endpoints:** 136+

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 7.1
- **Styling:** Tailwind CSS 3.4
- **Pages:** 13
- **Components:** 50+

---

## 🛑 Arrêter AKIG

**Option 1 :** Fermez les deux fenêtres de commande

**Option 2 (PowerShell) :** Ctrl+C dans chaque fenêtre

**Option 3 (Windows) :**
```powershell
taskkill /F /IM node.exe
```

---

## ❌ Troubleshooting

### ❌ "Node.js not found"
**Solution :** Installez Node.js → https://nodejs.org

### ❌ Port 4000 ou 5173 en utilisation
**Solution :**
```powershell
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### ❌ npm install échoue
**Solution :**
```bash
cd backend
npm install
cd ../akig-ultimate
npm install
```

### ❌ CORS ou connexion API échouent
**Vérifiez que :**
- Backend s'exécute sur `http://localhost:4000`
- Frontend s'exécute sur `http://localhost:5173`
- Les deux fenêtres de commande sont ouvertes
- Votre pare-feu n'est pas bloquant

---

## 📝 Résumé Rapide

1. **Téléchargez Node.js** si ce n'est pas fait
2. **Double-clic sur QUICK_LAUNCH.bat**
3. **Attendez ~30s** (pour les dépendances)
4. **Ouvrez http://localhost:5173** dans votre navigateur
5. **Explorez les 8 modules**
6. **Testez la gestion des rôles**

---

## ✨ Vous êtes Prêt !

AKIG est totalement automatisé. Tout ce dont vous avez besoin est :
- ✅ Node.js installé
- ✅ Internet (première fois)
- ✅ Un double-clic

**Bienvenue sur AKIG ! 🚀**

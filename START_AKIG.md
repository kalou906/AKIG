# 🚀 AKIG - Gestion Immobilière Guinée

## ⚡ Démarrage Rapide (2 minutes)

### Windows
```powershell
# Dans PowerShell:
cd C:\AKIG
powershell -ExecutionPolicy Bypass -File LAUNCH.ps1
```

### Linux / Mac
```bash
# Dans le terminal:
cd ~/AKIG
bash LAUNCH.sh
```

## 📱 Accès Immédiat

Une fois lancé, accédez à:
- **🖥️ Interface Utilisateur**: http://localhost:5173
- **🔌 API Backend**: http://localhost:4002/api
- **📊 Dashboard**: http://localhost:5173/dashboard

## ✨ Fonctionnalités Principales

### 🏠 Gestion Immobilière
- **Propriétaires**: Créer et gérer les propriétaires
- **Propriétés**: Gérer les bâtiments et leurs unités
- **Locaux**: Ajouter appartements, bureaux, magasins
- **Contrats**: Créer contrats de location avec dépôts

### 💰 Gestion Financière
- **Paiements**: Enregistrer les loyers payés
- **Quittances**: Générer automatiquement des PDF
- **Arriérés**: Suivre les dettes et plans de paiement
- **Rapports**: Revenue, occupancy, performance

### 🔧 Maintenance
- **Demandes**: Créer demandes de maintenance
- **Appels d'Offre**: Gérer les devis des entrepreneurs
- **Suivi**: Tracker l'état des travaux

### 📊 Outils
- **Recherche**: Trouver rapidement propriétaires/contrats
- **Export**: Télécharger rapports Excel/CSV
- **Analytics**: Voir statistiques en temps réel
- **Tâches**: Créer reminders et suivi

## 🔑 Identifiants de Test

### Admin
- Email: `admin@akig.com`
- Password: `admin123`

### Owner
- Email: `owner@akig.com`
- Password: `owner123`

### Manager
- Email: `manager@akig.com`
- Password: `manager123`

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [COMPLETE_API_ENDPOINTS.md](./COMPLETE_API_ENDPOINTS.md) | 📖 Tous les endpoints API (50+) |
| [DEPLOYMENT_GUIDE_COMPLETE.md](./DEPLOYMENT_GUIDE_COMPLETE.md) | 🚀 Guide de déploiement complet |
| [PROPERTY_MANAGEMENT_SYSTEM_COMPLET.md](./PROPERTY_MANAGEMENT_SYSTEM_COMPLET.md) | 🏘️ Système immobilier détaillé |

## 🛠️ Commandes Utiles

```bash
# Vérifier l'état du système
node dashboard.js

# Backend uniquement
cd backend && npm run dev

# Frontend uniquement
cd frontend && npm run dev

# Tests
cd backend && npm test
cd frontend && npm run test

# Arrêter les services
# Windows: Fermer les terminaux PowerShell
# Linux/Mac: Ctrl+C

# Réinitialiser la base de données
psql -U akig_user -d akig_immobilier -f backend/db/migrations/001_create_property_management.sql
psql -U akig_user -d akig_immobilier -f backend/db/migrations/002_add_maintenance_and_advanced_features.sql
```

## 🎯 Premier Test - Créer une Propriété

### 1. Connexion
- Allez à http://localhost:5173
- Connectez-vous avec admin@akig.com / admin123

### 2. Créer un Propriétaire
1. Allez à `Propriétaires`
2. Cliquez `+ Nouveau Propriétaire`
3. Remplissez les infos:
   - Nom: "Jean Dupont"
   - Email: "jean@example.com"
   - Téléphone: "+224612345678"
   - Entreprise: "Dupont SARL"
4. Cliquez `Créer`

### 3. Créer une Propriété
1. Allez à `Propriétés`
2. Cliquez `+ Nouvelle Propriété`
3. Remplissez les infos:
   - Nom: "Immeuble A"
   - Adresse: "123 Rue Principale"
   - Ville: "Kinshasa"
   - Type: "Résidentiel"
   - Propriétaire: "Jean Dupont"
4. Cliquez `Créer`

### 4. Ajouter un Local
1. Cliquez sur la propriété créée
2. Cliquez `+ Ajouter Local`
3. Remplissez:
   - Numéro: "A-101"
   - Type: "Appartement"
   - Loyer: "250000"
   - Dépôt: "500000"
4. Cliquez `Créer`

### 5. Créer un Contrat de Location
1. Allez à `Contrats`
2. Cliquez `+ Nouveau Contrat`
3. Sélectionnez:
   - Local: "A-101"
   - Locataire: Créez-en un ou choisissez existant
   - Date début: Aujourd'hui
   - Date fin: +1 an
4. Cliquez `Créer`

### 6. Enregistrer un Paiement
1. Allez à `Paiements`
2. Cliquez `+ Nouveau Paiement`
3. Remplissez:
   - Contrat: Celui créé
   - Montant: "250000"
   - Date: Aujourd'hui
   - Méthode: "Virement bancaire"
4. Cliquez `Enregistrer`
5. **Une quittance PDF s'auto-génère !**

### 7. Voir les Rapports
- Allez à `Analytics`
- Voyez: Revenue du mois, Taux occupation, Performance paiements

## 🐛 Dépannage

### Le frontend ne démarre pas
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Le backend ne se connecte pas à la DB
```bash
# Vérifier PostgreSQL
psql -U akig_user -d akig_immobilier

# Vérifier .env
cat backend/.env | grep DATABASE_URL

# Réinitialiser les migrations
psql -U akig_user -d akig_immobilier < backend/db/migrations/001_create_property_management.sql
```

### Les ports 4002 ou 5173 sont déjà utilisés
```bash
# Windows: Chercher le processus
netstat -ano | findstr :4002

# Linux/Mac: Chercher le processus
lsof -i :4002

# Tuer le processus
# Windows: taskkill /PID [PID] /F
# Linux: kill -9 [PID]
```

## 📞 Support

Pour toute question:
1. Vérifiez la documentation
2. Consultez les logs: `backend/logs/` et `frontend/logs/`
3. Testez manuellement les endpoints: 
   ```bash
   curl http://localhost:4002/api/health
   ```

## 🎉 C'est Prêt!

Votre système de gestion immobilière est maintenant **prêt à l'emploi** ! 

Profitez de:
- ✅ 50+ endpoints API
- ✅ Génération automatique de PDF
- ✅ Suivi financier complet
- ✅ Gestion de maintenance
- ✅ Rapports analytiques
- ✅ Interface moderne et réactive

**Bonne utilisation ! 🚀**

---

**Version**: 2.0.0  
**Dernière mise à jour**: 26 Octobre 2025  
**Créé pour**: Guinée 🇬🇳

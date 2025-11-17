# 🚀 GETTING STARTED - AKIG PWA

Guide rapide pour démarrer avec AKIG (5 minutes).

## 📋 Checklist Rapide

### **1️⃣ Clone & Install** (2 minutes)

```bash
# Clone le repo
git clone https://github.com/yourusername/akig.git
cd akig

# Install dépendances frontend
cd frontend
npm install
cd ..

# Install dépendances backend
cd backend
npm install
cd ..
```

### **2️⃣ Configuration** (2 minutes)

```bash
# Backend: Créer .env
cd backend
cp .env.example .env
# Éditer .env avec vos credentials PostgreSQL

# Frontend: Créer .env
cd ../frontend
cp .env.example .env
# Éditer .env avec votre API endpoint
```

### **3️⃣ Démarrage** (1 minute)

```bash
# Terminal 1: Backend (port 4000)
cd backend
npm run dev
# Output: Server running on http://localhost:4000

# Terminal 2: Frontend (port 3000)
cd frontend
npm start
# Output: Open http://localhost:3000
```

### **4️⃣ Vérification PWA**

```
Ouvrir http://localhost:3000
  → DevTools (F12)
    → Application tab
      → Service Workers
        → Status: "activated and running" ✅
```

---

## 🎯 Commandes Principales

```bash
# Frontend
cd frontend

# Development
npm start              # Dev server with hot reload

# Build
npm run build          # Production build
bash build-with-sw.sh # Build avec Service Worker

# Testing
npm test              # Unit tests
npm run cypress:open  # E2E tests

# Cleanup
npm run build:clean   # Clean build folder
```

```bash
# Backend
cd backend

# Development
npm run dev           # Start with nodemon

# Production
npm start            # Run compiled JS

# Testing
npm test             # Unit tests
```

---

## 📱 PWA Features

### **Tester Offline**

```
1. DevTools (F12)
2. Network tab
3. Throttling: "Offline"
4. Reload page
5. ✅ Fonctionne avec cache!
```

### **Tester Installation (Chrome)**

```
1. Ouvrir http://localhost:3000
2. Cliquer icon "Install" (adresse bar)
3. Confirmer "Install"
4. ✅ App sur home screen!
```

### **Vérifier Service Worker**

```
DevTools (F12)
  → Application
    → Service Workers
      → Voir status et cache
```

---

## 📚 Documentation

| Document | Contenu | Lire |
|----------|---------|------|
| **[README.md](./README.md)** | Overview complet | 10min |
| **[PWA_SETUP.md](./frontend/PWA_SETUP.md)** | Guide PWA détaillé | 15min |
| **[PWA_COMPLETION.md](./frontend/PWA_COMPLETION.md)** | Checklist + troubleshooting | 10min |
| **[INVENTORY.md](./INVENTORY.md)** | Inventaire fichiers | 5min |
| **[PWA_SESSION_SUMMARY.md](./PWA_SESSION_SUMMARY.md)** | Résumé session | 5min |

---

## 🚀 Déploiement Quick Start

### **Vercel (Recommandé - 2 minutes)**

```bash
# 1. Install CLI
npm install -g vercel

# 2. Deploy
vercel deploy

# 3. Done! HTTPS auto-enabled
```

### **Netlify (Alternative - 2 minutes)**

```bash
# 1. Install CLI
npm install -g netlify-cli

# 2. Deploy
netlify deploy --prod

# 3. Done!
```

### **Manual (Custom Server)**

```bash
# 1. Build
cd frontend
npm run build
# → Output: ./build/ folder

# 2. Deploy files
# Upload ./build/ to your server

# 3. Important: Configure HTTPS!
# Service Workers require HTTPS in production
```

---

## 🔍 Troubleshooting Rapide

### **"Service Worker not registered"**

```javascript
// Check console for errors
// DevTools > Application > Service Workers
// Status should show "activated and running"

// If not:
1. Check browser console for errors
2. Ensure HTTPS (or localhost)
3. Check DevTools > Network > sw.js loaded
```

### **"npm install fails"**

```bash
# Clear cache & retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### **"Port 3000 already in use"**

```bash
# Either:
# 1. Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# 2. Or start on different port
PORT=3001 npm start
```

### **"TypeScript errors"**

```bash
# Check compilation
npx tsc --noEmit

# If errors, see: PWA_COMPLETION.md > Troubleshooting
```

---

## 📊 Project Structure

```
akig/
├── frontend/              # React + PWA
│   ├── src/
│   │   ├── components/   # 15+ React components
│   │   ├── hooks/        # usePagedSearch, useToast
│   │   ├── lib/          # Utils, API client
│   │   ├── pages/        # Main pages
│   │   ├── styles/       # Design system
│   │   ├── sw.ts         # Service Worker ⭐
│   │   └── App.tsx       # Main app
│   ├── public/
│   │   ├── manifest.json # PWA config ⭐
│   │   └── icons/        # App icons
│   └── package.json
│
├── backend/               # Node.js API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── db.js         # PostgreSQL
│   │   └── index.js      # Express app
│   └── package.json
│
└── docs/                 # Documentation
    ├── PWA_SETUP.md
    ├── PWA_COMPLETION.md
    └── INVENTORY.md
```

---

## 💡 Tips & Tricks

### **Hot Reload**

Frontend already has hot reload (React Fast Refresh).

```bash
# Edit file
frontend/src/components/App.tsx

# → Browser auto-refreshes!
```

### **Debug Service Worker**

```javascript
// In sw.ts or browser console:
console.log('[SW] Event name');  // Prefixed for easy filtering

// DevTools > Console > Filter: "[SW]"
```

### **Clear Service Worker Cache**

```javascript
// In browser console:
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
  console.log('Cache cleared');
});

// Or: DevTools > Application > Cache Storage > Delete all
```

### **Test Different Network Speed**

```
DevTools > Network > Throttling
├── No throttling    (default)
├── Fast 3G
├── Slow 3G
├── Offline
└── Custom...
```

---

## 🔐 Security Notes

- ✅ Service Workers require HTTPS in production
- ✅ Environment variables stored safely (.env not committed)
- ✅ Passwords hashed with bcrypt
- ✅ API calls use JWT authentication
- ✅ CORS configured properly

**Never commit:**
- `.env` files with secrets
- `node_modules/`
- Build artifacts (`build/`, `dist/`)
- OS files (`.DS_Store`, `Thumbs.db`)

---

## 📞 Getting Help

1. **Check docs**: PWA_SETUP.md, PWA_COMPLETION.md
2. **Check console**: Browser console for errors
3. **Check DevTools**: Application tab for Service Worker status
4. **Google it**: Most issues have Stack Overflow answers
5. **Ask team**: Contact development team

---

## ✅ Development Workflow

```
1. Create feature branch
   git checkout -b feature/my-feature

2. Make changes
   Edit files in src/

3. Test locally
   npm start
   Check DevTools

4. Build for production
   npm run build

5. Deploy
   vercel deploy

6. Test on mobile
   Install from home screen
   Test offline functionality

7. Commit & Push
   git commit -m "Add my feature"
   git push origin feature/my-feature

8. Create Pull Request
```

---

## 🎉 What's Included

✅ **30+ React components** (fully typed)  
✅ **Service Worker** with offline support  
✅ **PWA Manifest** ready for installation  
✅ **Dark mode** support  
✅ **Accessible** (ARIA labels, keyboard nav)  
✅ **Charts** (Chart.js integration)  
✅ **Error tracking** (Sentry ready)  
✅ **Documentation** complete  

---

## 📈 Next Steps

- ✅ Get running locally (this guide)
- 📖 Read full documentation (PWA_SETUP.md)
- 🎨 Customize theme colors
- 📱 Test on mobile
- 🚀 Deploy to production
- 💬 Enable push notifications
- 📊 Setup analytics

---

**Welcome to AKIG! 🎉**

Questions? Check the docs or ask the team!

**Happy coding!** 💻

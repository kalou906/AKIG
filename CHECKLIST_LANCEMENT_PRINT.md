# ✅ CHECKLIST LANCEMENT - À IMPRIMER

**Système:** AKIG 98/100  
**Date:** 2025-11-02  
**Statut:** PRÊT À LANCER

---

## 🚀 DÉMARRAGE (5 MIN)

### Avant de Commencer
- [ ] PostgreSQL en cours d'exécution (port 5432)
- [ ] Ports 3000 et 4000 libres (vérifier: `netstat -ano`)
- [ ] Node.js + npm installés

### Terminal 1 - Backend
```bash
cd backend
npm start
```
- [ ] Aucune erreur
- [ ] "Listening on port 4000"
- [ ] Migrations OK

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```
- [ ] Aucune erreur
- [ ] "Ready in XX ms"
- [ ] URL: http://localhost:3000

### Terminal 3 - Navigateur
```
http://localhost:3000
```
- [ ] App charge
- [ ] Aucun écran blanc
- [ ] Aucune erreur rouge en console (F12)

---

## 🔍 VÉRIFICATIONS RAPIDES

### Backend Health
```bash
curl http://localhost:4000/api/health
```
- [ ] Status: 200
- [ ] Response: `{"status":"ok",...}`

### Frontend Loads
```
http://localhost:3000
F12 (DevTools)
```
- [ ] Console: No red errors
- [ ] HTML: `<div id="root"></div>` present
- [ ] Scripts: All loading

### Database Connected
```bash
# From backend logs, should see:
# ✓ PostgreSQL connected
# ✓ Migrations applied
```
- [ ] Database: Connected ✓
- [ ] Migrations: Up-to-date ✓

---

## 🧪 TEST BASIC

### Login Test
- [ ] Frontend loaded
- [ ] Try login (if form visible)
- [ ] OR check browser network tab
- [ ] API calls should proxy to :4000

### API Test
```bash
# Test direct backend call
curl -X GET http://localhost:4000/api/health
```
- [ ] Backend responds
- [ ] Status 200
- [ ] JSON response

### Proxy Test
- [ ] From frontend, make API call
- [ ] Check Network tab (F12)
- [ ] Call should go to :4000
- [ ] setupProxy working

---

## ⚠️ TROUBLESHOOTING

### Frontend Blanc?
- [ ] Check console for errors (F12)
- [ ] Clear cache: Ctrl+Shift+Delete
- [ ] Restart: `npm start`
- [ ] Check: `<div id="root"></div>` exists

### Backend 500 Error?
- [ ] Check logs: `tail -f backend/logs/app.log`
- [ ] Vérifier DATABASE_URL in .env
- [ ] Restart: `npm start`

### Port Already in Use?
- [ ] Find: `netstat -ano | findstr :3000`
- [ ] Kill: `taskkill /PID <PID> /F`
- [ ] Restart: `npm start`

### No Database Connection?
- [ ] PostgreSQL running? Check port 5432
- [ ] `.env` file has DATABASE_URL?
- [ ] Password correct?
- [ ] Database exists?

---

## 📊 EXPECTED OUTPUT

### Backend Should Show:
```
✓ PostgreSQL connected
✓ Database migrations updated
✓ Express listening on port 4000
✓ Security headers enabled
✓ Rate limiting initialized
```

### Frontend Should Show:
```
VITE v4.x.x dev server ready in XXX ms

Local:   http://localhost:3000/
press h to show help
```

### Browser Console Should Show:
```
No red errors
No warnings about React
Only info messages
Network tab shows API calls going to :4000
```

---

## 🎯 READY TO USE?

**Checklist:**
- [ ] Backend started without errors
- [ ] Frontend started without errors
- [ ] Browser shows app (not blank)
- [ ] Console has no red errors
- [ ] Health check returns 200
- [ ] No DB connection errors

**If All Checked:**
✅ **SYSTEM IS READY!**

**If Any Failed:**
❌ Check troubleshooting section above

---

## 📞 WHAT TO DO NEXT

1. **Explore the UI** - Navigate through pages
2. **Check Console** - Look for any errors
3. **Test Login** - If available in UI
4. **Monitor Network** - Check API calls
5. **Check Logs** - Look for warnings

---

## 🎊 IMPORTANT FILES

If something breaks, check these:
- `backend/.env` - Database connection
- `frontend/src/setupProxy.js` - API proxy config
- `frontend/public/index.html` - Should have `<div id="root"></div>`
- Backend logs: `backend/logs/app.log`
- Frontend console: Browser DevTools (F12)

---

## 🚨 EMERGENCY

**Everything broken?**
1. Kill both processes (Ctrl+C)
2. Check: `npm -v` and `node -v`
3. Reinstall deps: `rm -r node_modules`, then `npm install`
4. Restart: `npm start`

**Still broken?**
1. Check `.env` files
2. Check PostgreSQL running
3. Check ports 3000, 4000 free
4. Read error messages carefully!

---

## ✅ SUCCESS CRITERIA

✅ All items checked  
✅ App displays in browser  
✅ Console no red errors  
✅ Health endpoint responds  

**Then:** SYSTEM IS WORKING! 🎉

---

**Print this and keep it handy!**

*Last Updated: 2025-11-02*  
*System Score: 98/100*  
*Status: ✅ READY*

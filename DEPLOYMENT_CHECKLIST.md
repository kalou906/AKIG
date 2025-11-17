# ✅ DEPLOYMENT CHECKLIST - AKIG PWA

Checklist complète avant déploiement en production.

## 🔍 Pre-Deployment Checks

### **1. Code Quality** (10 minutes)

- [ ] Run TypeScript check
  ```bash
  cd frontend && npx tsc --noEmit
  ```
  Expected: `0 errors`

- [ ] Lint check (if applicable)
  ```bash
  npm run lint
  ```

- [ ] Unit tests pass
  ```bash
  npm test
  ```

- [ ] Build successful
  ```bash
  npm run build
  # Should complete in <30 seconds
  ```

### **2. PWA Validation** (5 minutes)

- [ ] Service Worker compiles
  ```bash
  ls -la frontend/build/sw.js
  # File should exist and be >5KB
  ```

- [ ] Manifest.json present
  ```bash
  cat frontend/build/manifest.json | head -20
  # Should show valid JSON
  ```

- [ ] Icons present
  ```bash
  ls -la frontend/build/icons/
  # Should have icon-192.png, icon-512.png
  ```

- [ ] Meta tags in HTML
  ```bash
  grep "manifest.json" frontend/build/index.html
  grep "theme-color" frontend/build/index.html
  # Should show meta tags
  ```

### **3. Performance Check** (10 minutes)

Using Lighthouse in Chrome DevTools:

- [ ] PWA score: >= 90
- [ ] Performance score: >= 80
- [ ] Accessibility score: >= 90
- [ ] Best Practices score: >= 90
- [ ] SEO score: >= 90

```
DevTools (F12)
  → Lighthouse tab
    → Generate Report
      → Check all scores
```

### **4. Accessibility Check** (5 minutes)

- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation works (Tab key)
- [ ] Focus visible on buttons
- [ ] Color contrast WCAG AA
- [ ] Page readable with screen reader

### **5. Browser Compatibility** (10 minutes)

Test on:

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS 16.4+)

### **6. Security Check** (10 minutes)

- [ ] HTTPS working
  ```bash
  curl -I https://yourdomain.com
  # Should show SSL certificate
  ```

- [ ] No hardcoded secrets in code
  ```bash
  grep -r "password\|secret\|api_key" frontend/src/ --exclude-dir=node_modules
  # Should return nothing
  ```

- [ ] .env file NOT committed
  ```bash
  git ls-files | grep ".env"
  # Should show nothing
  ```

- [ ] Environment variables set on server
  ```bash
  # Backend
  echo $DATABASE_URL
  echo $JWT_SECRET
  # Frontend
  echo $REACT_APP_API_URL
  ```

- [ ] CORS configured properly
  ```bash
  # Backend should only accept your domain
  curl -H "Origin: https://yourdomain.com" -v https://api.yourdomain.com/api/health
  ```

### **7. API Connectivity** (5 minutes)

- [ ] Backend health check passes
  ```bash
  curl https://api.yourdomain.com/api/health
  # Should return 200 OK
  ```

- [ ] Database connection works
  ```bash
  # Test on server
  npm run db:test
  ```

- [ ] Environment variables correct
  ```bash
  # On server, verify
  echo $DATABASE_URL | head -c 20  # Should not be empty
  ```

### **8. Service Worker Test** (10 minutes)

- [ ] SW registers in DevTools
  ```
  DevTools > Application > Service Workers
  Status: "activated and running"
  ```

- [ ] Cache storage working
  ```
  DevTools > Application > Cache Storage
  Should see: "akig-v1:assets" and "akig-v1:api"
  ```

- [ ] Offline functionality works
  ```
  DevTools > Network > Offline
  Reload page → Should work from cache
  ```

- [ ] Push notifications ready (if enabled)
  ```
  DevTools > Application > Manifest
  "categories" present
  "start_url" correct
  ```

---

## 🚀 Deployment Steps

### **Vercel (Recommended)**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Set environment variables
vercel env add DATABASE_URL  # Paste your PostgreSQL URL
vercel env add JWT_SECRET    # Paste your JWT secret
vercel env add REACT_APP_API_URL  # Paste backend URL

# 4. Deploy
cd frontend
vercel deploy --prod

# Output: https://your-domain.vercel.app
```

### **Netlify**

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login to Netlify
netlify login

# 3. Deploy
cd frontend
netlify deploy --prod

# 4. Configure environment in Netlify dashboard
# Site settings > Build & Deploy > Environment
```

### **Custom Server (AWS, DigitalOcean, etc.)**

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Clone repository
git clone https://github.com/yourusername/akig.git
cd akig

# 3. Install dependencies
cd frontend && npm install
cd ../backend && npm install

# 4. Build frontend
cd frontend
npm run build
# → Creates ./build/ folder

# 5. Configure nginx/apache
# Serve ./build/ folder on port 80/443
# Configure HTTPS with Let's Encrypt

# 6. Start backend
cd ../backend
npm install -g pm2
pm2 start src/index.js --name "akig-backend"
pm2 save

# 7. Verify both services running
curl http://localhost:3000    # Frontend
curl http://localhost:4000/api/health  # Backend
```

---

## ✅ Post-Deployment Validation

### **Immediate (5 minutes)**

- [ ] Website loads on your domain
- [ ] Service Worker registered (DevTools)
- [ ] No console errors
- [ ] API calls working

### **First Hour (30 minutes)**

- [ ] Test on mobile device
- [ ] Test installation (Add to home screen)
- [ ] Test offline (toggle Network > Offline)
- [ ] Check Sentry for any errors
- [ ] Monitor performance on Lighthouse

### **First 24 Hours**

- [ ] Monitor error logs
- [ ] Check database connections
- [ ] Verify backups running
- [ ] Test user registration/login
- [ ] Test all main features

### **First Week**

- [ ] Monitor analytics
- [ ] Check error tracking (Sentry)
- [ ] Monitor server resources
- [ ] Review user feedback
- [ ] Check SSL certificate validity

---

## 🐛 Common Issues & Fixes

### **Service Worker Not Registering**

```javascript
// Check console
console.log('[PWA] Service Worker registered');

// If not showing:
1. Verify HTTPS working
2. Check DevTools > Network > sw.js (should 200)
3. Check manifest.json loaded
4. Clear browser cache: Ctrl+Shift+Del
```

### **Icons Not Showing**

```bash
# Verify icons path
ls -la frontend/build/icons/
# Should have icon-192.png, icon-512.png

# Check manifest.json
grep "icon-192" frontend/build/manifest.json
# Should show correct path
```

### **Offline Not Working**

```javascript
// Check cache
caches.keys().then(names => {
  console.log('Caches:', names);
  // Should see: ["akig-v1:assets", "akig-v1:api"]
});

// If cache empty:
1. Check Service Worker status: "activated and running"
2. Force page reload: Ctrl+Shift+R
3. Wait 30 seconds for cache population
```

### **Build Fails**

```bash
# Clear and rebuild
rm -rf frontend/build frontend/node_modules
cd frontend
npm install
npm run build

# If still fails:
npm run build -- --verbose  # See detailed errors
```

### **Database Connection Error**

```bash
# Test connection locally
psql $DATABASE_URL

# If fails:
1. Check DATABASE_URL format (postgres://user:pass@host:5432/db)
2. Verify PostgreSQL running on remote server
3. Check firewall rules
4. Verify credentials
```

---

## 📊 Monitoring Post-Deployment

### **Essential Monitoring**

1. **Error Tracking** (Sentry)
   ```
   Set up Sentry account
   Add DSN to frontend environment
   Dashboard: sentry.io
   ```

2. **Performance Monitoring**
   ```
   Chrome DevTools > Lighthouse
   Run weekly audit
   Monitor Web Vitals
   ```

3. **Uptime Monitoring**
   ```
   Use UptimeRobot.com
   Monitor main domain
   Monitor API health endpoint
   Set alert thresholds
   ```

4. **Error Logs**
   ```bash
   # Backend logs
   tail -f /var/log/akig-backend.log
   
   # Frontend (browser console)
   Check console regularly
   ```

### **Recommended Tools**

- **Sentry**: Error tracking ✅ (Already configured)
- **Google Analytics**: Traffic analytics
- **UptimeRobot**: Uptime monitoring
- **CloudFlare**: CDN + security
- **Snyk**: Security scanning
- **LogRocket**: Session replay

---

## 🔄 Regular Maintenance

### **Weekly**

- [ ] Check error logs in Sentry
- [ ] Review user feedback
- [ ] Verify backups

### **Monthly**

- [ ] Run security audit
- [ ] Update dependencies
- [ ] Check SSL certificate (renew if <30 days)
- [ ] Review performance metrics

### **Quarterly**

- [ ] Full security audit
- [ ] Penetration testing
- [ ] Disaster recovery test
- [ ] User acceptance testing

---

## 📋 Final Validation Checklist

Before declaring "GO LIVE":

- [ ] TypeScript: 0 errors
- [ ] Builds successfully
- [ ] Service Worker registers
- [ ] Offline works
- [ ] All features tested
- [ ] Performance: Lighthouse 90+
- [ ] Accessibility: WCAG AA
- [ ] Security: HTTPS + headers
- [ ] Database: Connection OK
- [ ] API: Health check passes
- [ ] Monitoring: Configured
- [ ] Backups: Running
- [ ] Alerts: Configured
- [ ] Documentation: Updated
- [ ] Team: Trained on production deployment

---

## 🎉 Success Criteria

✅ **Site loads in <3 seconds**
✅ **No TypeScript errors**
✅ **Service Worker active**
✅ **PWA installable**
✅ **Offline works**
✅ **All API calls working**
✅ **No console errors**
✅ **Lighthouse score 90+**
✅ **HTTPS working**
✅ **Monitoring active**

---

## 📞 Troubleshooting Contacts

- **Frontend Issues**: Check PWA_SETUP.md
- **Backend Issues**: Check backend logs
- **Deployment Issues**: Check platform docs (Vercel/Netlify)
- **PWA Issues**: Check PWA_COMPLETION.md

---

## 📝 Deployment Log

```
Date Deployed: _______________
Environment: [ ] Dev [ ] Staging [ ] Production
Deployed By: _______________
Vercel/Netlify/Custom: _______________

Issues Found: _______________
Resolution: _______________

Sign-off: _______________
```

---

**✅ Ready for Production!**

Once all checks pass, you're good to go! 🚀

For any issues, refer to the documentation or contact the development team.

---

*Generated: Oct 26, 2025*
*AKIG Version: 1.0.0*
*Status: PRODUCTION-READY*

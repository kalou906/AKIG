# 🚀 Developer Onboarding Guide - AKIG

> Welcome to the team! Get productive in 2 days instead of 2 weeks.

## Day 1: Setup & Understanding

### Morning (1 hour)
1. **Clone repositories**
   ```bash
   git clone https://github.com/akig/frontend
   git clone https://github.com/akig/backend
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Read documentation** (30 min)
   - [ ] `START_HERE.md` (5 min)
   - [ ] `GUIDE_COMPLET.md` (15 min)
   - [ ] `QUICK_REF.md` (5 min)
   - [ ] `docs/adr/` - Architecture decisions (5 min)

3. **Run setup script**
   ```bash
   ./health-check.ps1  # Windows
   # or
   ./health-check.sh   # Mac/Linux
   ```

### Late Morning (1.5 hours)
4. **Database setup**
   ```bash
   cd backend
   npm run migrations:run  # Run migrations
   npm run seed           # Seed test data
   ```

5. **Start services**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm start
   
   # Terminal 3: Watch Redis (optional)
   docker exec akig-redis redis-cli
   ```

### Afternoon (2 hours)
6. **Explore the codebase**
   - [ ] Backend structure: `backend/src/` (30 min)
   - [ ] Frontend structure: `frontend/src/` (30 min)
   - [ ] Database schema: `backend/db/migrations/` (30 min)
   - [ ] API endpoints: Open Swagger at http://localhost:4000/api-docs (30 min)

7. **Ask questions!**
   - Join #dev-questions Slack channel
   - Schedule 15-min intro chat with tech lead

### Evening (1 hour)
8. **First commit**
   - [ ] Create feature branch: `git checkout -b onboarding/your-name`
   - [ ] Make small change (e.g., fix typo in README)
   - [ ] Create pull request
   - [ ] Get code review

---

## Day 2: First Feature

### Morning (2 hours)
1. **Choose starter task**
   - Look for issues tagged `good-first-issue` or `help-wanted`
   - Ask tech lead for suggestion
   - Something small (< 4 hours)

2. **Understand the feature**
   - [ ] Read requirements
   - [ ] Check existing code for similar patterns
   - [ ] Ask questions in PR comments

3. **Development environment check**
   ```bash
   npm run dev    # Backend should be running
   npm start      # Frontend should be running
   
   # Test API directly
   curl http://localhost:4000/api/health
   ```

### Midday (3 hours)
4. **Implement feature**
   - Follow existing code patterns
   - Don't over-engineer
   - Write tests as you go
   - Commit frequently with good messages

5. **Run tests before committing**
   ```bash
   npm test                    # Run tests
   npm run test:watch         # Watch mode
   npm run lint               # Check style
   ```

### Afternoon (1.5 hours)
6. **Create pull request**
   - [ ] Write clear description
   - [ ] Reference related issues
   - [ ] Run CI/CD checks (should pass)
   - [ ] Request code review

7. **Respond to feedback**
   - Be open to suggestions
   - Ask clarifying questions
   - Iterate quickly

8. **Merge and deploy**
   - Celebrate first contribution! 🎉
   - Monitor production (help with rollout)

---

## 📚 Essential Documentation

### Read in Order
1. **Quick Start** (5 min)
   - `START_HERE.md` - Overview
   - `QUICK_REF.md` - Command reference

2. **Architecture** (30 min)
   - `docs/adr/` - Why decisions were made
   - `GUIDE_COMPLET.md` - Complete guide

3. **Specific Areas** (as needed)
   - `docs/API.md` - API documentation
   - `docs/DATABASE.md` - Schema & migrations
   - `docs/SECURITY.md` - Security practices
   - `docs/TESTING.md` - Testing guide

### Code Organization
```
backend/
  src/
    routes/          # API endpoints
    services/        # Business logic
    middleware/      # Express middleware
    utils/           # Helpers
    db.js            # Database connection
    index.js         # Entry point
  db/
    migrations/      # Database schema
    seeds/           # Test data

frontend/
  src/
    pages/           # Route pages
    components/      # React components
    store/           # State management (Zustand)
    utils/           # Helpers
    api/             # API client
    hooks/           # Custom React hooks
```

---

## 🛠️ Common Commands

```bash
# Backend
npm run dev              # Start dev server with hot reload
npm run build           # Build for production
npm test                # Run tests
npm run lint            # Check code style
npm run migrations:run  # Run database migrations
npm run migrations:undo # Undo last migration

# Frontend
npm start               # Start dev server
npm build              # Build production bundle
npm test               # Run tests
npm run lint           # Check code style

# Database
npm run db:setup       # Initialize database
npm run db:seed        # Add test data
npm run db:backup      # Backup database

# Docker
docker-compose up      # Start all services
docker-compose down    # Stop all services
docker-compose logs backend  # View logs
```

---

## 🐛 Debugging Tips

### Backend Debugging
```javascript
// Add console logs with context
logger.info('Processing payment', { paymentId, userId, amount });

// Debug specific request
// Use breakpoint in VS Code debugger config
// Or use node --inspect
node --inspect src/index.js

// Check database queries
// Enable PostgreSQL logging
// SELECT query, mean_time, calls FROM pg_stat_statements...
```

### Frontend Debugging
```javascript
// React DevTools browser extension
// Check browser console for errors
// Use VS Code debugger: F5 or add breakpoint
// Check Network tab for API responses
```

### API Testing
```bash
# Use provided test script
./test-api.ps1

# Or curl
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/contracts

# Or Postman/Insomnia
# Import from docs/postman-collection.json
```

---

## 💡 Code Style & Patterns

### Backend (Node.js/Express)
```javascript
// ✅ DO
async function getContracts(req, res, next) {
  try {
    const contracts = await contractService.getAll(req.user.tenantId);
    res.json({ success: true, data: contracts });
  } catch (error) {
    logger.error('Get contracts error', error);
    next(error);
  }
}

// ❌ DON'T
function getContracts(req, res) {
  db.query('SELECT...', (err, data) => {
    res.json(data);  // No error handling!
  });
}
```

### Frontend (React/TypeScript)
```typescript
// ✅ DO - Functional component with hooks
function ContractList() {
  const { contracts } = useContractsStore();
  const { isLoading } = useUIStore();
  
  return (
    <div>
      {isLoading && <Spinner />}
      {contracts.map(c => <ContractCard key={c.id} contract={c} />)}
    </div>
  );
}

// ❌ DON'T - Class component
class ContractList extends React.Component {
  state = { contracts: [] }
  componentDidMount() { ... }
  // Too much boilerplate
}
```

---

## 🚦 Testing Strategy

### Backend
- Unit tests for services
- Integration tests for routes
- Run: `npm test`

### Frontend
- Component tests with React Testing Library
- E2E tests with Playwright
- Run: `npm test`, `npm run test:e2e`

### Before committing
```bash
npm test && npm run lint  # Must pass!
```

---

## 🔐 Security Practices

✅ **DO**
- Always validate user input
- Check permissions in routes
- Use parameterized queries
- Hash passwords with bcryptjs
- Store secrets in .env files
- Log security events

❌ **DON'T**
- Commit secrets to git
- Trust client-side validation alone
- Log sensitive data (passwords, tokens)
- Skip permission checks
- Use deprecated libraries

---

## 🎓 Learning Resources

### Internal
- [ ] Slack: `#dev-questions` - Ask anything
- [ ] Wiki: Internal documentation
- [ ] Pairing: Schedule with experienced dev
- [ ] Office hours: Tuesday 10am with tech lead

### External
- [Express.js Guide](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [REST API Best Practices](https://restfulapi.net/)

---

## 📊 Your First Week Goals

### By End of Day 1
- ✅ Environment setup (dev server running)
- ✅ Understand folder structure
- ✅ First code change committed

### By End of Day 2
- ✅ Complete one small task
- ✅ First pull request merged
- ✅ Know who to ask questions

### By End of Week 1
- ✅ Comfortable with codebase
- ✅ Deploy to staging
- ✅ Review teammate's code
- ✅ Contribute to docs

### By End of Month
- ✅ Lead entire feature from start to production
- ✅ Help onboard next developer
- ✅ Identify improvements/technical debt
- ✅ Feel part of the team!

---

## 🆘 Getting Help

### Immediate Help
- Slack: `@on-call` or team channel
- Code review comments
- Pair programming session

### Stuck on Error?
1. Read error message carefully
2. Search codebase for similar error
3. Check logs: `kubectl logs`, browser console
4. Google the error
5. Ask on Slack with:
   - What you tried
   - Error message
   - What you expected

### Common Issues
| Issue | Solution |
|-------|----------|
| "Port 4000 in use" | `lsof -i :4000` then kill process |
| "Cannot find module" | Delete node_modules, run `npm install` |
| "Database connection error" | Check DATABASE_URL in .env |
| "Tests failing" | Clear cache: `npm test -- --clearCache` |

---

## 🎉 Welcome!

You're now part of the team. Don't hesitate to ask questions - we want you to succeed!

Questions? Email: dev-team@akig.app  
Office Hours: Tuesday 10am (Zoom link in calendar)

**Happy coding!** 🚀

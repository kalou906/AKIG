# Contributing to AKIG v3.0

First off, thank you for considering contributing to AKIG! 🎉

This document provides guidelines for contributing to the AKIG v3.0 project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## 🤝 Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow:

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Focus on what is best** for the community
- **Show empathy** towards other community members

---

## 🚀 Getting Started

### Prerequisites

Ensure you have installed:
- Node.js 22.11.0+
- pnpm 9.14.2+
- Docker 27.3+
- Python 3.13+ (for ML service)
- Git

### Fork & Clone

```bash
# Fork repository on GitHub first

# Clone your fork
git clone https://github.com/YOUR_USERNAME/akig-v3.git
cd akig-v3

# Add upstream remote
git remote add upstream https://github.com/akig-corp/akig-v3.git
```

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your local configuration

# Start development environment
docker compose up -d postgres redis

# Run migrations
cd apps/api
pnpm prisma migrate dev
cd ../..

# Start development servers
pnpm dev
```

---

## 💻 Development Workflow

### 1. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 2. Make Changes

```bash
# Work on your changes
# ...

# Run linter
pnpm lint

# Run formatter
pnpm format

# Run tests
pnpm test
```

### 3. Commit Changes

Follow our [Commit Convention](#commit-convention).

```bash
git add .
git commit -m "feat(tenants): add tenant risk score calculation"
```

### 4. Push & Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Fill in the PR template
```

---

## 📐 Code Standards

### TypeScript

- **Strict mode**: Always use TypeScript strict mode
- **Types**: Prefer interfaces over types for object shapes
- **Explicit types**: Always specify return types for functions
- **No `any`**: Avoid `any` type (use `unknown` if needed)

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// ❌ Bad
function getUser(id: any) {
  // ...
}
```

### NestJS (Backend)

- **Modules**: Keep modules focused and cohesive
- **Services**: Business logic goes in services, not controllers
- **DTOs**: Always use DTOs with class-validator
- **Guards**: Use guards for authentication/authorization
- **Interceptors**: Use interceptors for cross-cutting concerns

```typescript
// ✅ Good - Controller
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'AGENT')
  async create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantsService.create(createTenantDto);
  }
}

// ✅ Good - DTO
export class CreateTenantDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditScore?: number;
}
```

### Next.js (Frontend)

- **Server Components**: Use Server Components by default
- **'use client'**: Only add for interactive components
- **File naming**: kebab-case for files, PascalCase for components
- **Async components**: Use async for data fetching in Server Components

```tsx
// ✅ Good - Server Component (default)
export default async function TenantsPage() {
  const tenants = await fetchTenants();
  return <TenantsList tenants={tenants} />;
}

// ✅ Good - Client Component (when needed)
'use client';

export function TenantForm() {
  const [name, setName] = useState('');
  // ...
}
```

### CSS/Tailwind

- **Utility-first**: Use Tailwind utilities
- **Component classes**: Extract reusable patterns to components
- **No inline styles**: Use Tailwind classes instead
- **Dark mode**: Support dark mode with `dark:` prefix

```tsx
// ✅ Good
<button className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 dark:bg-primary-dark">
  Submit
</button>

// ❌ Bad
<button style={{ backgroundColor: 'blue', padding: '8px 16px' }}>
  Submit
</button>
```

---

## 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `revert`: Revert a previous commit

### Scopes

- `auth` - Authentication/Authorization
- `tenants` - Tenant management
- `contracts` - Contract management
- `payments` - Payment processing
- `properties` - Property management
- `ml` - ML/AI features
- `api` - Backend API
- `web` - Frontend
- `db` - Database
- `docker` - Docker configuration
- `docs` - Documentation

### Examples

```bash
# Feature
git commit -m "feat(tenants): add tenant risk prediction endpoint"

# Bug fix
git commit -m "fix(payments): correct Orange Money callback handling"

# Documentation
git commit -m "docs(api): update authentication section in README"

# Refactoring
git commit -m "refactor(auth): extract token generation to separate service"

# Breaking change
git commit -m "feat(api)!: change password hashing to Argon2id

BREAKING CHANGE: All existing passwords need to be rehashed"
```

---

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass (`pnpm test`)
- [ ] Linter passes (`pnpm lint`)
- [ ] Added tests for new features
- [ ] Documentation updated
- [ ] Commits follow convention
- [ ] No merge conflicts with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Review Process

1. **Automated Checks**: CI/CD runs linting, tests, build
2. **Code Review**: At least 1 maintainer approval required
3. **Testing**: Reviewer tests changes locally if needed
4. **Merge**: Squash and merge (maintainer does this)

---

## 🧪 Testing

### Unit Tests (Jest)

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov

# Run specific test file
pnpm test src/auth/auth.service.spec.ts
```

**Example**:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  let service: TenantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantsService],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate risk score', async () => {
    const tenant = { creditScore: 750, paymentDelayAvg: 2 };
    const riskScore = await service.calculateRiskScore(tenant);
    expect(riskScore).toBeLessThan(0.3); // Low risk
  });
});
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
cd apps/web
pnpm playwright test

# Run with UI
pnpm playwright test --ui

# Run specific test
pnpm playwright test tests/auth.spec.ts
```

**Example**:

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=Login');
  await page.fill('input[name="email"]', 'admin@akig.gn');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Load Tests (k6)

```bash
# Run load test
k6 run scripts/load-test.js
```

---

## 📚 Documentation

### Code Comments

- **Complex logic**: Add comments explaining WHY, not WHAT
- **JSDoc**: Use JSDoc for public APIs
- **TODO**: Use `// TODO:` for future improvements

```typescript
/**
 * Calculates tenant risk score using XGBoost model
 * @param tenant - Tenant data with financial information
 * @returns Risk score between 0 (low risk) and 1 (high risk)
 */
async calculateRiskScore(tenant: Tenant): Promise<number> {
  // Use 6-month payment history for prediction
  // This provides better accuracy than 3-month data
  const features = this.extractFeatures(tenant, 6);
  return this.mlService.predict(features);
}
```

### Documentation Files

When adding new features:

1. Update relevant docs in `docs/` folder
2. Add examples to README if applicable
3. Update API reference (Swagger decorators)
4. Add migration notes if breaking change

---

## 🎯 Areas Needing Contribution

### High Priority

- [ ] Frontend pages (tenants, properties, contracts list/detail)
- [ ] Kubernetes manifests (deployment, service, ingress)
- [ ] Terraform AWS/GCP modules
- [ ] Additional unit tests (target 95% coverage)
- [ ] E2E tests with Playwright
- [ ] Grafana dashboards

### Medium Priority

- [ ] ML models training scripts
- [ ] Performance optimization (caching strategies)
- [ ] Internationalization (i18n)
- [ ] Mobile app (React Native)

### Low Priority

- [ ] Additional payment providers (Stripe, etc.)
- [ ] Advanced analytics features
- [ ] Integrations (Zapier, Slack, etc.)

---

## 💬 Communication

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas
- **Slack**: [#akig-dev](https://akig-community.slack.com/archives/dev)
- **Email**: dev@akig.gn

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (Proprietary - see LICENSE file).

---

**Thank you for contributing to AKIG! 🚀**

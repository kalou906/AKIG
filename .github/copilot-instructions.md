# AI Agent Instructions for AKIG Codebase

## Architecture Overview

This is a full-stack application with separated backend and frontend:

- `/backend`: Node.js/Express REST API with PostgreSQL database
- `/frontend`: Frontend application (structure to be implemented)

### Backend Architecture

The backend follows a modular REST API architecture with these key components:

- `src/index.js`: Main application entry point, configures Express middleware and routes
- `src/db.js`: PostgreSQL connection pool configuration using environment variables
- `src/routes/`: API route handlers organized by domain:
  - `auth.js`: Authentication endpoints (register, login)
  - `contracts.js`: Contract management endpoints
  - `payments.js`: Payment processing endpoints

## Key Patterns and Conventions

1. **Database Access**: 
   - Uses `pg` Pool for PostgreSQL connections
   - Connection string configured via `DATABASE_URL` environment variable
   - Raw SQL queries with parameterized values for security

2. **Authentication**:
   - JWT-based authentication using `jsonwebtoken`
   - Tokens expire in 24 hours
   - User passwords hashed with bcrypt (10 salt rounds)
   - User roles supported in authentication system

3. **API Structure**:
   - All routes prefixed with `/api`
   - Resources grouped by domain (`/api/auth`, `/api/contracts`, `/api/payments`)
   - Health check endpoint at `/api/health`

## Development Workflow

1. **Setup**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Variables Required**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secret key for JWT signing
   - `PORT`: Optional, defaults to 4000

3. **Running the Server**:
   - Development: `npm run dev` (uses nodemon for auto-reload)
   - Production: `npm start`

## Common Tasks and Examples

- **Adding New API Routes**:
  1. Create new route file in `src/routes/`
  2. Import and use in `src/index.js` with `app.use('/api/resource', resourceRoutes)`

- **Database Queries**:
  ```javascript
  const result = await pool.query(
    'SELECT * FROM table WHERE column = $1',
    [value]
  );
  ```

## External Dependencies

- **Authentication**: `bcryptjs`, `jsonwebtoken`
- **API**: `express`, `cors`, `morgan`
- **Database**: `pg`
- **Utils**: `dayjs`, `pdfkit`
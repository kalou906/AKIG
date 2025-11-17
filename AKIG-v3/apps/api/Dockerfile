# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22.11.0-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter=api...

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22.11.0-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY apps/api ./apps/api
COPY packages ./packages
COPY pnpm-workspace.yaml package.json ./

# Generate Prisma client
WORKDIR /app/apps/api
RUN pnpm prisma generate

# Build application
RUN pnpm build

# ============================================
# Stage 3: Runner
# ============================================
FROM node:22.11.0-alpine AS runner

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Install production dependencies only
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

# Copy package files
COPY --chown=nestjs:nodejs pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY --chown=nestjs:nodejs apps/api/package.json ./apps/api/

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod --filter=api...

# Copy built application and Prisma files
COPY --chown=nestjs:nodejs --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=nestjs:nodejs --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --chown=nestjs:nodejs --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start application
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22.11.0-alpine AS deps

# Install pnpm and libc6-compat for better compatibility
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter=web...

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22.11.0-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy source code
COPY apps/web ./apps/web
COPY packages ./packages
COPY pnpm-workspace.yaml package.json ./

# Build Next.js application
WORKDIR /app/apps/web

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

# Build with standalone output (optimized for Docker)
RUN pnpm build

# ============================================
# Stage 3: Runner
# ============================================
FROM node:22.11.0-alpine AS runner

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy necessary files for standalone output
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start Next.js server
CMD ["node", "apps/web/server.js"]

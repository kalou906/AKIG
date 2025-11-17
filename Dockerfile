# Backend API - Node.js/Express
FROM node:18-alpine AS backend

WORKDIR /app/backend

# Copier package.json et installer dépendances
COPY backend/package*.json ./
RUN npm ci --only=production

# Copier code source
COPY backend/src ./src
COPY backend/migrations ./migrations

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 4000

CMD ["node", "src/scripts/start.js"]

# Frontend - Node.js/React build
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/src ./src
COPY frontend/public ./public

RUN npm run build

# Frontend - Nginx server
FROM nginx:alpine AS frontend

COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

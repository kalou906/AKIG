# Image de base légère pour Node.js
FROM node:18-alpine

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm install --omit=dev

# Copier le code source
COPY . .

ENV NODE_ENV=production

EXPOSE 4002

CMD ["npm", "start"]

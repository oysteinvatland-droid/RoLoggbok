# syntax=docker/dockerfile:1

# ── Stage 1: bygg statisk frontend (Vite SPA) ────────────────────────────────
FROM node:22-alpine AS frontend
WORKDIR /app
COPY package*.json ./
# --legacy-peer-deps: vite-plugin-pwa@1.2.0 har utdatert peer-range (vite <=7),
# men fungerer med vite 8. Trygt å overstyre peer-sjekken.
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build        # → /app/dist

# ── Stage 2: bygg backend (tsc → dist) ───────────────────────────────────────
FROM node:22-alpine AS server-build
WORKDIR /srv
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build        # → /srv/dist

# ── Stage 3: runtime (kun prod-avhengigheter, ikke-root) ─────────────────────
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV STATIC_DIR=/srv/public
WORKDIR /srv
COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=server-build /srv/dist ./dist
COPY --from=frontend /app/dist ./public
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]

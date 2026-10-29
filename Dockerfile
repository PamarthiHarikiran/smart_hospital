# Single-service deployment: Express serves the REST API, Socket.IO and the built React app.

# ---------- Build stage ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Dependency manifests first, so this layer is cached when only source changes
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm --prefix backend install \
 && npm --prefix frontend install --legacy-peer-deps

COPY backend ./backend
COPY frontend ./frontend

# A relative API base keeps the browser on the same origin as the Express server
RUN VITE_API_URL=/api npm --prefix frontend run build

# ---------- Runtime stage ----------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 5000
CMD ["node", "backend/server.js"]

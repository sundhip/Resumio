# ==============================================================================
# RESUMIO PRODUCTION MULTI-STAGE DOCKERFILE
# Phase 11: Production Hardening, Security, Privacy and Operations
# Hardened non-root runtime with minimal attack surface
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets
# ------------------------------------------------------------------------------
FROM node:22-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production API Runtime (Hardened Non-Root)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install tsx globally and copy package descriptors
COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copy server code, packages, tsconfigs
COPY server ./server
COPY packages ./packages
COPY tsconfig*.json ./

# Create storage and data directories
RUN mkdir -p /app/server/uploads/resumes \
             /app/server/uploads/avatars \
             /app/server/data \
             /app/server/backups \
    && chown -R node:node /app

# Switch to non-root user for security (OWASP ASVS compliance)
USER node

EXPOSE 3001

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["tsx", "server/index.ts"]

# Resumio - Production Multi-Stage Dockerfile
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build client
COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS production
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx

# Copy built frontend assets from stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copy backend code, models, configs, and scripts
COPY server ./server
COPY tsconfig*.json ./

# Create necessary runtime directories with appropriate permissions
RUN mkdir -p /app/server/uploads/resumes /app/server/uploads/avatars /app/server/data

# Expose backend port
EXPOSE 3001

# Run backend via tsx in production
CMD ["tsx", "server/index.ts"]

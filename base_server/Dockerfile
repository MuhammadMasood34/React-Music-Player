# ---- Build Stage ----
FROM node:20-alpine AS builder

# Install build tools needed for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
# This compiles native modules (bcrypt) for the target platform
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies after build (keep native modules intact)
RUN npm prune --omit=dev

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Copy built files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy pruned node_modules (with compiled native binaries) from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Expose port (Railway will override via PORT env var)
EXPOSE 3000

# Start the application
CMD ["node", "dist/bin/server.js"]

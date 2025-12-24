# FlowLogic WMS - Production Docker Image
# Works on Linux, Unix, Windows, macOS

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client (schema is in server/prisma)
RUN npx prisma generate --schema=server/prisma/schema.prisma

# Build frontend
RUN npm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user
RUN addgroup -g 1001 -S flowlogic && \
    adduser -S flowlogic -u 1001 -G flowlogic

# Set ownership
RUN chown -R flowlogic:flowlogic /app

USER flowlogic

# Environment
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Expose ports
EXPOSE 3001

# Start server
CMD ["node", "server/index.js"]

# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.13.1

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/transactional/package.json ./packages/transactional/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages
COPY tsconfig.json tsconfig.gts.json ./
COPY turbo.json ./turbo.json

# Build backend and all its dependencies
WORKDIR /app
RUN pnpm build --filter @revendiste/backend...

# Runtime stage
FROM node:22-alpine AS runner

# Install pnpm
RUN npm install -g pnpm@10.13.1

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nodejs

# Copy package files for production install
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/transactional/package.json ./packages/transactional/package.json

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --filter @revendiste/backend...

# Copy built application and workspace packages
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages ./packages

# Note: Environment variables will be injected by AWS Secrets Manager at runtime
# No .env file is copied for security reasons

# Change ownership after installation
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server (run node directly, no need for pnpm)
# Note: With rootDir: ".", output structure is apps/backend/dist/src/server.js
WORKDIR /app/apps/backend
CMD ["node", "dist/src/server.js"]

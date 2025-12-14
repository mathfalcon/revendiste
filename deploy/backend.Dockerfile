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
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/transactional/package.json ./packages/transactional/package.json

# Install production dependencies only
# kysely-ctl is now in dependencies (needed at runtime for migrations)
RUN pnpm install --frozen-lockfile --prod --filter @revendiste/backend...

# Copy built application and workspace packages
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/dist ./apps/backend/dist
# Copy kysely config file (kysely-ctl can load TypeScript configs)
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/kysely.config.ts ./apps/backend/kysely.config.ts
# Copy migrations folder
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/src/db/migrations ./apps/backend/src/db/migrations
# Copy src/db and src/config folders (needed by kysely.config.ts and src/db/index.ts)
# We need the source files because kysely-ctl loads the TS config which imports from src/db
# and src/db/index.ts imports from ../config/env
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/src/db ./apps/backend/src/db
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/src/config ./apps/backend/src/config
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages

# Ensure backend directory exists and copy entrypoint script
RUN mkdir -p /app/apps/backend
COPY deploy/backend-entrypoint.sh /app/apps/backend/entrypoint.sh

# Note: Environment variables will be injected by AWS Secrets Manager at runtime
# No .env file is copied for security reasons

# Fix line endings (convert CRLF to LF) and make executable
# This prevents "no such file or directory" errors from Windows line endings
RUN sed -i 's/\r$//' /app/apps/backend/entrypoint.sh && \
  chmod +x /app/apps/backend/entrypoint.sh && \
  chown nodejs:nodejs /app/apps/backend/entrypoint.sh

# Change ownership of node_modules only (created by pnpm install, owned by root)
# This is much faster than chown -R /app because node_modules is the main culprit
RUN chown -R nodejs:nodejs /app/node_modules

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use entrypoint script that runs migrations before starting server
# The entrypoint will run migrations, then exec the CMD
WORKDIR /app/apps/backend
ENTRYPOINT ["/app/apps/backend/entrypoint.sh"]
CMD ["node", "dist/src/server.js"]

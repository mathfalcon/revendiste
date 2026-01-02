# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.13.1

WORKDIR /app

# Copy package files for dependency installation (layer caching optimization)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/transactional/package.json ./packages/transactional/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and build configs
COPY apps/backend ./apps/backend
COPY packages ./packages
COPY tsconfig.json tsconfig.gts.json turbo.json ./

# Build backend and all its dependencies
RUN pnpm build --filter @revendiste/backend...

# Runtime stage
FROM node:22-alpine AS runner

# Install pnpm
RUN npm install -g pnpm@10.13.1

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nodejs

# Copy package files for production install (needed for pnpm workspace resolution)
COPY --from=builder --chown=nodejs:nodejs /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/package.json ./apps/backend/
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=nodejs:nodejs /app/packages/transactional/package.json ./packages/transactional/

# Install production dependencies only
# kysely-ctl is now in dependencies (needed at runtime for migrations)
RUN pnpm install --frozen-lockfile --prod --filter @revendiste/backend...

# Install Playwright browsers (needed for scraping jobs)
# Playwright is in dependencies, but browsers need to be installed separately
# Install Alpine system dependencies required by Chromium
# Use shared location so nodejs user can access browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.playwright-browsers
RUN apk add --no-cache \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  && cd apps/backend && npx playwright install chromium \
  && chown -R nodejs:nodejs /app/.playwright-browsers

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/dist ./apps/backend/dist

# Copy kysely config and required source files for migrations
# kysely-ctl loads TypeScript config which imports src/db/index.ts -> src/config/env.ts
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/kysely.config.ts ./apps/backend/
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/src/db/migrations ./apps/backend/src/db/migrations
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/src/db/index.ts ./apps/backend/src/db/
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/src/config/env.ts ./apps/backend/src/config/

# Copy built workspace packages (dist folders only - package.json already copied above)
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/transactional/dist ./packages/transactional/dist

# Copy entrypoint script
COPY deploy/backend-entrypoint.sh /app/apps/backend/entrypoint.sh

# Note: Environment variables will be injected by AWS Secrets Manager at runtime
# No .env file is copied for security reasons

# Fix line endings (CRLF to LF) and make executable
# Change ownership of node_modules (created by pnpm install, owned by root)
RUN sed -i 's/\r$//' /app/apps/backend/entrypoint.sh && \
  chmod +x /app/apps/backend/entrypoint.sh && \
  chown -R nodejs:nodejs /app/node_modules

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use entrypoint script to parse secrets, run migrations, and start server
WORKDIR /app/apps/backend
ENTRYPOINT ["/app/apps/backend/entrypoint.sh"]
CMD ["node", "dist/src/server.js"]

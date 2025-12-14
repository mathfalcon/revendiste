# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.13.1

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @revendiste/frontend...

# Copy source code
COPY apps/frontend ./apps/frontend
COPY packages ./packages
COPY tsconfig.json tsconfig.gts.json ./

# Build frontend
ARG ENVIRONMENT=development
WORKDIR /app/apps/frontend
RUN pnpm build --mode ${ENVIRONMENT}

# Runtime stage
FROM node:22-alpine AS runner

ARG ENVIRONMENT=development

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/frontend/.output ./.output
COPY --from=builder --chown=nodejs:nodejs /app/apps/frontend/package.json ./package.json

# Copy environment file (required - build will fail if missing)
COPY --from=builder --chown=nodejs:nodejs /app/apps/frontend/.env.${ENVIRONMENT} ./.env

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server (run node directly, no need for pnpm)
CMD ["node", ".output/server/index.mjs"]



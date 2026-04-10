# Template Monorepo

A modern, full-stack TypeScript monorepo template with Express backend, React frontend, and shared packages. Built with pnpm workspaces, Turbo, and best practices for scalable development.

## 🚀 Features

- **Full-Stack TypeScript**: End-to-end type safety across frontend and backend
- **Modern Frontend**: React with TanStack Router, Tailwind CSS, and Vite
- **Robust Backend**: Express with TSOA, PostgreSQL, and Kysely
- **Shared Packages**: Common types, schemas, and utilities
- **Monorepo Structure**: pnpm workspaces with Turbo for efficient builds
- **API Documentation**: Auto-generated OpenAPI/Swagger docs with TSOA
- **Database Migrations**: Type-safe migrations with Kysely
- **Development Tools**: ESLint, Prettier, TypeScript strict mode

## 🏗️ Project Structure

```
template-monorepo/
├── apps/
│   ├── backend/          # Express API with TSOA
│   └── frontend/         # React app with TanStack Router
├── packages/
│   └── shared/           # Shared types and utilities
├── turbo.json           # Turbo build configuration
├── pnpm-workspace.yaml  # pnpm workspace configuration
└── package.json         # Root package.json
```

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18 with TanStack Router
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Type Safety**: TypeScript (strict mode)
- **State Management**: TanStack Query (React Query)

### Backend

- **Framework**: Express.js with TSOA
- **Database**: PostgreSQL with Kysely
- **API Documentation**: Auto-generated OpenAPI/Swagger
- **Validation**: Zod schemas
- **Type Safety**: TypeScript (strict mode)

### Shared

- **Package Manager**: pnpm workspaces
- **Build System**: Turbo
- **Code Quality**: ESLint, Prettier
- **Types**: Shared TypeScript types and Zod schemas

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (for PostgreSQL)
- Git

### 1. Clone and Setup

```bash
# Clone the template
git clone <your-template-repo-url>
cd template-monorepo

# Install dependencies
pnpm install
```

### 2. Environment Configuration

Create environment files for each app:

```bash
# Backend environment
cp apps/backend/.env.example apps/backend/.env

# Frontend environment (if needed)
cp apps/frontend/.env.example apps/frontend/.env
```

### 3. Database Setup

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
pnpm --filter backend kysely:migrate
```

### 4. Generate TSOA Routes and Documentation

```bash
# Generate backend routes and OpenAPI spec
pnpm --filter backend tsoa:routes
pnpm --filter backend tsoa:spec
```

### 5. Start Development Servers

```bash
# Start all apps in development mode
pnpm dev

# Or start individually
pnpm --filter frontend dev
pnpm --filter backend dev
```

## 📁 Apps & Packages

### Backend (`apps/backend/`)

Express API with TSOA for automatic route generation and OpenAPI documentation.

**Key Features:**

- TSOA decorators for type-safe API development
- PostgreSQL with Kysely for type-safe database operations
- Auto-generated OpenAPI/Swagger documentation
- Comprehensive health check system
- Pagination middleware
- Custom error handling

**Available Scripts:**

```bash
pnpm --filter backend dev          # Development server
pnpm --filter backend build        # Build for production
pnpm --filter backend start        # Start production server
pnpm --filter backend tsoa:routes  # Generate routes
pnpm --filter backend tsoa:spec    # Generate OpenAPI spec
```

**API Documentation:**

- Swagger UI: `http://localhost:4000/api/docs`
- OpenAPI JSON: `http://localhost:4000/swagger.json`

### Frontend (`apps/frontend/`)

React application with TanStack Router for type-safe routing.

**Key Features:**

- TanStack Router for type-safe routing
- Tailwind CSS for styling
- Vite for fast development
- TanStack Query for server state management
- TypeScript strict mode

**Available Scripts:**

```bash
pnpm --filter frontend dev    # Development server
pnpm --filter frontend build  # Build for production
pnpm --filter frontend preview # Preview production build
```

### Shared (`packages/shared/`)

Common types, schemas, and utilities shared between frontend and backend.

**Contents:**

- TypeScript type definitions
- Zod validation schemas
- Shared utilities and constants

## 🔧 Development Workflow

### Adding New Features

1. **Backend API Endpoints:**

   ```bash
   # Create controller with TSOA decorators
   # Generate routes and documentation
   pnpm --filter backend tsoa:routes
   pnpm --filter backend tsoa:spec
   ```

2. **Frontend Pages:**

   ```bash
   # Create new route files
   # TanStack Router will auto-generate types
   ```

3. **Shared Types:**
   ```bash
   # Add types to packages/shared/src/
   # Import in both frontend and backend
   ```

### Database Changes

```bash
# Create new migration
pnpm --filter backend kysely migration create <migration-name>

# Run migrations
pnpm --filter backend kysely:migrate

# Generate types
pnpm --filter backend generate:db
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

## 🚀 Deployment

### Production Build

```bash
# Build all packages
pnpm build

# Generate TSOA routes and spec for production
pnpm --filter backend tsoa:routes
pnpm --filter backend tsoa:spec
```

### Environment Variables

**Backend:**

```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=4000
NODE_ENV=production
```

**Frontend:**

```env
VITE_API_URL=http://localhost:4000/api
```

## 📚 Documentation

- [Backend API Documentation](./apps/backend/README.md)
- [Frontend Documentation](./apps/frontend/README.md)
- [Shared Package Documentation](./packages/shared/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## DB BASTION

aws ssm start-session --target i-0ba2a233a56a9ffc4 --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters '{"host":["revendiste-prod-postgres.crk6o8y46hf2.sa-east-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["5433"]}' --region sa-east-1 --profile revendiste

terraform output db_tunnel_command

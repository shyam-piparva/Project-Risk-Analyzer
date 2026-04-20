# Setup Guide

This guide will help you set up the AI Project Risk Analyzer development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** and **npm 9+**
- **Docker** and **Docker Compose** (recommended for databases)
- **Git**

## Quick Start

### 1. Install Dependencies

From the root directory, install all workspace dependencies:

```bash
npm install
```

This will install dependencies for both the backend and frontend workspaces.

### 2. Set Up Environment Variables

Create environment files from the examples:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

**Important**: Edit `backend/.env` and change the `JWT_SECRET` to a secure random string:

```bash
# Generate a secure JWT secret (Linux/Mac)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Start Database Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up postgres redis -d
```

Wait a few seconds for the databases to initialize.

### 4. Run Database Migrations

Create the database schema:

```bash
npm run migrate --workspace=backend
```

You should see: "Database migrations completed successfully"

### 5. Start the Application

#### Option A: Start Everything with Docker

```bash
docker-compose up
```

This starts PostgreSQL, Redis, backend, and frontend.

#### Option B: Start Backend and Frontend Separately

In one terminal, start the backend:

```bash
npm run dev:backend
```

In another terminal, start the frontend:

```bash
npm run dev:frontend
```

### 6. Verify Installation

- **Frontend**: Open http://localhost:5173
- **Backend API**: Open http://localhost:3000/api
- **Health Check**: Open http://localhost:3000/health

You should see the application running!

## Development Workflow

### Running Tests

```bash
# Run all tests
npm run test

# Run backend tests only
npm run test --workspace=backend

# Run frontend tests only
npm run test --workspace=frontend

# Watch mode
npm run test:watch --workspace=backend
```

### Code Quality

```bash
# Lint all code
npm run lint

# Format all code
npm run format
```

### Database Management

```bash
# Run migrations
npm run migrate --workspace=backend

# Connect to PostgreSQL (with Docker)
docker exec -it risk-analyzer-db psql -U postgres -d risk_analyzer

# View database logs
docker logs risk-analyzer-db
```

### Viewing Logs

Backend logs are written to:
- Console (stdout)
- `backend/logs/app.log` (all logs)
- `backend/logs/error.log` (errors only)

## Troubleshooting

### Port Already in Use

If you see "port already in use" errors:

```bash
# Check what's using the port
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill the process or change the port in .env files
```

### Database Connection Failed

1. Ensure PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check database logs:
   ```bash
   docker logs risk-analyzer-db
   ```

3. Verify connection settings in `backend/.env`

### Cannot Find Module Errors

Clear node_modules and reinstall:

```bash
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
```

### Docker Issues

Reset Docker containers and volumes:

```bash
docker-compose down -v
docker-compose up
```

## Next Steps

Now that your environment is set up, you can:

1. Review the [README.md](./README.md) for project overview
2. Check the [requirements document](./.kiro/specs/ai-project-risk-analyzer/requirements.md)
3. Review the [design document](./.kiro/specs/ai-project-risk-analyzer/design.md)
4. Start implementing features from [tasks.md](./.kiro/specs/ai-project-risk-analyzer/tasks.md)

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

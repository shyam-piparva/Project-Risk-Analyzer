# Tech Stack

## Languages and Runtimes
- **TypeScript 5.1+** - Primary language for both frontend and backend
- **Node.js 18+** - Backend runtime
- **npm 9+** - Package manager

## Backend Stack
- **Express.js 4.18** - Web framework
- **PostgreSQL 14+** - Primary database
- **Redis 7+** - Caching and session management
- **JWT** - Authentication (jsonwebtoken)
- **Bcrypt** - Password hashing
- **Joi** - Request validation
- **Winston** - Logging
- **Jest** - Testing framework
- **tsx** - TypeScript execution for development

## Frontend Stack
- **React 18.2** - UI framework
- **Vite 4.4** - Build tool and dev server
- **React Router 6.14** - Client-side routing
- **React Query 4.29** - State management and data fetching
- **Axios 1.4** - HTTP client
- **Recharts 2.7** - Data visualization
- **Tailwind CSS 3.3** - Styling framework

## DevOps and Tools
- **Docker & Docker Compose** - Containerization
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **npm workspaces** - Monorepo management

## Common Commands

### Development
```bash
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
docker-compose up        # Start all services with Docker
```

### Building
```bash
npm run build            # Build all workspaces
npm run build --workspace=backend
npm run build --workspace=frontend
```

### Testing
```bash
npm run test             # Run all tests
npm run test --workspace=backend
npm run test --workspace=frontend
```

### Code Quality
```bash
npm run lint             # Lint all code
npm run format           # Format all code with Prettier
```

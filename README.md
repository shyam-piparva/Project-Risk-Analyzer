# AI Project Risk Analyzer

A web-based platform that enables project managers and teams to proactively identify, assess, and mitigate project risks using artificial intelligence and machine learning.

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Authentication**: JWT with bcrypt
- **Validation**: Joi
- **Logging**: Winston

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Query
- **Charts**: Recharts
- **HTTP Client**: Axios

### DevOps
- **Containerization**: Docker & Docker Compose
- **Package Manager**: npm (workspaces)
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest

## Project Structure

```
ai-project-risk-analyzer/
├── backend/              # Backend API workspace
│   ├── src/
│   │   ├── index.ts     # Application entry point
│   │   └── utils/       # Utility functions
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/            # Frontend React app workspace
│   ├── src/
│   │   ├── main.tsx    # Application entry point
│   │   ├── App.tsx     # Root component
│   │   └── index.css   # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml   # Docker services configuration
├── package.json         # Root workspace configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose (for containerized setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-project-risk-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   
   Edit the `.env` files with your configuration.

### Running with Docker (Recommended)

1. **Start all services**
   ```bash
   docker-compose up
   ```

2. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Running Locally (Without Docker)

1. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker for databases only
   docker-compose up postgres redis
   ```

2. **Start the backend**
   ```bash
   npm run dev:backend
   ```

3. **Start the frontend** (in a new terminal)
   ```bash
   npm run dev:frontend
   ```

## Available Scripts

### Root Level
- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build both workspaces
- `npm run test` - Run tests in all workspaces
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier

### Backend
- `npm run dev --workspace=backend` - Start backend dev server
- `npm run build --workspace=backend` - Build backend
- `npm run test --workspace=backend` - Run backend tests
- `npm run lint --workspace=backend` - Lint backend code

### Frontend
- `npm run dev --workspace=frontend` - Start frontend dev server
- `npm run build --workspace=frontend` - Build frontend for production
- `npm run test --workspace=frontend` - Run frontend tests
- `npm run lint --workspace=frontend` - Lint frontend code

## Development

### Code Quality

The project uses ESLint and Prettier for code quality and formatting:

```bash
# Check linting
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch --workspace=backend
```

## API Documentation

The API will be available at `http://localhost:3000/api` once the backend is running.

- Health check: `GET /health`
- API info: `GET /api`

Full API documentation will be added as endpoints are implemented.

## License

Private - All rights reserved

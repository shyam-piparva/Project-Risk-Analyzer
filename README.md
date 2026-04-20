# 🎯 Project Risk Analyzer

A full-stack web application that enables project managers and teams to proactively identify, assess, and mitigate project risks using artificial intelligence and machine learning.

## 🌟 Features

- **User Authentication**: Secure JWT-based authentication with registration, login, and password reset
- **Project Management**: Create and manage multiple projects with detailed parameters
- **AI-Powered Risk Analysis**: Automated risk identification using ML models and rule-based analysis
- **Risk Scoring & Categorization**: Risks scored 0-100 and categorized (Technical, Resource, Schedule, Budget, External)
- **Mitigation Recommendations**: AI-generated actionable strategies to reduce risks
- **Interactive Dashboard**: Visual analytics with charts and metrics using Recharts
- **Historical Tracking**: Track how risks evolve over time
- **Report Generation**: Export risk analyses as PDF or CSV

## 🛠️ Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling
- React Router for navigation
- React Query for state management
- Recharts for data visualization
- Tailwind CSS for styling
- Axios for API communication

### Backend
- Node.js 18+ with Express.js
- TypeScript for type safety
- PostgreSQL 14+ for database
- Redis for caching
- JWT for authentication
- Bcrypt for password hashing
- Winston for logging

### Risk Engine
- Python 3.11+ with Flask
- Pydantic for data validation
- PERT/CPM analysis algorithms
- Rule-based risk detection

### DevOps
- Docker & Docker Compose
- Multi-stage builds for production
- Environment-based configuration

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Running with Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/project-risk-analyzer.git
cd project-risk-analyzer
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Start all services:
```bash
docker-compose up --build
```

4. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Risk Engine: http://localhost:5001

### Local Development

See [DEVELOPER.md](DEVELOPER.md) for detailed development setup instructions.

## 📖 Documentation

- [Setup Guide](SETUP.md) - Complete setup instructions
- [Developer Guide](DEVELOPER.md) - Development workflow and guidelines
- [API Documentation](backend/docs/API.md) - REST API endpoints and examples
- [User Guide](USER_GUIDE.md) - End-user documentation
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions

## 🏗️ Project Structure

```
project-risk-analyzer/
├── backend/              # Node.js/Express API
├── frontend/             # React application
├── risk-engine/          # Python risk analysis engine
├── .kiro/               # Specifications and design docs
├── docker-compose.yml   # Docker services configuration
└── README.md
```

## 🔧 Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Database
DB_NAME=risk_analyzer
DB_USER=postgres
DB_PASSWORD=postgres

# Backend
BACKEND_PORT=3000
JWT_SECRET=your-secret-key

# Frontend
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:3000/api

# Risk Engine
RISK_ENGINE_PORT=5001
```

## 🧪 Testing

Run tests for each component:

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Risk engine tests
cd risk-engine && pytest
```

## 📊 Key Metrics

- **Overall Risk Score**: Weighted average of all identified risks (0-100)
- **Risk Categories**: Technical, Resource, Schedule, Budget, External
- **Severity Levels**: High (70-100), Medium (40-69), Low (0-39)
- **Mitigation Priority**: High, Medium, Low based on impact and feasibility

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by project management best practices
- Uses PERT/CPM analysis techniques

## 📧 Support

For support, email your-email@example.com or open an issue in the GitHub repository.

---

Made with ❤️ by Your Team

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

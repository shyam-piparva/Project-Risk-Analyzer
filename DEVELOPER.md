# Developer Documentation

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Testing Strategy](#testing-strategy)
5. [Code Style and Standards](#code-style-and-standards)
6. [Database Management](#database-management)
7. [Environment Configuration](#environment-configuration)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Docker**: Latest stable version (for PostgreSQL and Redis)
- **Docker Compose**: Latest stable version
- **Git**: For version control

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ai-project-risk-analyzer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   This will install dependencies for both backend and frontend workspaces.

3. **Set up environment variables**:
   
   Backend:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

   Frontend:
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Docker services**:
   ```bash
   docker-compose up -d
   ```
   This starts PostgreSQL and Redis containers.

5. **Run database migrations**:
   ```bash
   npm run migrate --workspace=backend
   ```

6. **Seed the database** (optional):
   ```bash
   npm run seed --workspace=backend
   ```

7. **Start development servers**:
   ```bash
   npm run dev
   ```
   This starts both backend (port 3000) and frontend (port 5173) servers.

8. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Documentation: See `backend/docs/API.md`

---

## Project Structure

This is a **monorepo** using npm workspaces with two main packages:

```
ai-project-risk-analyzer/
├── .kiro/                          # Kiro AI specifications and steering
│   ├── specs/                      # Feature specifications
│   │   └── ai-project-risk-analyzer/
│   │       ├── requirements.md     # Requirements document
│   │       ├── design.md           # Design document
│   │       └── tasks.md            # Implementation tasks
│   └── steering/                   # AI steering documents
│       ├── product.md              # Product overview
│       ├── structure.md            # Project structure guide
│       └── tech.md                 # Tech stack documentation
│
├── backend/                        # Backend API workspace
│   ├── src/
│   │   ├── index.ts               # Application entry point
│   │   ├── config/                # Configuration files
│   │   │   ├── database.ts        # Database connection
│   │   │   └── index.ts           # Centralized config
│   │   ├── controllers/           # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── projectController.ts
│   │   │   └── riskController.ts
│   │   ├── middleware/            # Express middleware
│   │   │   └── auth.ts            # JWT authentication
│   │   ├── routes/                # API routes
│   │   ├── services/              # Business logic
│   │   │   ├── userService.ts
│   │   │   ├── projectService.ts
│   │   │   ├── riskAnalysisService.ts
│   │   │   └── riskAnalysisEngine.ts
│   │   └── utils/                 # Utility functions
│   │       ├── logger.ts          # Winston logger
│   │       ├── jwt.ts             # JWT utilities
│   │       └── password.ts        # Password hashing
│   ├── migrations/                # Database migrations
│   ├── scripts/                   # Utility scripts
│   │   ├── run-migrations.ts
│   │   └── seed-database.ts
│   ├── docs/                      # Documentation
│   │   └── API.md                 # API documentation
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── Dockerfile
│
├── frontend/                       # Frontend React app workspace
│   ├── src/
│   │   ├── main.tsx               # Application entry point
│   │   ├── App.tsx                # Root component
│   │   ├── components/            # React components
│   │   │   ├── auth/              # Authentication components
│   │   │   ├── common/            # Reusable components
│   │   │   ├── projects/          # Project management
│   │   │   └── risks/             # Risk analysis components
│   │   ├── contexts/              # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   └── ToastContext.tsx
│   │   ├── routes/                # Route definitions
│   │   ├── services/              # API services
│   │   │   └── api.ts
│   │   ├── config/                # Configuration
│   │   │   ├── axios.ts
│   │   │   ├── env.ts
│   │   │   └── queryClient.ts
│   │   └── index.css              # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── docker-compose.yml              # Docker services configuration
├── package.json                    # Root workspace configuration
├── .eslintrc.json                 # ESLint configuration
├── .prettierrc                    # Prettier configuration
└── README.md                       # Project overview
```

### Key Directories

- **backend/src/services/**: Business logic layer - contains all core functionality
- **backend/src/controllers/**: HTTP request handlers - thin layer that calls services
- **backend/src/middleware/**: Express middleware for authentication, validation, etc.
- **frontend/src/components/**: React components organized by feature
- **frontend/src/contexts/**: Global state management using React Context
- **.kiro/specs/**: Feature specifications following spec-driven development

---

## Development Workflow

### Running the Application

**Start everything** (recommended for development):
```bash
npm run dev
```

**Start backend only**:
```bash
npm run dev:backend
# or
cd backend && npm run dev
```

**Start frontend only**:
```bash
npm run dev:frontend
# or
cd frontend && npm run dev
```

**Start Docker services**:
```bash
docker-compose up -d        # Start in background
docker-compose logs -f      # View logs
docker-compose down         # Stop services
```

### Building for Production

**Build all workspaces**:
```bash
npm run build
```

**Build specific workspace**:
```bash
npm run build --workspace=backend
npm run build --workspace=frontend
```

**Run production build**:
```bash
# Backend
cd backend && npm start

# Frontend (serve with nginx or static server)
cd frontend && npm run preview
```

### Code Quality

**Linting**:
```bash
npm run lint                    # Lint all workspaces
npm run lint --workspace=backend
npm run lint --workspace=frontend
```

**Formatting**:
```bash
npm run format                  # Format all files
```

**Type Checking**:
```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd frontend && npx tsc --noEmit
```

---

## Testing Strategy

The project uses a dual testing approach: **unit tests** and **property-based tests**.

### Unit Tests

Unit tests focus on specific examples, edge cases, and integration points.

**Run all tests**:
```bash
npm run test
```

**Run tests for specific workspace**:
```bash
npm run test --workspace=backend
npm run test --workspace=frontend
```

**Run tests in watch mode**:
```bash
cd backend && npm run test:watch
```

**Run specific test file**:
```bash
cd backend && npm test -- userService.test.ts
```

### Property-Based Tests

Property-based tests validate universal properties across random inputs using **fast-check**.

**Location**: Tests with `.property.test.ts` suffix

**Example**:
```typescript
import fc from 'fast-check';

describe('Property 6: Project data round-trips correctly', () => {
  it('should preserve all project data through create and retrieve', () => {
    fc.assert(
      fc.property(
        projectArbitrary(),
        async (projectData) => {
          const created = await projectService.createProject(userId, projectData);
          const retrieved = await projectService.getProjectById(created.id, userId);
          
          expect(retrieved.name).toBe(projectData.name);
          expect(retrieved.budget).toBe(projectData.budget);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `// Feature: ai-project-risk-analyzer, Property {number}: {property_text}`

### Test Coverage

**Generate coverage report**:
```bash
cd backend && npm test -- --coverage
```

**Coverage goals**:
- Unit test coverage: Minimum 80%
- Property test coverage: All 33 correctness properties
- Integration test coverage: All API endpoints

### Writing Tests

**Unit Test Example**:
```typescript
describe('UserService', () => {
  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      const user = await userService.register(userData);
      
      expect(user.email).toBe(userData.email);
      expect(user.passwordHash).not.toBe(userData.password);
      expect(user.isVerified).toBe(false);
    });
  });
});
```

**Property Test Example**:
```typescript
import fc from 'fast-check';

// Generator for valid project data
const projectArbitrary = () => fc.record({
  name: fc.string({ minLength: 2, maxLength: 100 }),
  budget: fc.integer({ min: 1000, max: 10000000 }),
  startDate: fc.date(),
  endDate: fc.date()
}).filter(p => p.endDate > p.startDate);

describe('Property 8: Input validation rejects invalid data', () => {
  it('should reject projects with end date before start date', () => {
    fc.assert(
      fc.property(
        fc.date(),
        fc.date(),
        async (date1, date2) => {
          const [startDate, endDate] = date1 < date2 ? [date2, date1] : [date1, date2];
          
          await expect(
            projectService.createProject(userId, {
              name: 'Test',
              startDate,
              endDate,
              budget: 10000
            })
          ).rejects.toThrow('End date must be after start date');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

---

## Code Style and Standards

### TypeScript

- Use **strict mode** (`"strict": true` in tsconfig.json)
- Prefer **interfaces** over types for object shapes
- Use **explicit return types** for functions
- Avoid `any` - use `unknown` if type is truly unknown

**Good**:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  // implementation
}
```

**Bad**:
```typescript
function getUser(id: any): any {
  // implementation
}
```

### Naming Conventions

- **Files**: camelCase for files, PascalCase for React components
  - `userService.ts`, `projectController.ts`
  - `LoginForm.tsx`, `RiskDashboard.tsx`
- **Variables/Functions**: camelCase
  - `const userName = 'John'`
  - `function calculateRiskScore() {}`
- **Classes/Interfaces**: PascalCase
  - `class UserService {}`, `interface Project {}`
- **Constants**: UPPER_SNAKE_CASE
  - `const MAX_RETRIES = 3`
- **Private members**: Prefix with underscore
  - `private _connection: Connection`

### Code Organization

**Services** (business logic):
```typescript
export class ProjectService {
  async createProject(userId: string, data: CreateProjectDTO): Promise<Project> {
    // Validation
    this.validateProjectData(data);
    
    // Business logic
    const project = await this.saveProject(userId, data);
    
    // Return result
    return project;
  }
  
  private validateProjectData(data: CreateProjectDTO): void {
    // Validation logic
  }
}
```

**Controllers** (HTTP handlers):
```typescript
export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const projectData = req.body;
    
    const project = await projectService.createProject(userId, projectData);
    
    res.status(201).json(project);
  } catch (error) {
    handleError(error, res);
  }
};
```

### Error Handling

**Always use try-catch** in async functions:
```typescript
async function riskyOperation() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    logger.error('Operation failed', { error });
    throw new CustomError('User-friendly message', error);
  }
}
```

**Custom error classes**:
```typescript
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}
```

### React Best Practices

**Use functional components** with hooks:
```typescript
export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  return (
    <div>
      {loading ? <LoadingSpinner /> : <ProjectGrid projects={projects} />}
    </div>
  );
};
```

**Extract custom hooks** for reusable logic:
```typescript
function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return { projects, loading, error, fetchProjects };
}
```

### Comments and Documentation

**Use JSDoc** for public APIs:
```typescript
/**
 * Analyzes a project and generates risk predictions
 * @param projectId - UUID of the project to analyze
 * @returns Risk analysis with identified risks and mitigations
 * @throws {ValidationError} If project data is incomplete
 * @throws {ServiceUnavailableError} If AI service is down
 */
async function analyzeProject(projectId: string): Promise<RiskAnalysis> {
  // implementation
}
```

**Inline comments** for complex logic:
```typescript
// Calculate weighted average of risk scores
// High-severity risks (70-100) get 2x weight
const overallScore = risks.reduce((sum, risk) => {
  const weight = risk.score >= 70 ? 2 : 1;
  return sum + (risk.score * weight);
}, 0) / totalWeight;
```

---

## Database Management

### Migrations

The project uses **node-pg-migrate** for database migrations.

**Create a new migration**:
```bash
npm run migrate:create --workspace=backend -- migration-name
```

**Run migrations**:
```bash
npm run migrate --workspace=backend
```

**Rollback last migration**:
```bash
npm run migrate:down --workspace=backend
```

**Redo last migration**:
```bash
npm run migrate:redo --workspace=backend
```

### Migration Structure

```javascript
exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });
  
  pgm.createIndex('users', 'email');
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
```

### Database Seeding

**Seed all data**:
```bash
npm run seed --workspace=backend
```

**Seed specific data**:
```bash
npm run seed:users --workspace=backend
npm run seed:projects --workspace=backend
npm run seed:risks --workspace=backend
```

**Clean database**:
```bash
npm run seed:clean --workspace=backend
```

### Database Connection

Connection is managed in `backend/src/config/database.ts`:

```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Query example**:
```typescript
const result = await pool.query(
  'SELECT * FROM projects WHERE user_id = $1',
  [userId]
);
```

---

## Environment Configuration

### Backend Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=risk_analyzer
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password

# AI Service
AI_SERVICE_URL=http://localhost:5000
AI_SERVICE_API_KEY=your-api-key

# Logging
LOG_LEVEL=debug
```

### Frontend Environment Variables

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=AI Project Risk Analyzer
```

### Environment-Specific Configs

- **Development**: `.env.development`
- **Staging**: `.env.staging`
- **Production**: `.env.production`

Load specific environment:
```bash
NODE_ENV=production npm start
```

---

## Deployment

### Docker Deployment

**Build images**:
```bash
docker-compose -f docker-compose.prod.yml build
```

**Start services**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**View logs**:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Manual Deployment

**Backend**:
```bash
cd backend
npm install --production
npm run build
npm start
```

**Frontend**:
```bash
cd frontend
npm install
npm run build
# Serve dist/ folder with nginx or static server
```

### Environment Checklist

Before deploying to production:

- [ ] Update all environment variables
- [ ] Change JWT secrets to strong random values
- [ ] Set `NODE_ENV=production`
- [ ] Configure database backups
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Test all API endpoints
- [ ] Run database migrations
- [ ] Set up CI/CD pipeline

---

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

**Database connection failed**:
- Ensure Docker containers are running: `docker-compose ps`
- Check database credentials in `.env`
- Verify PostgreSQL is accessible: `psql -h localhost -U postgres`

**Migration failed**:
```bash
# Check migration status
npm run migrate --workspace=backend -- status

# Rollback and retry
npm run migrate:down --workspace=backend
npm run migrate --workspace=backend
```

**TypeScript errors**:
```bash
# Clean build artifacts
rm -rf backend/dist frontend/dist

# Reinstall dependencies
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
```

**Tests failing**:
- Ensure test database is set up
- Check environment variables in test environment
- Run tests with verbose output: `npm test -- --verbose`

### Debugging

**Backend debugging**:
```typescript
import { logger } from './utils/logger';

logger.debug('Debug message', { data });
logger.info('Info message');
logger.error('Error message', { error });
```

**Frontend debugging**:
```typescript
console.log('Debug:', data);
// Or use React DevTools
```

**Database debugging**:
```bash
# Connect to database
docker exec -it <container-name> psql -U postgres -d risk_analyzer

# View tables
\dt

# Query data
SELECT * FROM projects;
```

---

## Contributing

### Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** following code style guidelines

3. **Write tests** for new functionality

4. **Run tests and linting**:
   ```bash
   npm run test
   npm run lint
   ```

5. **Commit changes** with descriptive message:
   ```bash
   git commit -m "feat: add risk filtering by category"
   ```

6. **Push to remote**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create pull request** with description of changes

### Commit Message Format

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Examples**:
```
feat: add CSV export for risk analysis
fix: resolve authentication token expiration issue
docs: update API documentation for new endpoints
test: add property tests for project validation
```

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console.log or debug code
- [ ] Error handling is implemented
- [ ] TypeScript types are correct
- [ ] No security vulnerabilities
- [ ] Performance is acceptable

### Getting Help

- **Documentation**: Check `backend/docs/API.md` and this file
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Slack/Discord**: Join the team chat (if available)

---

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [fast-check Property Testing](https://fast-check.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## License

[Your License Here]

## Support

For questions or issues:
- GitHub Issues: [repository-url]/issues
- Email: dev-team@example.com
- Documentation: [repository-url]/docs

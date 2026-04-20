# Frontend - AI Project Risk Analyzer

React-based frontend application for the AI Project Risk Analyzer.

## Tech Stack

- **React 18.2** - UI framework
- **TypeScript 5.1+** - Type safety
- **Vite 4.4** - Build tool and dev server
- **React Router 6.14** - Client-side routing
- **React Query 4.29** - State management and data fetching
- **Axios 1.4** - HTTP client
- **Tailwind CSS 3.3** - Styling framework
- **Recharts 2.7** - Data visualization (ready for use)

## Project Structure

```
frontend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── axios.ts      # Axios instance with interceptors
│   │   ├── env.ts        # Environment variables
│   │   ├── queryClient.ts # React Query configuration
│   │   └── index.ts      # Config exports
│   ├── routes/           # Route definitions
│   │   └── index.tsx     # Router configuration
│   ├── services/         # API services
│   │   └── api.ts        # API service utilities
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Application entry point
│   ├── index.css         # Global styles
│   └── vite-env.d.ts     # TypeScript definitions
├── .env                  # Environment variables (local)
├── .env.example          # Environment variables template
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Setup

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
VITE_API_URL=http://localhost:3000/api
VITE_API_VERSION=v1
```

### Install Dependencies

```bash
npm install
```

## Development

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Configuration

### Axios

The axios instance is pre-configured with:
- Base URL from environment variables
- 30-second timeout
- Automatic JWT token injection from localStorage
- Response interceptors for error handling
- Automatic redirect to login on 401 errors

### React Query

The QueryClient is configured with:
- 5-minute stale time
- 10-minute cache time
- Automatic retry on failure
- Smart refetching behavior

### React Router

Routes are defined in `src/routes/index.tsx`:
- `/` - Redirects to projects
- `/login` - Login page (to be implemented)
- `/register` - Registration page (to be implemented)
- `/projects` - Projects list (to be implemented)
- `/dashboard/:projectId` - Risk dashboard (to be implemented)

## API Integration

Use the `apiService` for making API calls:

```typescript
import { apiService } from './services/api';

// GET request
const projects = await apiService.get('/projects');

// POST request
const newProject = await apiService.post('/projects', projectData);

// PUT request
const updated = await apiService.put(`/projects/${id}`, updates);

// DELETE request
await apiService.delete(`/projects/${id}`);
```

## Next Steps

The following components will be implemented in upcoming tasks:
- Authentication components (Login, Register, Password Reset)
- Project management components (List, Form)
- Risk dashboard components (Dashboard, Charts, Risk Cards)
- Historical tracking components
- Report generation components

## Code Quality

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Testing

Testing will be set up in later tasks.

```bash
npm run test
```

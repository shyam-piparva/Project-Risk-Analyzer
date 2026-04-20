# Project Structure

```
ai-project-risk-analyzer/
├── .kiro/
│   ├── specs/                    # Feature specifications
│   │   └── ai-project-risk-analyzer/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   └── steering/                 # AI steering documents (always included in context)
│       ├── product.md
│       ├── structure.md
│       └── tech.md
├── .vscode/
│   └── settings.json
├── backend/                      # Backend API workspace
│   ├── src/
│   │   ├── index.ts             # Application entry point
│   │   └── utils/
│   │       └── logger.ts        # Winston logger configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── Dockerfile
│   └── .env.example
├── frontend/                     # Frontend React app workspace
│   ├── src/
│   │   ├── main.tsx             # Application entry point
│   │   ├── App.tsx              # Root component
│   │   └── index.css            # Global styles with Tailwind
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml            # Docker services (PostgreSQL, Redis, backend, frontend)
├── package.json                  # Root workspace configuration
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── .gitignore
└── README.md
```

## Workspace Organization

This is a **monorepo** using npm workspaces with two main packages:

- **backend**: Node.js/Express API with TypeScript
- **frontend**: React application with Vite and TypeScript

## Key Directories

- `backend/src/` - Backend source code (services, controllers, models, utils)
- `frontend/src/` - Frontend source code (components, pages, hooks, utils)
- `.kiro/specs/` - Feature specifications with requirements, design, and tasks
- `.kiro/steering/` - Project-wide steering documents for AI context

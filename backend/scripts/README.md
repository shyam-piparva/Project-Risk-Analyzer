# Database Scripts

This directory contains scripts for database management, migrations, and seeding.

## Available Scripts

### Migrations

Run database migrations to set up the schema:

```bash
# Run all pending migrations
npm run migrate

# Rollback last migration
npm run migrate:down

# Create a new migration
npm run migrate:create <migration-name>

# Redo last migration (down then up)
npm run migrate:redo

# Run migrations using TypeScript script
npm run migrate:script
```

### Seeding

Populate the database with sample data for development and testing:

```bash
# Seed all data (users, projects, risk analyses)
npm run seed

# Seed only users
npm run seed:users

# Seed users and projects
npm run seed:projects

# Seed users, projects, and risk analyses
npm run seed:risks

# Clean all seeded data
npm run seed:clean
```

## Seeded Data

### Users

The seeding script creates 5 sample users:

| Email | Password | Name |
|-------|----------|------|
| john.doe@example.com | Password123! | John Doe |
| jane.smith@example.com | Password123! | Jane Smith |
| bob.wilson@example.com | Password123! | Bob Wilson |
| alice.johnson@example.com | Password123! | Alice Johnson |
| demo@example.com | Demo123! | Demo User |

**Recommended for testing:** Use `demo@example.com` / `Demo123!`

### Projects

The script creates 5 diverse sample projects:

1. **E-Commerce Platform Redesign** - Large-scale redesign project
2. **Mobile Banking App** - High-security mobile application
3. **AI Chatbot Integration** - ML/AI integration project
4. **Legacy System Migration** - Complex migration project
5. **Startup MVP Development** - Fast-paced startup project

Each project includes:
- Realistic timelines and budgets
- Team composition with roles and experience levels
- Technology stack with maturity levels
- Detailed scope descriptions

### Risk Analyses

For each project, the script creates:
- 1 risk analysis with overall score
- 5 risks across different categories (Technical, Resource, Schedule, Budget, External)
- 1-2 mitigation strategies per risk

Risk categories include:
- **Technical**: Technology maturity, integration complexity
- **Resource**: Team experience, skill gaps
- **Schedule**: Timeline compression, dependencies
- **Budget**: Cost overruns, resource constraints
- **External**: Third-party dependencies, market changes

## Usage Examples

### Initial Setup

After setting up the database, run migrations and seed data:

```bash
# Run migrations
npm run migrate

# Seed sample data
npm run seed
```

### Development Workflow

When developing new features:

```bash
# Clean existing data
npm run seed:clean

# Seed fresh data
npm run seed
```

### Testing Specific Features

Seed only what you need:

```bash
# Test user authentication
npm run seed:users

# Test project management
npm run seed:projects

# Test risk analysis
npm run seed:risks
```

### Resetting Database

To completely reset the database:

```bash
# Clean seeded data
npm run seed:clean

# Rollback all migrations
npm run migrate:down

# Run migrations again
npm run migrate

# Seed fresh data
npm run seed
```

## Customizing Seed Data

To customize the seeded data, edit `seed-database.ts`:

1. **Add more users**: Modify the `SAMPLE_USERS` array
2. **Add more projects**: Modify the `SAMPLE_PROJECTS` array
3. **Add more risks**: Modify the `SAMPLE_RISKS` array
4. **Add more mitigations**: Modify the `SAMPLE_MITIGATIONS` array

## Important Notes

- Seeding is **idempotent** for users - existing users won't be duplicated
- Projects and risk analyses are **always created fresh**
- Use `seed:clean` before re-seeding to avoid duplicates
- Seeded data is for **development only** - never use in production
- All seeded users have `is_verified = true` for convenience

## Troubleshooting

### "User already exists" errors

This is normal - the script skips existing users. Use `seed:clean` to remove them first.

### "No users found" when seeding projects

Make sure to run `seed:users` first, or use `npm run seed` to seed everything.

### Database connection errors

Check your `.env` file and ensure:
- Database is running
- Connection credentials are correct
- Database name exists

### Permission errors

Ensure your database user has permissions to:
- INSERT data
- DELETE data (for cleaning)
- SELECT data (for checking existing records)

## Script Architecture

The seeding script is organized into modular functions:

- `seedUsers()` - Creates sample users with hashed passwords
- `seedProjects()` - Creates projects distributed among users
- `seedRiskAnalyses()` - Creates risk analyses with risks and mitigations
- `cleanDatabase()` - Removes all seeded data
- `seedAll()` - Orchestrates the complete seeding process

Each function:
- Handles errors gracefully
- Provides progress feedback
- Returns IDs for dependent data
- Logs success/failure for each operation

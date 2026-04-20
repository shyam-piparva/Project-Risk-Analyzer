# Environment Configuration Guide

This document describes all environment variables used in the AI Project Risk Analyzer and how to configure them for different environments.

## Quick Start

### Local Development

1. Copy the example environment files:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Update the values in each `.env` file as needed

3. Start the services:
```bash
docker-compose up
```

### Using Environment-Specific Files

The project includes pre-configured environment files for different stages:

- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

To use a specific environment:

```bash
# Backend
cp backend/.env.development backend/.env

# Frontend
cp frontend/.env.development frontend/.env
```

## Environment Variables Reference

### Backend Environment Variables

#### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `PORT` | Server port | `3000` | Yes |
| `API_VERSION` | API version | `v1` | Yes |

#### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL host | `localhost` | Yes |
| `DB_PORT` | PostgreSQL port | `5432` | Yes |
| `DB_NAME` | Database name | `risk_analyzer` | Yes |
| `DB_USER` | Database user | `postgres` | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `DB_SSL` | Enable SSL | `false` | No |
| `DB_POOL_MIN` | Min pool connections | `2` | No |
| `DB_POOL_MAX` | Max pool connections | `10` | No |

#### JWT Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT | - | Yes |
| `JWT_EXPIRES_IN` | Token expiration | `24h` | Yes |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` | Yes |

**Important:** Generate a strong JWT secret for production:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Redis Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_HOST` | Redis host | `localhost` | Yes |
| `REDIS_PORT` | Redis port | `6379` | Yes |
| `REDIS_PASSWORD` | Redis password | - | No |
| `REDIS_DB` | Redis database number | `0` | No |

#### Email Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EMAIL_HOST` | SMTP host | - | Yes |
| `EMAIL_PORT` | SMTP port | `587` | Yes |
| `EMAIL_SECURE` | Use TLS | `false` | No |
| `EMAIL_USER` | SMTP username | - | Yes |
| `EMAIL_PASSWORD` | SMTP password | - | Yes |
| `EMAIL_FROM` | From address | - | Yes |

#### Rate Limiting

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_WINDOW_MS` | Time window (ms) | `60000` | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |

#### Logging

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Log level | `info` | No |
| `LOG_FILE` | Log file path | `logs/app.log` | No |
| `LOG_ERROR_FILE` | Error log file path | `logs/error.log` | No |

**Log Levels:** `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`

#### CORS

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGIN` | Allowed origins | - | Yes |

For multiple origins, use comma-separated values:
```
CORS_ORIGIN=http://localhost:5173,https://app.example.com
```

#### Risk Engine

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RISK_ENGINE_URL` | Risk engine endpoint | `http://localhost:5001` | Yes |

#### Storage

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `STORAGE_PATH` | Storage directory | `./storage` | No |
| `STORAGE_MAX_SIZE_MB` | Max storage size | `100` | No |

#### Performance

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REQUEST_TIMEOUT_MS` | Request timeout | `30000` | No |
| `CACHE_TTL_SECONDS` | Cache TTL | `300` | No |

### Frontend Environment Variables

All frontend environment variables must be prefixed with `VITE_` to be exposed to the client.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000/api` | Yes |
| `VITE_API_VERSION` | API version | `v1` | Yes |
| `VITE_API_TIMEOUT` | API timeout (ms) | `30000` | No |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | `false` | No |
| `VITE_ENABLE_ERROR_REPORTING` | Enable error reporting | `false` | No |
| `VITE_APP_NAME` | Application name | `AI Project Risk Analyzer` | No |
| `VITE_APP_VERSION` | Application version | `1.0.0` | No |
| `VITE_ENV` | Environment | `development` | No |

### Docker Compose Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BUILD_TARGET` | Docker build target | `development` | No |
| `NODE_ENV` | Environment | `development` | No |
| `DB_NAME` | Database name | `risk_analyzer` | Yes |
| `DB_USER` | Database user | `postgres` | Yes |
| `DB_PASSWORD` | Database password | `postgres` | Yes |
| `DB_PORT` | Database port | `5432` | No |
| `REDIS_PORT` | Redis port | `6379` | No |
| `REDIS_PASSWORD` | Redis password | - | No |
| `BACKEND_PORT` | Backend port | `3000` | No |
| `FRONTEND_PORT` | Frontend port | `5173` | No |
| `RISK_ENGINE_PORT` | Risk engine port | `5001` | No |

## Environment-Specific Configuration

### Development

**Characteristics:**
- Verbose logging (debug level)
- Lenient rate limiting
- Local database and Redis
- Hot reloading enabled
- Source maps enabled

**Setup:**
```bash
cp backend/.env.development backend/.env
cp frontend/.env.development frontend/.env
docker-compose up
```

### Staging

**Characteristics:**
- Moderate logging (info level)
- Moderate rate limiting
- Cloud database and Redis
- SSL enabled
- Similar to production

**Setup:**
```bash
cp backend/.env.staging backend/.env
cp frontend/.env.staging frontend/.env
docker-compose -f docker-compose.prod.yml up
```

### Production

**Characteristics:**
- Minimal logging (warn level)
- Strict rate limiting
- Cloud database and Redis with SSL
- Optimized builds
- Security hardened

**Setup:**
```bash
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env
docker-compose -f docker-compose.prod.yml up -d
```

**Important Production Checklist:**
- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Update all `CHANGE_ME` values
- [ ] Enable SSL for database (`DB_SSL=true`)
- [ ] Set strong passwords for database and Redis
- [ ] Configure email service credentials
- [ ] Update CORS origin to production domain
- [ ] Set appropriate rate limits
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerting

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong passwords** - Especially for production databases
3. **Rotate secrets regularly** - JWT secrets, API keys, passwords
4. **Use environment-specific secrets** - Don't reuse dev secrets in production
5. **Limit CORS origins** - Only allow trusted domains
6. **Enable SSL/TLS** - For database and Redis in production
7. **Use secret management** - Consider AWS Secrets Manager, HashiCorp Vault, etc.

## Troubleshooting

### Backend won't start

Check:
- Database connection (host, port, credentials)
- Redis connection
- JWT_SECRET is set
- All required variables are present

### Frontend can't connect to backend

Check:
- `VITE_API_URL` matches backend URL
- CORS is configured correctly in backend
- Backend is running and accessible

### Docker services won't start

Check:
- `.env` file exists in root directory
- Port conflicts (3000, 5173, 5432, 6379)
- Docker daemon is running
- Sufficient disk space for volumes

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

# Deployment Guide

This guide covers deploying the AI Project Risk Analyzer in different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** 18+ and npm 9+
- **Docker** and Docker Compose (for containerized deployment)
- **PostgreSQL** 14+ (if not using Docker)
- **Redis** 7+ (if not using Docker)
- **Python** 3.9+ (for risk engine)

### System Requirements

**Development:**
- 4GB RAM minimum
- 10GB disk space

**Production:**
- 8GB RAM minimum
- 50GB disk space
- SSL certificates

## Local Development

### Quick Start

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
# Root directory
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

4. **Start services with Docker**
```bash
docker-compose up
```

5. **Run migrations**
```bash
cd backend
npm run migrate
```

6. **Seed sample data**
```bash
npm run seed
```

7. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Risk Engine: http://localhost:5001

### Development Without Docker

If you prefer to run services locally without Docker:

1. **Start PostgreSQL**
```bash
# Using Homebrew (macOS)
brew services start postgresql@14

# Using apt (Ubuntu/Debian)
sudo systemctl start postgresql
```

2. **Start Redis**
```bash
# Using Homebrew (macOS)
brew services start redis

# Using apt (Ubuntu/Debian)
sudo systemctl start redis
```

3. **Create database**
```bash
createdb risk_analyzer
```

4. **Start backend**
```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

5. **Start frontend**
```bash
cd frontend
npm install
npm run dev
```

6. **Start risk engine**
```bash
cd risk-engine
pip install -r requirements.txt
python src/app.py
```

## Docker Deployment

### Development Mode

Use the default `docker-compose.yml` for development:

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Production Mode

Use `docker-compose.prod.yml` for production:

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Building Individual Services

```bash
# Build backend
docker build -t risk-analyzer-backend:latest ./backend

# Build frontend
docker build -t risk-analyzer-frontend:latest ./frontend

# Build risk engine
docker build -t risk-analyzer-engine:latest ./risk-engine
```

### Multi-Stage Builds

The Dockerfiles use multi-stage builds for optimization:

**Development target:**
```bash
docker build --target development -t risk-analyzer-backend:dev ./backend
```

**Production target:**
```bash
docker build --target production -t risk-analyzer-backend:prod ./backend
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update all environment variables in `.env.production`
- [ ] Generate strong JWT secret
- [ ] Configure production database with SSL
- [ ] Set up Redis with password
- [ ] Configure email service (SendGrid, AWS SES, etc.)
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

### Cloud Deployment Options

#### AWS

**Using ECS (Elastic Container Service):**

1. Push images to ECR
```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push images
docker tag risk-analyzer-backend:prod <account-id>.dkr.ecr.us-east-1.amazonaws.com/risk-analyzer-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/risk-analyzer-backend:latest
```

2. Create ECS task definitions
3. Set up RDS for PostgreSQL
4. Set up ElastiCache for Redis
5. Configure Application Load Balancer
6. Set up CloudWatch for logging

**Using Elastic Beanstalk:**

1. Install EB CLI
```bash
pip install awsebcli
```

2. Initialize Elastic Beanstalk
```bash
eb init -p docker risk-analyzer
```

3. Create environment
```bash
eb create production-env
```

4. Deploy
```bash
eb deploy
```

#### Google Cloud Platform

**Using Cloud Run:**

1. Build and push to Container Registry
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/risk-analyzer-backend
```

2. Deploy to Cloud Run
```bash
gcloud run deploy risk-analyzer-backend \
  --image gcr.io/PROJECT_ID/risk-analyzer-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

3. Set up Cloud SQL for PostgreSQL
4. Set up Memorystore for Redis

#### Azure

**Using Azure Container Instances:**

1. Create resource group
```bash
az group create --name risk-analyzer-rg --location eastus
```

2. Create container registry
```bash
az acr create --resource-group risk-analyzer-rg --name riskanalyzerregistry --sku Basic
```

3. Push images
```bash
az acr build --registry riskanalyzerregistry --image risk-analyzer-backend:latest ./backend
```

4. Deploy containers
```bash
az container create \
  --resource-group risk-analyzer-rg \
  --name risk-analyzer-backend \
  --image riskanalyzerregistry.azurecr.io/risk-analyzer-backend:latest \
  --dns-name-label risk-analyzer \
  --ports 3000
```

#### DigitalOcean

**Using App Platform:**

1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy

**Using Droplets:**

1. Create droplet with Docker
2. SSH into droplet
3. Clone repository
4. Run docker-compose

### Kubernetes Deployment

Create Kubernetes manifests:

**backend-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: risk-analyzer-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: risk-analyzer-backend
  template:
    metadata:
      labels:
        app: risk-analyzer-backend
    spec:
      containers:
      - name: backend
        image: risk-analyzer-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
```

Deploy:
```bash
kubectl apply -f k8s/
```

## Environment Configuration

See [ENV_CONFIGURATION.md](ENV_CONFIGURATION.md) for detailed environment variable documentation.

### Quick Reference

**Development:**
```bash
cp backend/.env.development backend/.env
cp frontend/.env.development frontend/.env
```

**Staging:**
```bash
cp backend/.env.staging backend/.env
cp frontend/.env.staging frontend/.env
```

**Production:**
```bash
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env
# Update all CHANGE_ME values!
```

## Database Setup

### Running Migrations

```bash
cd backend

# Run all migrations
npm run migrate

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create <name>
```

### Seeding Data

```bash
# Seed all sample data
npm run seed

# Seed only users
npm run seed:users

# Clean seeded data
npm run seed:clean
```

### Database Backups

**PostgreSQL backup:**
```bash
# Backup
pg_dump -U postgres risk_analyzer > backup.sql

# Restore
psql -U postgres risk_analyzer < backup.sql
```

**Docker backup:**
```bash
# Backup
docker exec risk-analyzer-db pg_dump -U postgres risk_analyzer > backup.sql

# Restore
docker exec -i risk-analyzer-db psql -U postgres risk_analyzer < backup.sql
```

## Monitoring and Logging

### Application Logs

**Docker logs:**
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

**Log files:**
- Backend: `backend/logs/app.log`
- Backend errors: `backend/logs/error.log`

### Health Checks

**Backend:**
```bash
curl http://localhost:3000/health
```

**Frontend:**
```bash
curl http://localhost:5173/health
```

**Risk Engine:**
```bash
curl http://localhost:5001/health
```

### Monitoring Tools

Recommended monitoring solutions:
- **Application Performance**: New Relic, Datadog, AppDynamics
- **Infrastructure**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Error Tracking**: Sentry, Rollbar

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using a port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Database connection errors:**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

**Frontend can't connect to backend:**
- Check `VITE_API_URL` in frontend `.env`
- Check CORS configuration in backend
- Verify backend is running: `curl http://localhost:3000/health`

**Docker build failures:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

**Migration errors:**
```bash
# Check migration status
npm run migrate -- status

# Rollback and retry
npm run migrate:down
npm run migrate
```

### Getting Help

- Check logs: `docker-compose logs -f`
- Review environment variables
- Verify database connectivity
- Check network configuration
- Review error messages in browser console

## Security Best Practices

1. **Never commit `.env` files** with real credentials
2. **Use strong passwords** for all services
3. **Enable SSL/TLS** in production
4. **Rotate secrets regularly** (JWT, API keys, passwords)
5. **Use environment-specific secrets** (don't reuse dev secrets)
6. **Implement rate limiting** to prevent abuse
7. **Keep dependencies updated** for security patches
8. **Use security headers** (CSP, HSTS, etc.)
9. **Enable database SSL** in production
10. **Implement proper CORS** configuration

## Performance Optimization

1. **Enable caching** with Redis
2. **Use CDN** for static assets
3. **Optimize database queries** with indexes
4. **Enable gzip compression**
5. **Use connection pooling** for database
6. **Implement horizontal scaling** with load balancer
7. **Monitor and optimize** slow queries
8. **Use production builds** (minified, optimized)

## Backup and Recovery

### Automated Backups

Set up automated backups for:
- Database (daily)
- User uploads (if any)
- Configuration files

### Disaster Recovery Plan

1. Document recovery procedures
2. Test backups regularly
3. Maintain off-site backups
4. Document RTO (Recovery Time Objective)
5. Document RPO (Recovery Point Objective)

## Additional Resources

- [Environment Configuration Guide](ENV_CONFIGURATION.md)
- [Database Scripts README](backend/scripts/README.md)
- [API Documentation](backend/docs/)
- [Frontend Documentation](frontend/README.md)

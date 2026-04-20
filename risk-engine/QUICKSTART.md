# Risk Analysis Engine - Quick Start Guide

## Installation & Setup

### Option 1: Local Development (Recommended for testing)

1. **Prerequisites:**
   - Python 3.11 or higher
   - pip package manager

2. **Install dependencies:**
```bash
cd risk-engine
pip install -r requirements.txt
```

3. **Run the server:**
```bash
python src/app.py
```

The server will start on `http://localhost:5001`

### Option 2: Docker

1. **Build and run with Docker Compose (from project root):**
```bash
docker-compose up risk-engine
```

2. **Or build standalone:**
```bash
cd risk-engine
docker build -t risk-engine .
docker run -p 5001:5001 risk-engine
```

## Testing the Engine

### 1. Health Check

```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "risk-analysis-engine",
  "version": "1.0.0"
}
```

### 2. Analyze a Sample Project

```bash
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "project": {
      "id": "test-123",
      "name": "Sample Project",
      "start_date": "2024-01-01",
      "end_date": "2024-02-01",
      "budget": 20000,
      "team_size": 5,
      "team_composition": [
        {
          "role": "Developer",
          "count": 4,
          "experience_level": "Junior"
        },
        {
          "role": "Designer",
          "count": 1,
          "experience_level": "Mid"
        }
      ],
      "technology_stack": [
        {
          "name": "React",
          "category": "Frontend",
          "maturity": "Stable"
        },
        {
          "name": "NewFramework",
          "category": "Backend",
          "maturity": "Experimental"
        }
      ]
    }
  }'
```

This should detect multiple risks:
- Timeline Compression (1 month for 5 people)
- Budget Constraint ($4,000/person/month)
- Team Experience Gap (80% junior, no senior)
- Technology Maturity (experimental backend)

## Running Tests

```bash
cd risk-engine
pytest tests/ -v
```

With coverage:
```bash
pytest tests/ --cov=src --cov-report=html
```

## Integration with Backend

Add to `backend/.env`:
```
RISK_ENGINE_URL=http://localhost:5001
```

Or in Docker:
```
RISK_ENGINE_URL=http://risk-engine:5001
```

## Common Issues

### Port Already in Use
If port 5001 is taken, change it in `.env`:
```
PORT=5002
```

### Module Import Errors
Make sure you're running from the `risk-engine` directory or add it to PYTHONPATH:
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Docker Build Fails
Ensure you have the latest Docker version and sufficient disk space.

## Next Steps

1. Run the unit tests to verify installation
2. Test the API with sample projects
3. Integrate with the TypeScript backend (see `backend/src/services/riskAnalysisService.example.ts`)
4. Proceed to task 9: Risk Analysis Service implementation

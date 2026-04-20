# Risk Analysis Engine (Python)

A robust, rule-based risk analysis engine built with Python and Flask. This microservice analyzes project parameters to identify potential risks and generate actionable mitigation strategies.

## Features

- **Strong Type Safety**: Uses Pydantic for comprehensive data validation
- **Rule-Based Analysis**: Implements proven risk detection algorithms
- **Comprehensive Risk Categories**: Technical, Resource, Schedule, Budget, External
- **Intelligent Scoring**: Probability × Impact weighted scoring (0-100 scale)
- **Actionable Mitigations**: Priority-ranked mitigation strategies
- **RESTful API**: Clean HTTP interface for easy integration
- **Production Ready**: Includes Docker support and Gunicorn configuration

## Architecture

```
risk-engine/
├── src/
│   ├── models.py              # Pydantic data models with validation
│   ├── scoring.py             # Risk scoring algorithms
│   ├── risk_rules.py          # Rule-based risk detection
│   ├── mitigation_generator.py # Mitigation strategy generation
│   ├── engine.py              # Main orchestrator
│   └── app.py                 # Flask REST API
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Container configuration
└── .env.example              # Environment variables template
```

## Risk Detection Rules

### 1. Timeline Compression Risk
- **Trigger**: Projects < 3 months or < 7 days per team member
- **Category**: Schedule
- **Factors**: Duration, team size, time allocation

### 2. Budget Constraint Risk
- **Trigger**: Budget < $8,000 per person per month
- **Category**: Budget
- **Factors**: Total budget, team size, project duration

### 3. Team Experience Gap Risk
- **Trigger**: >50% junior members or no senior leadership
- **Category**: Resource
- **Factors**: Experience levels, team composition

### 4. Technology Maturity Risk
- **Trigger**: Experimental or emerging technologies
- **Category**: Technical
- **Factors**: Technology maturity levels, stack composition

## API Endpoints

### POST /api/analyze
Analyze a project for risks.

**Request:**
```json
{
  "project": {
    "id": "uuid",
    "name": "Project Name",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "budget": 100000,
    "team_size": 5,
    "team_composition": [
      {
        "role": "Developer",
        "count": 3,
        "experience_level": "Junior"
      }
    ],
    "technology_stack": [
      {
        "name": "React",
        "category": "Frontend",
        "maturity": "Stable"
      }
    ]
  }
}
```

**Response:**
```json
{
  "project_id": "uuid",
  "overall_score": 65.5,
  "risks": [
    {
      "title": "Team Experience Gap Risk",
      "description": "...",
      "category": "Resource",
      "score": 70.0,
      "probability": 0.7,
      "impact": 0.7,
      "mitigations": [
        {
          "strategy": "Hire senior developers...",
          "priority": "High",
          "estimated_effort": "3-6 weeks"
        }
      ]
    }
  ],
  "metadata": {
    "model_version": "rule-based-v1",
    "engine_version": "1.0.0",
    "processing_time": 45,
    "data_completeness": 90.0,
    "risks_detected": 3
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "risk-analysis-engine",
  "version": "1.0.0"
}
```

## Installation

### Local Development

1. **Install Python 3.11+**

2. **Install dependencies:**
```bash
cd risk-engine
pip install -r requirements.txt
```

3. **Set up environment:**
```bash
cp .env.example .env
# Edit .env as needed
```

4. **Run the server:**
```bash
python src/app.py
```

The server will start on `http://localhost:5001`

### Docker

1. **Build the image:**
```bash
docker build -t risk-analysis-engine .
```

2. **Run the container:**
```bash
docker run -p 5001:5001 risk-analysis-engine
```

## Integration with Backend

The Node.js/Express backend can call this service via HTTP:

```typescript
// backend/src/services/riskAnalysisService.ts
import axios from 'axios';

const RISK_ENGINE_URL = process.env.RISK_ENGINE_URL || 'http://localhost:5001';

export async function analyzeProject(project: Project): Promise<RiskAnalysis> {
  const response = await axios.post(`${RISK_ENGINE_URL}/api/analyze`, {
    project: {
      id: project.id,
      name: project.name,
      start_date: project.startDate,
      end_date: project.endDate,
      budget: project.budget,
      team_size: project.teamSize,
      team_composition: project.teamComposition,
      technology_stack: project.technologyStack,
      scope: project.scope
    }
  });
  
  return response.data;
}
```

## Testing

Run unit tests:
```bash
pytest tests/ -v
```

Run with coverage:
```bash
pytest tests/ --cov=src --cov-report=html
```

## Scoring Algorithm

The risk score is calculated using a weighted formula:

```
Risk_Score = (Probability × 0.5 + Impact × 0.5) × 100
```

Where:
- **Probability**: Likelihood of risk occurring (0.0 - 1.0)
- **Impact**: Severity if risk occurs (0.0 - 1.0)
- **Score**: Final risk score (0 - 100)

Severity levels:
- **High**: 70-100 (Critical risks)
- **Medium**: 40-69 (Significant risks)
- **Low**: 0-39 (Minor risks)

## Requirements Validation

This implementation validates:
- **Requirement 3.1**: AI-powered risk analysis
- **Requirement 3.3**: Risk scoring (0-100)
- **Requirement 3.4**: Risk categorization
- **Requirement 3.6**: Multiple risk factors considered
- **Requirement 4.3**: Severity levels
- **Requirement 5.1**: Mitigation generation
- **Requirement 5.6**: Mitigation prioritization

## Future Enhancements

- Machine learning models for pattern recognition
- Historical data analysis
- Custom rule configuration
- Real-time risk monitoring
- Integration with project management tools

## License

Part of the AI Project Risk Analyzer system.

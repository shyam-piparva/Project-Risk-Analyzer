# End-to-End Test Flow

## Prerequisites
1. PostgreSQL database running (via Docker Compose or local)
2. Backend server running on port 3000
3. Risk engine running on port 5001 (optional for full flow)

## Test Flow: Register → Create Project → Analyze → Generate Report

### Step 1: User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "<uuid>",
    "email": "testuser@example.com",
    "name": "Test User",
    "isVerified": false
  },
  "tokens": {
    "accessToken": "<jwt_token>",
    "refreshToken": "<jwt_token>"
  }
}
```

**Save the accessToken for subsequent requests**

### Step 2: User Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "<uuid>",
    "email": "testuser@example.com",
    "name": "Test User"
  },
  "tokens": {
    "accessToken": "<jwt_token>",
    "refreshToken": "<jwt_token>"
  }
}
```

### Step 3: Create Project

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "name": "E-Commerce Platform",
    "description": "Building a new e-commerce platform with React and Node.js",
    "startDate": "2024-01-01",
    "endDate": "2024-03-31",
    "budget": 50000,
    "teamSize": 8,
    "teamComposition": [
      {
        "role": "Developer",
        "count": 5,
        "experienceLevel": "Mid"
      },
      {
        "role": "Designer",
        "count": 2,
        "experienceLevel": "Senior"
      },
      {
        "role": "QA Engineer",
        "count": 1,
        "experienceLevel": "Junior"
      }
    ],
    "technologyStack": [
      {
        "name": "React",
        "category": "Frontend",
        "maturity": "Stable"
      },
      {
        "name": "Node.js",
        "category": "Backend",
        "maturity": "Stable"
      },
      {
        "name": "PostgreSQL",
        "category": "Database",
        "maturity": "Stable"
      }
    ],
    "scope": "Full-featured e-commerce platform with user authentication, product catalog, shopping cart, and payment integration"
  }'
```

**Expected Response:**
```json
{
  "id": "<project_uuid>",
  "userId": "<user_uuid>",
  "name": "E-Commerce Platform",
  "description": "Building a new e-commerce platform with React and Node.js",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-03-31T00:00:00.000Z",
  "budget": 50000,
  "teamSize": 8,
  "teamComposition": [...],
  "technologyStack": [...],
  "scope": "Full-featured e-commerce platform...",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Save the project ID for subsequent requests**

### Step 4: Get All Projects

```bash
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer <accessToken>"
```

**Expected Response:**
```json
[
  {
    "id": "<project_uuid>",
    "name": "E-Commerce Platform",
    "description": "Building a new e-commerce platform...",
    ...
  }
]
```

### Step 5: Get Single Project

```bash
curl -X GET http://localhost:3000/api/projects/<project_id> \
  -H "Authorization: Bearer <accessToken>"
```

**Expected Response:**
```json
{
  "id": "<project_uuid>",
  "name": "E-Commerce Platform",
  ...
}
```

### Step 6: Update Project

```bash
curl -X PUT http://localhost:3000/api/projects/<project_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "budget": 60000,
    "description": "Updated: Building a new e-commerce platform with enhanced features"
  }'
```

**Expected Response:**
```json
{
  "id": "<project_uuid>",
  "budget": 60000,
  "description": "Updated: Building a new e-commerce platform with enhanced features",
  "updatedAt": "<new_timestamp>",
  ...
}
```

### Step 7: Analyze Project (Requires Risk Engine)

**Note:** This step requires the risk engine to be running on port 5001

```bash
curl -X POST http://localhost:3000/api/projects/<project_id>/analyze \
  -H "Authorization: Bearer <accessToken>"
```

**Expected Response:**
```json
{
  "id": "<analysis_uuid>",
  "projectId": "<project_uuid>",
  "overallScore": 45.5,
  "analyzedAt": "2024-01-15T10:35:00.000Z",
  "risks": [
    {
      "id": "<risk_uuid>",
      "title": "Timeline Compression Risk",
      "description": "Project timeline may be too aggressive...",
      "category": "Schedule",
      "score": 65.0,
      "probability": 0.7,
      "impact": 0.6,
      "status": "Open",
      "mitigations": [
        {
          "id": "<mitigation_uuid>",
          "strategy": "Add buffer time to critical path tasks",
          "priority": "High",
          "estimatedEffort": "1 week",
          "isImplemented": false
        }
      ]
    },
    ...
  ],
  "metadata": {
    "modelVersion": "1.0.0",
    "engineVersion": "1.0.0",
    "processingTime": 250,
    "dataCompleteness": 100
  }
}
```

### Step 8: Get Latest Risk Analysis

```bash
curl -X GET http://localhost:3000/api/projects/<project_id>/risks \
  -H "Authorization: Bearer <accessToken>"
```

**Expected Response:**
```json
{
  "id": "<analysis_uuid>",
  "projectId": "<project_uuid>",
  "overallScore": 45.5,
  "risks": [...],
  ...
}
```

### Step 9: Add Custom Mitigation

```bash
curl -X POST http://localhost:3000/api/risks/<risk_id>/mitigations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "strategy": "Hire additional senior developer to mentor team",
    "priority": "High",
    "estimatedEffort": "2 weeks"
  }'
```

**Expected Response:**
```json
{
  "id": "<mitigation_uuid>",
  "riskId": "<risk_uuid>",
  "strategy": "Hire additional senior developer to mentor team",
  "priority": "High",
  "estimatedEffort": "2 weeks",
  "isImplemented": false,
  "isCustom": true,
  "createdAt": "2024-01-15T10:40:00.000Z"
}
```

### Step 10: Mark Mitigation as Implemented

```bash
curl -X PUT http://localhost:3000/api/mitigations/<mitigation_id>/implement \
  -H "Authorization: Bearer <accessToken>"
```

**Expected Response:**
```json
{
  "id": "<mitigation_uuid>",
  "isImplemented": true,
  "implementedAt": "2024-01-15T10:45:00.000Z",
  ...
}
```

### Step 11: Update Risk Status

```bash
curl -X PUT http://localhost:3000/api/risks/<risk_id>/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "status": "Mitigated"
  }'
```

**Expected Response:**
```json
{
  "id": "<risk_uuid>",
  "status": "Mitigated",
  ...
}
```

### Step 12: Get Risk Analysis History

```bash
curl -X GET http://localhost:3000/api/projects/<project_id>/risks/history \
  -H "Authorization: Bearer <accessToken>"
```

**Expected Response:**
```json
[
  {
    "id": "<analysis_uuid_1>",
    "projectId": "<project_uuid>",
    "overallScore": 45.5,
    "analyzedAt": "2024-01-15T10:35:00.000Z",
    ...
  },
  {
    "id": "<analysis_uuid_2>",
    "projectId": "<project_uuid>",
    "overallScore": 38.2,
    "analyzedAt": "2024-01-15T11:00:00.000Z",
    ...
  }
]
```

### Step 13: Generate PDF Report (Not Yet Implemented)

```bash
curl -X POST http://localhost:3000/api/projects/<project_id>/reports/pdf \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "includeSummary": true,
    "includeDetailedRisks": true,
    "includeCharts": true,
    "includeMitigations": true,
    "includeHistory": false
  }'
```

**Expected Response (when implemented):**
```json
{
  "reportId": "<report_uuid>",
  "downloadUrl": "/api/reports/<report_uuid>/download",
  "generatedAt": "2024-01-15T11:05:00.000Z"
}
```

### Step 14: Delete Project

```bash
curl -X DELETE http://localhost:3000/api/projects/<project_id> \
  -H "Authorization: Bearer <accessToken>"
```

**Expected Response:**
```json
{
  "message": "Project deleted successfully"
}
```

## Testing Error Scenarios

### Invalid Authentication

```bash
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer invalid_token"
```

**Expected Response:** 401 Unauthorized
```json
{
  "error": "AuthenticationError",
  "message": "Invalid or expired token"
}
```

### Invalid Project Data

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "name": "Test Project",
    "startDate": "2024-03-31",
    "endDate": "2024-01-01",
    "budget": -1000
  }'
```

**Expected Response:** 400 Bad Request
```json
{
  "error": "ValidationError",
  "message": "End date must be after start date",
  "field": "endDate"
}
```

### Accessing Another User's Project

```bash
# Login as different user and try to access first user's project
curl -X GET http://localhost:3000/api/projects/<other_user_project_id> \
  -H "Authorization: Bearer <different_user_token>"
```

**Expected Response:** 403 Forbidden
```json
{
  "error": "AuthorizationError",
  "message": "You do not have permission to access this project"
}
```

## Automated Test Script

Save this as `test-e2e.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo "Starting E2E Test Flow..."

# Step 1: Register
echo -e "\n${GREEN}Step 1: Registering user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "e2etest@example.com",
    "password": "SecurePass123!",
    "name": "E2E Test User"
  }')

ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
echo "Access Token: ${ACCESS_TOKEN:0:20}..."

# Step 2: Create Project
echo -e "\n${GREEN}Step 2: Creating project...${NC}"
PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "E2E Test Project",
    "description": "Test project for E2E flow",
    "startDate": "2024-01-01",
    "endDate": "2024-03-31",
    "budget": 50000,
    "teamSize": 5,
    "teamComposition": [{"role": "Developer", "count": 5, "experienceLevel": "Mid"}],
    "technologyStack": [{"name": "React", "category": "Frontend", "maturity": "Stable"}],
    "scope": "Test scope"
  }')

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.id')
echo "Project ID: $PROJECT_ID"

# Step 3: Get Projects
echo -e "\n${GREEN}Step 3: Getting all projects...${NC}"
curl -s -X GET $BASE_URL/api/projects \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

# Step 4: Update Project
echo -e "\n${GREEN}Step 4: Updating project...${NC}"
curl -s -X PUT $BASE_URL/api/projects/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"budget": 60000}' | jq '.'

# Step 5: Delete Project
echo -e "\n${GREEN}Step 5: Deleting project...${NC}"
curl -s -X DELETE $BASE_URL/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

echo -e "\n${GREEN}E2E Test Flow Complete!${NC}"
```

Make executable:
```bash
chmod +x test-e2e.sh
./test-e2e.sh
```

## Status Summary

### ✅ Working Endpoints
- User registration and login
- Project CRUD operations
- JWT authentication
- Authorization checks
- Input validation

### ⚠️ Requires External Service
- Risk analysis (requires risk engine on port 5001)
- Risk management endpoints

### ❌ Not Yet Implemented
- Report generation (PDF/CSV)
- Historical comparison
- Rate limiting
- Caching


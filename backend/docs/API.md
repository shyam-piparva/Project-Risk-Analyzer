# API Documentation

## Overview

The AI Project Risk Analyzer API is a RESTful API that provides endpoints for user authentication, project management, risk analysis, and report generation. All endpoints accept and return JSON-formatted data.

**Base URL**: `http://localhost:3000/api` (development)

**API Version**: v1

## Authentication

Most endpoints require authentication using JWT (JSON Web Tokens). Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Lifecycle

- **Access Token Expiration**: 1 hour
- **Refresh Token Expiration**: 7 days
- Tokens must be refreshed before expiration using the `/api/auth/refresh` endpoint

## Common Response Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Request completed successfully |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |

## Error Response Format

All error responses follow this structure:

```json
{
  "error": "ErrorType",
  "message": "User-friendly error message",
  "details": {},
  "field": "fieldName",
  "requestId": "uuid",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Rate Limiting

- **Limit**: 100 requests per minute per user
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## Authentication Endpoints

### Register New User

Create a new user account.

**Endpoint**: `POST /api/auth/register`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Validation Rules**:
- `email`: Valid email format, unique
- `password`: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- `name`: Minimum 2 characters

**Success Response** (201):
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "isVerified": false
  },
  "message": "Registration successful. Please check your email for verification."
}
```

**Error Responses**:
- 400: Email already exists, invalid email format, weak password
- 500: Server error during registration

---

### Login User

Authenticate user and receive JWT tokens.

**Endpoint**: `POST /api/auth/login`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response** (200):
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Error Responses**:
- 400: Missing email or password
- 401: Invalid credentials
- 500: Server error during authentication

---

### Refresh Token

Get a new access token using a refresh token.

**Endpoint**: `POST /api/auth/refresh`

**Authentication**: Not required (uses refresh token)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Error Responses**:
- 400: Missing refresh token
- 401: Invalid or expired refresh token

---

### Forgot Password

Request a password reset link.

**Endpoint**: `POST /api/auth/forgot-password`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "message": "Password reset link sent to your email"
}
```

**Error Responses**:
- 400: Invalid email format
- 404: Email not found (returns 200 for security)

---

### Reset Password

Reset password using reset token.

**Endpoint**: `POST /api/auth/reset-password`

**Authentication**: Not required (uses reset token)

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response** (200):
```json
{
  "message": "Password reset successful"
}
```

**Error Responses**:
- 400: Invalid or expired token, weak password
- 500: Server error during password reset

---

### Verify Token

Verify if the current JWT token is valid.

**Endpoint**: `GET /api/auth/verify`

**Authentication**: Required

**Success Response** (200):
```json
{
  "valid": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses**:
- 401: Invalid or expired token

---

## Project Endpoints

### Create Project

Create a new project.

**Endpoint**: `POST /api/projects`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "E-commerce Platform",
  "description": "Build a scalable e-commerce platform",
  "startDate": "2024-02-01",
  "endDate": "2024-08-31",
  "budget": 250000,
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
      "role": "Project Manager",
      "count": 1,
      "experienceLevel": "Senior"
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
  "scope": "Full-featured e-commerce platform with payment integration"
}
```

**Validation Rules**:
- `name`: Minimum 2 characters after trimming
- `startDate`: Valid date format (YYYY-MM-DD)
- `endDate`: Must be after startDate
- `budget`: Positive number
- `teamSize`: Positive integer
- `teamComposition`: Array with at least one member
- `technologyStack`: Array with at least one technology

**Success Response** (201):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "E-commerce Platform",
  "description": "Build a scalable e-commerce platform",
  "startDate": "2024-02-01T00:00:00.000Z",
  "endDate": "2024-08-31T00:00:00.000Z",
  "budget": 250000,
  "teamSize": 8,
  "teamComposition": [...],
  "technologyStack": [...],
  "scope": "Full-featured e-commerce platform with payment integration",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:
- 400: Validation errors (invalid dates, negative budget, etc.)
- 401: Not authenticated
- 500: Server error

---

### Get All Projects

Retrieve all projects for the authenticated user.

**Endpoint**: `GET /api/projects`

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort` (optional): Sort field (default: createdAt)
- `order` (optional): Sort order - asc or desc (default: desc)

**Example**: `GET /api/projects?page=1&limit=10&sort=name&order=asc`

**Success Response** (200):
```json
{
  "projects": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "E-commerce Platform",
      "description": "Build a scalable e-commerce platform",
      "startDate": "2024-02-01T00:00:00.000Z",
      "endDate": "2024-08-31T00:00:00.000Z",
      "budget": 250000,
      "teamSize": 8,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Error Responses**:
- 401: Not authenticated
- 500: Server error

---

### Get Project by ID

Retrieve a specific project.

**Endpoint**: `GET /api/projects/:id`

**Authentication**: Required

**URL Parameters**:
- `id`: Project UUID

**Success Response** (200):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "E-commerce Platform",
  "description": "Build a scalable e-commerce platform",
  "startDate": "2024-02-01T00:00:00.000Z",
  "endDate": "2024-08-31T00:00:00.000Z",
  "budget": 250000,
  "teamSize": 8,
  "teamComposition": [...],
  "technologyStack": [...],
  "scope": "Full-featured e-commerce platform with payment integration",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Not authorized to access this project
- 404: Project not found
- 500: Server error

---

### Update Project

Update an existing project.

**Endpoint**: `PUT /api/projects/:id`

**Authentication**: Required

**URL Parameters**:
- `id`: Project UUID

**Request Body** (all fields optional):
```json
{
  "name": "Updated E-commerce Platform",
  "description": "Updated description",
  "endDate": "2024-09-30",
  "budget": 300000
}
```

**Success Response** (200):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated E-commerce Platform",
  "description": "Updated description",
  "startDate": "2024-02-01T00:00:00.000Z",
  "endDate": "2024-09-30T00:00:00.000Z",
  "budget": 300000,
  "teamSize": 8,
  "teamComposition": [...],
  "technologyStack": [...],
  "scope": "Full-featured e-commerce platform with payment integration",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Error Responses**:
- 400: Validation errors
- 401: Not authenticated
- 403: Not authorized to update this project
- 404: Project not found
- 500: Server error

---

### Delete Project

Delete a project and all associated risk analyses.

**Endpoint**: `DELETE /api/projects/:id`

**Authentication**: Required

**URL Parameters**:
- `id`: Project UUID

**Success Response** (200):
```json
{
  "message": "Project deleted successfully"
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Not authorized to delete this project
- 404: Project not found
- 500: Server error

---

## Risk Analysis Endpoints

### Analyze Project

Trigger risk analysis for a project.

**Endpoint**: `POST /api/projects/:id/analyze`

**Authentication**: Required

**URL Parameters**:
- `id`: Project UUID

**Success Response** (201):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "projectId": "660e8400-e29b-41d4-a716-446655440000",
  "overallScore": 65.5,
  "analyzedAt": "2024-01-15T10:30:00.000Z",
  "risks": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "title": "Timeline Compression Risk",
      "description": "Project timeline is 20% shorter than industry average for similar projects",
      "category": "Schedule",
      "score": 75.0,
      "probability": 0.8,
      "impact": 0.7,
      "status": "Open",
      "mitigations": [
        {
          "id": "990e8400-e29b-41d4-a716-446655440000",
          "strategy": "Add buffer time to critical path activities",
          "priority": "High",
          "estimatedEffort": "1 week",
          "isImplemented": false,
          "isCustom": false
        }
      ],
      "detectedAt": "2024-01-15T10:30:00.000Z",
      "resolvedAt": null
    }
  ],
  "metadata": {
    "modelVersion": "1.0.0",
    "engineVersion": "1.0.0",
    "processingTime": 1250,
    "dataCompleteness": 95.0
  }
}
```

**Error Responses**:
- 400: Incomplete project data (missing required fields)
- 401: Not authenticated
- 403: Not authorized to analyze this project
- 404: Project not found
- 500: Server error or AI service unavailable

---

### Get Latest Risk Analysis

Retrieve the most recent risk analysis for a project.

**Endpoint**: `GET /api/projects/:id/risks`

**Authentication**: Required

**URL Parameters**:
- `id`: Project UUID

**Query Parameters**:
- `category` (optional): Filter by risk category (Technical, Resource, Schedule, Budget, External)
- `status` (optional): Filter by risk status (Open, In Progress, Mitigated, Resolved, Accepted)
- `minScore` (optional): Minimum risk score (0-100)
- `maxScore` (optional): Maximum risk score (0-100)

**Example**: `GET /api/projects/:id/risks?category=Technical&minScore=70`

**Success Response** (200):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "projectId": "660e8400-e29b-41d4-a716-446655440000",
  "overallScore": 65.5,
  "analyzedAt": "2024-01-15T10:30:00.000Z",
  "risks": [...],
  "metadata": {...}
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Not authorized to access this project
- 404: Project not found or no analysis available
- 500: Server error

---

### Get Risk Analysis History

Retrieve all historical risk analyses for a project.

**Endpoint**: `GET /api/projects/:id/risks/history`

**Authentication**: Required

**URL Parameters**:
- `id`: Project UUID

**Query Parameters**:
- `limit` (optional): Number of analyses to return (default: 10, max: 50)

**Success Response** (200):
```json
{
  "projectId": "660e8400-e29b-41d4-a716-446655440000",
  "analyses": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "overallScore": 65.5,
      "analyzedAt": "2024-01-15T10:30:00.000Z",
      "riskCount": 5,
      "highPriorityCount": 2
    },
    {
      "id": "771e8400-e29b-41d4-a716-446655440000",
      "overallScore": 72.0,
      "analyzedAt": "2024-01-10T10:30:00.000Z",
      "riskCount": 6,
      "highPriorityCount": 3
    }
  ]
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Not authorized to access this project
- 404: Project not found
- 500: Server error

---

### Get Specific Risk

Retrieve detailed information about a specific risk.

**Endpoint**: `GET /api/risks/:id`

**Authentication**: Required

**URL Parameters**:
- `id`: Risk UUID

**Success Response** (200):
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "analysisId": "770e8400-e29b-41d4-a716-446655440000",
  "title": "Timeline Compression Risk",
  "description": "Project timeline is 20% shorter than industry average",
  "category": "Schedule",
  "score": 75.0,
  "probability": 0.8,
  "impact": 0.7,
  "status": "Open",
  "mitigations": [...],
  "detectedAt": "2024-01-15T10:30:00.000Z",
  "resolvedAt": null
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Not authorized to access this risk
- 404: Risk not found
- 500: Server error

---

### Add Custom Mitigation

Add a custom mitigation strategy to a risk.

**Endpoint**: `POST /api/risks/:id/mitigations`

**Authentication**: Required

**URL Parameters**:
- `id`: Risk UUID

**Request Body**:
```json
{
  "strategy": "Hire additional senior developers",
  "priority": "High",
  "estimatedEffort": "2 weeks"
}
```

**Success Response** (201):
```json
{
  "id": "991e8400-e29b-41d4-a716-446655440000",
  "riskId": "880e8400-e29b-41d4-a716-446655440000",
  "strategy": "Hire additional senior developers",
  "priority": "High",
  "estimatedEffort": "2 weeks",
  "isImplemented": false,
  "implementedAt": null,
  "isCustom": true,
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

**Error Responses**:
- 400: Validation errors (missing strategy, invalid priority)
- 401: Not authenticated
- 403: Not authorized to modify this risk
- 404: Risk not found
- 500: Server error

---

### Mark Mitigation as Implemented

Mark a mitigation strategy as implemented.

**Endpoint**: `PUT /api/mitigations/:id/implement`

**Authentication**: Required

**URL Parameters**:
- `id`: Mitigation UUID

**Success Response** (200):
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "riskId": "880e8400-e29b-41d4-a716-446655440000",
  "strategy": "Add buffer time to critical path activities",
  "priority": "High",
  "estimatedEffort": "1 week",
  "isImplemented": true,
  "implementedAt": "2024-01-15T11:00:00.000Z",
  "isCustom": false,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Not authorized to modify this mitigation
- 404: Mitigation not found
- 500: Server error

---

### Update Risk Status

Update the status of a risk.

**Endpoint**: `PUT /api/risks/:id/status`

**Authentication**: Required

**URL Parameters**:
- `id`: Risk UUID

**Request Body**:
```json
{
  "status": "Mitigated"
}
```

**Valid Status Values**: Open, In Progress, Mitigated, Resolved, Accepted

**Success Response** (200):
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "analysisId": "770e8400-e29b-41d4-a716-446655440000",
  "title": "Timeline Compression Risk",
  "description": "Project timeline is 20% shorter than industry average",
  "category": "Schedule",
  "score": 75.0,
  "probability": 0.8,
  "impact": 0.7,
  "status": "Mitigated",
  "mitigations": [...],
  "detectedAt": "2024-01-15T10:30:00.000Z",
  "resolvedAt": "2024-01-15T11:00:00.000Z"
}
```

**Error Responses**:
- 400: Invalid status value
- 401: Not authenticated
- 403: Not authorized to modify this risk
- 404: Risk not found
- 500: Server error

---

## Report Endpoints

### Generate PDF Report

Generate a PDF report for a project's risk analysis.

**Endpoint**: `POST /api/projects/:id/reports/pdf`

**Authentication**: Required

**URL Parameters**:
- `id`: Project UUID

**Request Body**:
```json
{
  "options": {
    "includeSummary": true,
    "includeDetailedRisks": true,
    "includeCharts": true,
    "includeMitigations": true,
    "includeHistory": false
  }
}
```

**Success Response** (201):
```json
{
  "reportId": "aa0e8400-e29b-41d4-a716-446655440000",
  "type": "PDF",
  "downloadUrl": "/api/reports/aa0e8400-e29b-41d4-a716-446655440000/download",
  "generatedAt": "2024-01-15T11:00:00.000Z",
  "expiresAt": "2024-01-16T11:00:00.000Z"
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Not authorized to generate report for this project
- 404: Project not found or no analysis available
- 500: Server error or report generation failed

---

### Generate CSV Export

Generate a CSV export of risk data.

**Endpoint**: `POST /api/projects/:id/reports/csv`

**Authentication**: Required

**URL Parameters**:
- `id`: Project UUID

**Success Response** (201):
```json
{
  "reportId": "ab0e8400-e29b-41d4-a716-446655440000",
  "type": "CSV",
  "downloadUrl": "/api/reports/ab0e8400-e29b-41d4-a716-446655440000/download",
  "generatedAt": "2024-01-15T11:00:00.000Z",
  "expiresAt": "2024-01-16T11:00:00.000Z"
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Not authorized to generate report for this project
- 404: Project not found or no analysis available
- 500: Server error or report generation failed

---

### Download Report

Download a generated report.

**Endpoint**: `GET /api/reports/:id/download`

**Authentication**: Required

**URL Parameters**:
- `id`: Report UUID

**Success Response** (200):
- Content-Type: application/pdf or text/csv
- Content-Disposition: attachment; filename="risk-report-{projectName}-{date}.pdf"
- Binary file data

**Error Responses**:
- 401: Not authenticated
- 403: Not authorized to download this report
- 404: Report not found or expired
- 500: Server error

---

## Examples

### Complete Workflow Example

```javascript
// 1. Register a new user
const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'pm@company.com',
    password: 'SecurePass123!',
    name: 'Project Manager'
  })
});

// 2. Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'pm@company.com',
    password: 'SecurePass123!'
  })
});
const { accessToken } = await loginResponse.json();

// 3. Create a project
const projectResponse = await fetch('http://localhost:3000/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    name: 'Mobile App Development',
    description: 'iOS and Android app',
    startDate: '2024-03-01',
    endDate: '2024-09-30',
    budget: 150000,
    teamSize: 6,
    teamComposition: [
      { role: 'Developer', count: 4, experienceLevel: 'Mid' },
      { role: 'Designer', count: 1, experienceLevel: 'Senior' },
      { role: 'QA', count: 1, experienceLevel: 'Junior' }
    ],
    technologyStack: [
      { name: 'React Native', category: 'Frontend', maturity: 'Stable' },
      { name: 'Firebase', category: 'Backend', maturity: 'Stable' }
    ],
    scope: 'Cross-platform mobile application'
  })
});
const project = await projectResponse.json();

// 4. Analyze project risks
const analysisResponse = await fetch(
  `http://localhost:3000/api/projects/${project.id}/analyze`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  }
);
const riskAnalysis = await analysisResponse.json();

// 5. Add custom mitigation
const mitigationResponse = await fetch(
  `http://localhost:3000/api/risks/${riskAnalysis.risks[0].id}/mitigations`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      strategy: 'Conduct weekly code reviews',
      priority: 'High',
      estimatedEffort: '2 hours per week'
    })
  }
);

// 6. Generate PDF report
const reportResponse = await fetch(
  `http://localhost:3000/api/projects/${project.id}/reports/pdf`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      options: {
        includeSummary: true,
        includeDetailedRisks: true,
        includeCharts: true,
        includeMitigations: true,
        includeHistory: false
      }
    })
  }
);
const report = await reportResponse.json();

// 7. Download report
window.location.href = `http://localhost:3000${report.downloadUrl}`;
```

---

## Postman Collection

A Postman collection with all endpoints and example requests is available at:
`/backend/docs/postman-collection.json`

Import this collection into Postman for easy API testing.

---

## Support

For API issues or questions:
- GitHub Issues: [repository-url]/issues
- Email: support@example.com
- Documentation: [repository-url]/docs

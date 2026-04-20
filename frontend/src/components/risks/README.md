# Risk Dashboard Components

This directory contains the risk analysis dashboard components for the AI Project Risk Analyzer.

## Components

### RiskDashboard

Main dashboard component that displays comprehensive risk analysis for a project.

**Features:**
- Overall project risk score display
- Key metrics (total risks, high-priority, mitigated, open)
- Category filtering
- Refresh/re-analysis button
- Interactive charts (category distribution, severity distribution, timeline)
- Risk list with detailed cards

**Usage:**
```tsx
import { RiskDashboard } from './components/risks';

<RiskDashboard projectId="project-uuid" />
```

**Props:**
- `projectId` (string, required): The ID of the project to display risks for

**Requirements:** 6.1, 6.6

---

### RiskCard

Individual risk card component that displays detailed risk information and mitigation strategies.

**Features:**
- Risk details (title, description, score, category, status, probability, impact)
- Severity color coding (High: red, Medium: yellow, Low: green)
- Mitigation strategies list
- Mark mitigations as implemented
- Add custom mitigation strategies
- Priority and effort indicators

**Usage:**
```tsx
import { RiskCard } from './components/risks';

<RiskCard 
  risk={riskObject} 
  onMitigationUpdate={(riskId, mitigation) => console.log('Updated')}
/>
```

**Props:**
- `risk` (Risk, required): The risk object to display
- `onMitigationUpdate` (function, optional): Callback when a mitigation is updated

**Requirements:** 4.1, 4.3, 5.2, 5.3, 5.4

---

### RiskCharts

Collection of chart components for visualizing risk data using Recharts.

#### CategoryDistributionChart

Pie chart showing distribution of risks by category (Technical, Resource, Schedule, Budget, External).

**Usage:**
```tsx
import { CategoryDistributionChart } from './components/risks';

<CategoryDistributionChart 
  risks={risksArray}
  onCategoryClick={(category) => console.log('Clicked:', category)}
/>
```

**Props:**
- `risks` (Risk[], required): Array of risk objects
- `onCategoryClick` (function, optional): Callback when a category is clicked

#### SeverityDistributionChart

Bar chart showing distribution of risks by severity level (High, Medium, Low).

**Usage:**
```tsx
import { SeverityDistributionChart } from './components/risks';

<SeverityDistributionChart 
  risks={risksArray}
  onSeverityClick={(severity) => console.log('Clicked:', severity)}
/>
```

**Props:**
- `risks` (Risk[], required): Array of risk objects
- `onSeverityClick` (function, optional): Callback when a severity level is clicked

#### RiskTimelineChart

Line chart showing how risks have evolved over time, displaying both risk count and average risk score.

**Usage:**
```tsx
import { RiskTimelineChart } from './components/risks';

<RiskTimelineChart risks={risksArray} />
```

**Props:**
- `risks` (Risk[], required): Array of risk objects

**Requirements:** 6.2, 6.3, 6.4

---

## Types

### Risk
```typescript
interface Risk {
  id: string;
  analysisId: string;
  title: string;
  description: string;
  category: RiskCategory;
  score: number;
  probability: number;
  impact: number;
  status: RiskStatus;
  mitigations: Mitigation[];
  detectedAt: string;
  resolvedAt: string | null;
}
```

### RiskAnalysis
```typescript
interface RiskAnalysis {
  id: string;
  projectId: string;
  overallScore: number;
  analyzedAt: string;
  risks: Risk[];
  metadata: {
    modelVersion: string;
    engineVersion: string;
    processingTime: number;
    dataCompleteness: number;
  };
}
```

### Mitigation
```typescript
interface Mitigation {
  id: string;
  riskId: string;
  strategy: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedEffort: string;
  isImplemented: boolean;
  implementedAt: string | null;
  isCustom: boolean;
  createdAt: string;
}
```

### RiskCategory
```typescript
type RiskCategory = 'Technical' | 'Resource' | 'Schedule' | 'Budget' | 'External';
```

### RiskStatus
```typescript
type RiskStatus = 'Open' | 'In Progress' | 'Mitigated' | 'Resolved' | 'Accepted';
```

---

## API Integration

These components use React Query for data fetching and mutations. They interact with the following API endpoints:

- `GET /api/projects/:id/risks` - Fetch risk analysis
- `POST /api/projects/:id/analyze` - Trigger new analysis
- `POST /api/risks/:id/mitigations` - Add custom mitigation
- `PUT /api/mitigations/:id/implement` - Mark mitigation as implemented

---

## Styling

Components use Tailwind CSS for styling with the following color scheme:

**Severity Colors:**
- High (70-100): Red (#EF4444)
- Medium (40-69): Yellow (#F59E0B)
- Low (0-39): Green (#10B981)

**Category Colors:**
- Technical: Blue (#3B82F6)
- Resource: Green (#10B981)
- Schedule: Yellow (#F59E0B)
- Budget: Red (#EF4444)
- External: Purple (#8B5CF6)

---

## Testing

Unit tests for these components should be added in:
- `RiskDashboard.test.tsx`
- `RiskCard.test.tsx`
- `RiskCharts.test.tsx`

Test coverage should include:
- Component rendering
- User interactions (filtering, clicking, form submission)
- API integration with mocked responses
- Error handling

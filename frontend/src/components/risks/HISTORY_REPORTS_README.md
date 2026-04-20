# Risk History and Report Components

This document describes the RiskHistory and ReportGenerator components added for historical tracking and report generation functionality.

## Components

### RiskHistory Component

**Location**: `frontend/src/components/risks/RiskHistory.tsx`

**Purpose**: Displays historical risk analyses with comparison functionality

**Requirements**: 7.2, 7.3

**Features**:
- Display list of past analyses in chronological order
- Show analysis timestamps and key metrics
- Comparison selector for two analyses
- Display comparison results showing:
  - Overall score changes
  - Risk count changes
  - New risks identified
  - Resolved risks
  - Changed risks with score deltas

**Props**:
```typescript
interface RiskHistoryProps {
  projectId: string;
}
```

**API Endpoints Used**:
- `GET /api/projects/:id/risks/history` - Fetch analysis history
- `GET /api/risks/compare?analysis1=:id1&analysis2=:id2` - Compare two analyses

**Usage Example**:
```tsx
import { RiskHistory } from '../../components/risks';

function HistoryPage() {
  return <RiskHistory projectId="project-123" />;
}
```

### ReportGenerator Component

**Location**: `frontend/src/components/risks/ReportGenerator.tsx`

**Purpose**: Handles PDF and CSV report generation with customizable options

**Requirements**: 8.1, 8.4, 8.5, 8.7

**Features**:
- Report options selector (PDF only):
  - Include Summary
  - Include Detailed Risks
  - Include Charts
  - Include Mitigation Strategies
  - Include Historical Data
- PDF generation button with progress indicator
- CSV export button with progress indicator
- Automatic download handling
- Success/error feedback messages

**Props**:
```typescript
interface ReportGeneratorProps {
  projectId: string;
  projectName?: string;
}
```

**API Endpoints Used**:
- `POST /api/projects/:id/reports/pdf` - Generate PDF report
- `POST /api/projects/:id/reports/csv` - Generate CSV export

**Usage Example**:
```tsx
import { ReportGenerator } from '../../components/risks';

function ReportsPage() {
  return (
    <ReportGenerator 
      projectId="project-123" 
      projectName="My Project"
    />
  );
}
```

## Integration

Both components are exported from the risks index:

```typescript
import { RiskHistory, ReportGenerator } from './components/risks';
```

## Styling

Both components use Tailwind CSS for styling and follow the existing design patterns:
- White cards with shadow for sections
- Color-coded severity indicators (red/yellow/green)
- Responsive grid layouts
- Loading states with spinners
- Success/error feedback with appropriate colors

## State Management

Both components use React Query for data fetching and mutations:
- `useQuery` for fetching data
- `useMutation` for triggering actions (analysis comparison, report generation)
- Automatic cache invalidation where appropriate

## Error Handling

Both components include comprehensive error handling:
- Loading states
- Error messages for failed API calls
- Empty state handling
- Disabled buttons during operations

## Future Enhancements

Potential improvements:
- Add filtering/search to history list
- Export comparison results
- Schedule automatic report generation
- Email report delivery
- Custom report templates
- Batch report generation for multiple projects

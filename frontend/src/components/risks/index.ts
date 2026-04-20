/**
 * Risk Components Index
 * Exports all risk-related components
 */

export { default as RiskDashboard } from './RiskDashboard';
export { default as RiskCard } from './RiskCard';
export { default as RiskChart, CategoryDistributionChart, SeverityDistributionChart, RiskTimelineChart } from './RiskCharts';
export { default as RiskHistory } from './RiskHistory';
export { default as ReportGenerator } from './ReportGenerator';

// Re-export types
export type { Risk, RiskAnalysis, Mitigation, RiskCategory, RiskStatus } from './RiskDashboard';

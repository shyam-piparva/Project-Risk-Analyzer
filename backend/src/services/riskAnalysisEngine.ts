// Unused imports removed - types are exported but not used in this file
// import { Project, TeamMember, Technology } from './projectService';
// import { logger } from '../utils/logger';

/**
 * Risk Analysis Engine
 * Implements rule-based risk detection and scoring
 * Validates: Requirements 3.1, 3.3, 3.4, 3.6, 4.3, 5.1, 5.6
 */

export type RiskCategory = 'Technical' | 'Resource' | 'Schedule' | 'Budget' | 'External';
export type RiskSeverity = 'High' | 'Medium' | 'Low';
export type MitigationPriority = 'High' | 'Medium' | 'Low';

export interface RiskPrediction {
  title: string;
  description: string;
  category: RiskCategory;
  score: number;
  probability: number;
  impact: number;
  mitigations: MitigationStrategy[];
}

export interface MitigationStrategy {
  strategy: string;
  priority: MitigationPriority;
  estimatedEffort: string;
}

/**
 * Calculate risk score from probability and impact
 * Formula: Risk_Score = (Probability × 0.5 + Impact × 0.5) × 100
 * 
 * @param probability - Likelihood of occurrence (0.0 to 1.0)
 * @param impact - Severity if it occurs (0.0 to 1.0)
 * @returns Risk score (0-100)
 * @validates Requirements 3.3, 4.3
 */
export function calculateRiskScore(probability: number, impact: number): number {
  // Validate inputs
  if (probability < 0 || probability > 1) {
    throw new Error('Probability must be between 0 and 1');
  }
  
  if (impact < 0 || impact > 1) {
    throw new Error('Impact must be between 0 and 1');
  }

  // Calculate weighted score
  const score = (probability * 0.5 + impact * 0.5) * 100;
  
  // Ensure score is within bounds and rounded to 2 decimal places
  return Math.min(100, Math.max(0, Math.round(score * 100) / 100));
}

/**
 * Determine risk severity level based on score
 * High: 70-100
 * Medium: 40-69
 * Low: 0-39
 * 
 * @param score - Risk score (0-100)
 * @returns Risk severity level
 * @validates Requirements 4.3
 */
export function getRiskSeverity(score: number): RiskSeverity {
  if (score < 0 || score > 100) {
    throw new Error('Risk score must be between 0 and 100');
  }

  if (score >= 70) {
    return 'High';
  } else if (score >= 40) {
    return 'Medium';
  } else {
    return 'Low';
  }
}

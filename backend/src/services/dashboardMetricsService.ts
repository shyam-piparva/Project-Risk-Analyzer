/**
 * Dashboard Metrics Service
 * Implements calculations for dashboard metrics and statistics
 * Validates: Requirements 4.6, 6.6, 7.6
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger';

export interface DashboardMetrics {
  totalRisks: number;
  highPriorityRisks: number;
  mitigatedRisks: number;
  openRisks: number;
  overallRiskScore: number;
  risksByCategory: RiskCategoryCount[];
  risksBySeverity: RiskSeverityCount[];
  mitigationStatistics: MitigationStatistics;
  averageTimeToResolution: number | null;
}

export interface RiskCategoryCount {
  category: string;
  count: number;
}

export interface RiskSeverityCount {
  severity: 'High' | 'Medium' | 'Low';
  count: number;
}

export interface MitigationStatistics {
  totalMitigations: number;
  implementedMitigations: number;
  pendingMitigations: number;
  implementationRate: number;
}

/**
 * Calculate overall project risk score from individual risk scores
 * Uses a weighted average approach where higher risks have more influence
 * 
 * @param riskScores - Array of individual risk scores (0-100)
 * @returns Overall project risk score (0-100)
 * @validates Requirements 4.6
 */
export function calculateOverallRiskScore(riskScores: number[]): number {
  if (!riskScores || riskScores.length === 0) {
    return 0;
  }

  // Validate all scores are in valid range
  for (const score of riskScores) {
    if (score < 0 || score > 100) {
      throw new Error(`All risk scores must be between 0 and 100, got ${score}`);
    }
  }

  // Use weighted average with exponential weighting for higher risks
  // This ensures that high-severity risks have more influence on overall score
  const weights = riskScores.map(score => Math.pow(score, 1.5));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  if (totalWeight === 0) {
    return 0;
  }

  const weightedSum = riskScores.reduce(
    (sum, score, index) => sum + score * weights[index],
    0
  );
  const overallScore = weightedSum / totalWeight;

  return Math.round(overallScore * 100) / 100;
}

/**
 * Count risks by category
 * 
 * @param db - Database connection pool
 * @param analysisId - Risk analysis ID
 * @returns Array of category counts
 * @validates Requirements 6.6
 */
export async function countRisksByCategory(
  db: Pool,
  analysisId: string
): Promise<RiskCategoryCount[]> {
  try {
    const result = await db.query(
      `
      SELECT category, COUNT(*) as count
      FROM risks
      WHERE analysis_id = $1
      GROUP BY category
      ORDER BY count DESC
      `,
      [analysisId]
    );

    return result.rows.map(row => ({
      category: row.category,
      count: parseInt(row.count, 10),
    }));
  } catch (error) {
    logger.error('Error counting risks by category', { error, analysisId });
    throw new Error('Failed to count risks by category');
  }
}

/**
 * Count risks by severity level
 * 
 * @param db - Database connection pool
 * @param analysisId - Risk analysis ID
 * @returns Array of severity counts
 * @validates Requirements 6.6
 */
export async function countRisksBySeverity(
  db: Pool,
  analysisId: string
): Promise<RiskSeverityCount[]> {
  try {
    const result = await db.query(
      `
      SELECT 
        CASE 
          WHEN score >= 70 THEN 'High'
          WHEN score >= 40 THEN 'Medium'
          ELSE 'Low'
        END as severity,
        COUNT(*) as count
      FROM risks
      WHERE analysis_id = $1
      GROUP BY severity
      ORDER BY 
        CASE severity
          WHEN 'High' THEN 1
          WHEN 'Medium' THEN 2
          WHEN 'Low' THEN 3
        END
      `,
      [analysisId]
    );

    return result.rows.map(row => ({
      severity: row.severity as 'High' | 'Medium' | 'Low',
      count: parseInt(row.count, 10),
    }));
  } catch (error) {
    logger.error('Error counting risks by severity', { error, analysisId });
    throw new Error('Failed to count risks by severity');
  }
}

/**
 * Calculate mitigation statistics
 * 
 * @param db - Database connection pool
 * @param analysisId - Risk analysis ID
 * @returns Mitigation statistics
 * @validates Requirements 6.6
 */
export async function calculateMitigationStatistics(
  db: Pool,
  analysisId: string
): Promise<MitigationStatistics> {
  try {
    const result = await db.query(
      `
      SELECT 
        COUNT(*) as total_mitigations,
        SUM(CASE WHEN is_implemented = true THEN 1 ELSE 0 END) as implemented_mitigations
      FROM mitigations m
      INNER JOIN risks r ON m.risk_id = r.id
      WHERE r.analysis_id = $1
      `,
      [analysisId]
    );

    const row = result.rows[0];
    const totalMitigations = parseInt(row.total_mitigations, 10);
    const implementedMitigations = parseInt(row.implemented_mitigations, 10);
    const pendingMitigations = totalMitigations - implementedMitigations;
    const implementationRate =
      totalMitigations > 0
        ? Math.round((implementedMitigations / totalMitigations) * 10000) / 100
        : 0;

    return {
      totalMitigations,
      implementedMitigations,
      pendingMitigations,
      implementationRate,
    };
  } catch (error) {
    logger.error('Error calculating mitigation statistics', { error, analysisId });
    throw new Error('Failed to calculate mitigation statistics');
  }
}

/**
 * Calculate average time to resolution for resolved risks
 * 
 * @param db - Database connection pool
 * @param projectId - Project ID
 * @returns Average time to resolution in days, or null if no resolved risks
 * @validates Requirements 7.6
 */
export async function calculateAverageTimeToResolution(
  db: Pool,
  projectId: string
): Promise<number | null> {
  try {
    const result = await db.query(
      `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at)) / 86400) as avg_days
      FROM risks r
      INNER JOIN risk_analyses ra ON r.analysis_id = ra.id
      WHERE ra.project_id = $1
        AND r.resolved_at IS NOT NULL
        AND r.status = 'Resolved'
      `,
      [projectId]
    );

    const avgDays = result.rows[0]?.avg_days;
    
    if (avgDays === null || avgDays === undefined) {
      return null;
    }

    return Math.round(parseFloat(avgDays) * 100) / 100;
  } catch (error) {
    logger.error('Error calculating average time to resolution', { error, projectId });
    throw new Error('Failed to calculate average time to resolution');
  }
}

/**
 * Get comprehensive dashboard metrics for a project's latest analysis
 * 
 * @param db - Database connection pool
 * @param projectId - Project ID
 * @returns Complete dashboard metrics
 * @validates Requirements 4.6, 6.6, 7.6
 */
export async function getDashboardMetrics(
  db: Pool,
  projectId: string
): Promise<DashboardMetrics | null> {
  try {
    // Get latest analysis for the project
    const analysisResult = await db.query(
      `
      SELECT id, overall_score
      FROM risk_analyses
      WHERE project_id = $1
      ORDER BY analyzed_at DESC
      LIMIT 1
      `,
      [projectId]
    );

    if (analysisResult.rows.length === 0) {
      return null;
    }

    const analysis = analysisResult.rows[0];
    const analysisId = analysis.id;
    const overallRiskScore = parseFloat(analysis.overall_score);

    // Get risk counts by status
    const statusResult = await db.query(
      `
      SELECT 
        COUNT(*) as total_risks,
        SUM(CASE WHEN score >= 70 THEN 1 ELSE 0 END) as high_priority_risks,
        SUM(CASE WHEN status = 'Mitigated' THEN 1 ELSE 0 END) as mitigated_risks,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_risks
      FROM risks
      WHERE analysis_id = $1
      `,
      [analysisId]
    );

    const statusRow = statusResult.rows[0];

    // Get category and severity counts
    const [risksByCategory, risksBySeverity, mitigationStatistics, averageTimeToResolution] =
      await Promise.all([
        countRisksByCategory(db, analysisId),
        countRisksBySeverity(db, analysisId),
        calculateMitigationStatistics(db, analysisId),
        calculateAverageTimeToResolution(db, projectId),
      ]);

    return {
      totalRisks: parseInt(statusRow.total_risks, 10),
      highPriorityRisks: parseInt(statusRow.high_priority_risks, 10),
      mitigatedRisks: parseInt(statusRow.mitigated_risks, 10),
      openRisks: parseInt(statusRow.open_risks, 10),
      overallRiskScore,
      risksByCategory,
      risksBySeverity,
      mitigationStatistics,
      averageTimeToResolution,
    };
  } catch (error) {
    logger.error('Error getting dashboard metrics', { error, projectId });
    throw new Error('Failed to get dashboard metrics');
  }
}

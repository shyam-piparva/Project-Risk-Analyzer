/**
 * Analysis Comparison Service
 * Provides functions to compare two risk analyses
 * Validates: Requirement 7.3
 */

/**
 * Interface for a risk in an analysis
 */
export interface AnalysisRisk {
  id: string;
  title: string;
  description: string;
  category: string;
  score: number;
  probability: number;
  impact: number;
  status: string;
}

/**
 * Interface for a risk analysis
 */
export interface RiskAnalysis {
  id: string;
  projectId: string;
  overallScore: number;
  analyzedAt: string;
  risks: AnalysisRisk[];
}

/**
 * Interface for risk score change
 */
export interface RiskScoreChange {
  riskId: string;
  title: string;
  category: string;
  oldScore: number;
  newScore: number;
  scoreDelta: number;
  percentageChange: number;
}

/**
 * Interface for new or resolved risk
 */
export interface RiskChange {
  riskId: string;
  title: string;
  description: string;
  category: string;
  score: number;
}

/**
 * Interface for analysis comparison result
 */
export interface AnalysisComparison {
  oldAnalysisId: string;
  newAnalysisId: string;
  oldAnalyzedAt: string;
  newAnalyzedAt: string;
  overallScoreChange: {
    oldScore: number;
    newScore: number;
    scoreDelta: number;
    percentageChange: number;
  };
  riskCountChange: {
    oldCount: number;
    newCount: number;
    countDelta: number;
  };
  scoreChanges: RiskScoreChange[];
  newRisks: RiskChange[];
  resolvedRisks: RiskChange[];
}

/**
 * Compare two risk analyses and return differences
 * 
 * This function compares two analyses for the same project and identifies:
 * - Changes in overall risk score
 * - Changes in risk counts
 * - Individual risk score changes
 * - New risks that appeared
 * - Risks that were resolved
 * 
 * @param oldAnalysis - The earlier analysis
 * @param newAnalysis - The later analysis
 * @returns Comparison result with all differences
 * @validates Requirement 7.3
 */
export function compareAnalyses(
  oldAnalysis: RiskAnalysis,
  newAnalysis: RiskAnalysis
): AnalysisComparison {
  // Validate that both analyses are for the same project
  if (oldAnalysis.projectId !== newAnalysis.projectId) {
    throw new Error('Cannot compare analyses from different projects');
  }

  // Calculate overall score change
  const scoreDelta = newAnalysis.overallScore - oldAnalysis.overallScore;
  const percentageChange =
    oldAnalysis.overallScore !== 0
      ? (scoreDelta / oldAnalysis.overallScore) * 100
      : newAnalysis.overallScore !== 0
        ? 100
        : 0;

  // Calculate risk count change
  const countDelta = newAnalysis.risks.length - oldAnalysis.risks.length;

  // Calculate risk score changes
  const scoreChanges = calculateRiskScoreChanges(oldAnalysis, newAnalysis);

  // Identify new and resolved risks
  const newRisks = identifyNewRisks(oldAnalysis, newAnalysis);
  const resolvedRisks = identifyResolvedRisks(oldAnalysis, newAnalysis);

  return {
    oldAnalysisId: oldAnalysis.id,
    newAnalysisId: newAnalysis.id,
    oldAnalyzedAt: oldAnalysis.analyzedAt,
    newAnalyzedAt: newAnalysis.analyzedAt,
    overallScoreChange: {
      oldScore: oldAnalysis.overallScore,
      newScore: newAnalysis.overallScore,
      scoreDelta: Math.round(scoreDelta * 100) / 100,
      percentageChange: Math.round(percentageChange * 100) / 100,
    },
    riskCountChange: {
      oldCount: oldAnalysis.risks.length,
      newCount: newAnalysis.risks.length,
      countDelta,
    },
    scoreChanges,
    newRisks,
    resolvedRisks,
  };
}

/**
 * Calculate risk score changes between two analyses
 * 
 * This function matches risks between analyses by title and category,
 * then calculates the score delta and percentage change for each matched risk.
 * 
 * @param oldAnalysis - The earlier analysis
 * @param newAnalysis - The later analysis
 * @returns Array of risk score changes
 * @validates Requirement 7.3
 */
export function calculateRiskScoreChanges(
  oldAnalysis: RiskAnalysis,
  newAnalysis: RiskAnalysis
): RiskScoreChange[] {
  const scoreChanges: RiskScoreChange[] = [];

  // Create a map of old risks by title and category for efficient lookup
  const oldRisksMap = new Map<string, AnalysisRisk>();
  oldAnalysis.risks.forEach((risk) => {
    const key = `${risk.title}|${risk.category}`;
    oldRisksMap.set(key, risk);
  });

  // Find matching risks in new analysis and calculate changes
  newAnalysis.risks.forEach((newRisk) => {
    const key = `${newRisk.title}|${newRisk.category}`;
    const oldRisk = oldRisksMap.get(key);

    if (oldRisk) {
      const scoreDelta = newRisk.score - oldRisk.score;
      
      // Only include risks where the score actually changed
      if (scoreDelta !== 0) {
        const percentageChange =
          oldRisk.score !== 0
            ? (scoreDelta / oldRisk.score) * 100
            : newRisk.score !== 0
              ? 100
              : 0;

        scoreChanges.push({
          riskId: newRisk.id,
          title: newRisk.title,
          category: newRisk.category,
          oldScore: oldRisk.score,
          newScore: newRisk.score,
          scoreDelta: Math.round(scoreDelta * 100) / 100,
          percentageChange: Math.round(percentageChange * 100) / 100,
        });
      }
    }
  });

  // Sort by absolute score delta (largest changes first)
  scoreChanges.sort((a, b) => Math.abs(b.scoreDelta) - Math.abs(a.scoreDelta));

  return scoreChanges;
}

/**
 * Identify new risks that appeared in the new analysis
 * 
 * This function finds risks in the new analysis that don't exist in the old analysis.
 * Risks are matched by title and category.
 * 
 * @param oldAnalysis - The earlier analysis
 * @param newAnalysis - The later analysis
 * @returns Array of new risks
 * @validates Requirement 7.3
 */
export function identifyNewRisks(
  oldAnalysis: RiskAnalysis,
  newAnalysis: RiskAnalysis
): RiskChange[] {
  const newRisks: RiskChange[] = [];

  // Create a set of old risk keys for efficient lookup
  const oldRiskKeys = new Set<string>();
  oldAnalysis.risks.forEach((risk) => {
    const key = `${risk.title}|${risk.category}`;
    oldRiskKeys.add(key);
  });

  // Find risks in new analysis that don't exist in old analysis
  newAnalysis.risks.forEach((risk) => {
    const key = `${risk.title}|${risk.category}`;
    if (!oldRiskKeys.has(key)) {
      newRisks.push({
        riskId: risk.id,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        score: risk.score,
      });
    }
  });

  // Sort by score (highest first)
  newRisks.sort((a, b) => b.score - a.score);

  return newRisks;
}

/**
 * Identify risks that were resolved (present in old but not in new)
 * 
 * This function finds risks in the old analysis that don't exist in the new analysis.
 * Risks are matched by title and category.
 * 
 * @param oldAnalysis - The earlier analysis
 * @param newAnalysis - The later analysis
 * @returns Array of resolved risks
 * @validates Requirement 7.3
 */
export function identifyResolvedRisks(
  oldAnalysis: RiskAnalysis,
  newAnalysis: RiskAnalysis
): RiskChange[] {
  const resolvedRisks: RiskChange[] = [];

  // Create a set of new risk keys for efficient lookup
  const newRiskKeys = new Set<string>();
  newAnalysis.risks.forEach((risk) => {
    const key = `${risk.title}|${risk.category}`;
    newRiskKeys.add(key);
  });

  // Find risks in old analysis that don't exist in new analysis
  oldAnalysis.risks.forEach((risk) => {
    const key = `${risk.title}|${risk.category}`;
    if (!newRiskKeys.has(key)) {
      resolvedRisks.push({
        riskId: risk.id,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        score: risk.score,
      });
    }
  });

  // Sort by score (highest first)
  resolvedRisks.sort((a, b) => b.score - a.score);

  return resolvedRisks;
}

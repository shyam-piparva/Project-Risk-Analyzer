/**
 * Unit tests for Analysis Comparison Service
 * Tests the comparison logic for risk analyses
 */

import {
  compareAnalyses,
  calculateRiskScoreChanges,
  identifyNewRisks,
  identifyResolvedRisks,
  RiskAnalysis,
} from './analysisComparisonService';

describe('Analysis Comparison Service', () => {
  // Sample test data
  const oldAnalysis: RiskAnalysis = {
    id: 'analysis-1',
    projectId: 'project-123',
    overallScore: 65.5,
    analyzedAt: '2024-01-01T00:00:00Z',
    risks: [
      {
        id: 'risk-1',
        title: 'Timeline Compression Risk',
        description: 'Project timeline is too tight',
        category: 'Schedule',
        score: 75.0,
        probability: 0.8,
        impact: 0.7,
        status: 'Open',
      },
      {
        id: 'risk-2',
        title: 'Budget Constraint Risk',
        description: 'Budget may be insufficient',
        category: 'Budget',
        score: 70.0,
        probability: 0.7,
        impact: 0.8,
        status: 'Open',
      },
      {
        id: 'risk-3',
        title: 'Team Experience Gap',
        description: 'Too many junior developers',
        category: 'Resource',
        score: 60.0,
        probability: 0.6,
        impact: 0.6,
        status: 'Open',
      },
    ],
  };

  const newAnalysis: RiskAnalysis = {
    id: 'analysis-2',
    projectId: 'project-123',
    overallScore: 55.0,
    analyzedAt: '2024-02-01T00:00:00Z',
    risks: [
      {
        id: 'risk-4',
        title: 'Timeline Compression Risk',
        description: 'Project timeline is too tight',
        category: 'Schedule',
        score: 65.0, // Decreased from 75
        probability: 0.7,
        impact: 0.6,
        status: 'Open',
      },
      {
        id: 'risk-5',
        title: 'Budget Constraint Risk',
        description: 'Budget may be insufficient',
        category: 'Budget',
        score: 70.0, // Same as before
        probability: 0.7,
        impact: 0.8,
        status: 'Open',
      },
      {
        id: 'risk-6',
        title: 'Technology Maturity Risk',
        description: 'Using experimental technologies',
        category: 'Technical',
        score: 60.0, // New risk
        probability: 0.5,
        impact: 0.7,
        status: 'Open',
      },
    ],
  };

  describe('compareAnalyses', () => {
    it('should compare two analyses and return all differences', () => {
      const comparison = compareAnalyses(oldAnalysis, newAnalysis);

      expect(comparison.oldAnalysisId).toBe('analysis-1');
      expect(comparison.newAnalysisId).toBe('analysis-2');
      expect(comparison.oldAnalyzedAt).toBe('2024-01-01T00:00:00Z');
      expect(comparison.newAnalyzedAt).toBe('2024-02-01T00:00:00Z');

      // Check overall score change
      expect(comparison.overallScoreChange.oldScore).toBe(65.5);
      expect(comparison.overallScoreChange.newScore).toBe(55.0);
      expect(comparison.overallScoreChange.scoreDelta).toBe(-10.5);
      expect(comparison.overallScoreChange.percentageChange).toBeCloseTo(-16.03, 1);

      // Check risk count change
      expect(comparison.riskCountChange.oldCount).toBe(3);
      expect(comparison.riskCountChange.newCount).toBe(3);
      expect(comparison.riskCountChange.countDelta).toBe(0);

      // Check score changes
      expect(comparison.scoreChanges).toHaveLength(1); // Only Timeline changed
      expect(comparison.scoreChanges[0].title).toBe('Timeline Compression Risk');
      expect(comparison.scoreChanges[0].scoreDelta).toBe(-10);

      // Check new risks
      expect(comparison.newRisks).toHaveLength(1);
      expect(comparison.newRisks[0].title).toBe('Technology Maturity Risk');

      // Check resolved risks
      expect(comparison.resolvedRisks).toHaveLength(1);
      expect(comparison.resolvedRisks[0].title).toBe('Team Experience Gap');
    });

    it('should throw error when comparing analyses from different projects', () => {
      const differentProjectAnalysis = {
        ...newAnalysis,
        projectId: 'project-456',
      };

      expect(() => compareAnalyses(oldAnalysis, differentProjectAnalysis)).toThrow(
        'Cannot compare analyses from different projects'
      );
    });

    it('should handle analyses with no risks', () => {
      const emptyOldAnalysis: RiskAnalysis = {
        id: 'analysis-1',
        projectId: 'project-123',
        overallScore: 0,
        analyzedAt: '2024-01-01T00:00:00Z',
        risks: [],
      };

      const emptyNewAnalysis: RiskAnalysis = {
        id: 'analysis-2',
        projectId: 'project-123',
        overallScore: 0,
        analyzedAt: '2024-02-01T00:00:00Z',
        risks: [],
      };

      const comparison = compareAnalyses(emptyOldAnalysis, emptyNewAnalysis);

      expect(comparison.overallScoreChange.scoreDelta).toBe(0);
      expect(comparison.riskCountChange.countDelta).toBe(0);
      expect(comparison.scoreChanges).toHaveLength(0);
      expect(comparison.newRisks).toHaveLength(0);
      expect(comparison.resolvedRisks).toHaveLength(0);
    });

    it('should calculate percentage change correctly when old score is zero', () => {
      const zeroScoreOld: RiskAnalysis = {
        id: 'analysis-1',
        projectId: 'project-123',
        overallScore: 0,
        analyzedAt: '2024-01-01T00:00:00Z',
        risks: [],
      };

      const nonZeroScoreNew: RiskAnalysis = {
        id: 'analysis-2',
        projectId: 'project-123',
        overallScore: 50,
        analyzedAt: '2024-02-01T00:00:00Z',
        risks: [],
      };

      const comparison = compareAnalyses(zeroScoreOld, nonZeroScoreNew);

      expect(comparison.overallScoreChange.percentageChange).toBe(100);
    });
  });

  describe('calculateRiskScoreChanges', () => {
    it('should identify risks with score changes', () => {
      const scoreChanges = calculateRiskScoreChanges(oldAnalysis, newAnalysis);

      expect(scoreChanges).toHaveLength(1);
      expect(scoreChanges[0].title).toBe('Timeline Compression Risk');
      expect(scoreChanges[0].category).toBe('Schedule');
      expect(scoreChanges[0].oldScore).toBe(75.0);
      expect(scoreChanges[0].newScore).toBe(65.0);
      expect(scoreChanges[0].scoreDelta).toBe(-10);
      expect(scoreChanges[0].percentageChange).toBeCloseTo(-13.33, 1);
    });

    it('should not include risks with no score change', () => {
      const scoreChanges = calculateRiskScoreChanges(oldAnalysis, newAnalysis);

      // Budget Constraint Risk has same score, should not be included
      const budgetRisk = scoreChanges.find((sc) => sc.title === 'Budget Constraint Risk');
      expect(budgetRisk).toBeUndefined();
    });

    it('should sort by absolute score delta (largest first)', () => {
      const multiChangeAnalysis: RiskAnalysis = {
        ...newAnalysis,
        risks: [
          {
            id: 'risk-4',
            title: 'Timeline Compression Risk',
            description: 'Project timeline is too tight',
            category: 'Schedule',
            score: 80.0, // +5 from 75
            probability: 0.8,
            impact: 0.8,
            status: 'Open',
          },
          {
            id: 'risk-5',
            title: 'Budget Constraint Risk',
            description: 'Budget may be insufficient',
            category: 'Budget',
            score: 50.0, // -20 from 70
            probability: 0.5,
            impact: 0.5,
            status: 'Open',
          },
          {
            id: 'risk-6',
            title: 'Team Experience Gap',
            description: 'Too many junior developers',
            category: 'Resource',
            score: 70.0, // +10 from 60
            probability: 0.7,
            impact: 0.7,
            status: 'Open',
          },
        ],
      };

      const scoreChanges = calculateRiskScoreChanges(oldAnalysis, multiChangeAnalysis);

      expect(scoreChanges).toHaveLength(3);
      // Should be sorted by absolute delta: -20, +10, +5
      expect(scoreChanges[0].title).toBe('Budget Constraint Risk');
      expect(scoreChanges[0].scoreDelta).toBe(-20);
      expect(scoreChanges[1].title).toBe('Team Experience Gap');
      expect(scoreChanges[1].scoreDelta).toBe(10);
      expect(scoreChanges[2].title).toBe('Timeline Compression Risk');
      expect(scoreChanges[2].scoreDelta).toBe(5);
    });

    it('should handle percentage change when old score is zero', () => {
      const zeroScoreOld: RiskAnalysis = {
        ...oldAnalysis,
        risks: [
          {
            id: 'risk-1',
            title: 'Test Risk',
            description: 'Test',
            category: 'Technical',
            score: 0,
            probability: 0,
            impact: 0,
            status: 'Open',
          },
        ],
      };

      const nonZeroScoreNew: RiskAnalysis = {
        ...newAnalysis,
        risks: [
          {
            id: 'risk-2',
            title: 'Test Risk',
            description: 'Test',
            category: 'Technical',
            score: 50,
            probability: 0.5,
            impact: 0.5,
            status: 'Open',
          },
        ],
      };

      const scoreChanges = calculateRiskScoreChanges(zeroScoreOld, nonZeroScoreNew);

      expect(scoreChanges).toHaveLength(1);
      expect(scoreChanges[0].percentageChange).toBe(100);
    });
  });

  describe('identifyNewRisks', () => {
    it('should identify risks that appear in new analysis but not old', () => {
      const newRisks = identifyNewRisks(oldAnalysis, newAnalysis);

      expect(newRisks).toHaveLength(1);
      expect(newRisks[0].title).toBe('Technology Maturity Risk');
      expect(newRisks[0].category).toBe('Technical');
      expect(newRisks[0].score).toBe(60.0);
      expect(newRisks[0].description).toBe('Using experimental technologies');
    });

    it('should return empty array when no new risks', () => {
      const sameRisksAnalysis: RiskAnalysis = {
        ...newAnalysis,
        risks: oldAnalysis.risks,
      };

      const newRisks = identifyNewRisks(oldAnalysis, sameRisksAnalysis);

      expect(newRisks).toHaveLength(0);
    });

    it('should sort new risks by score (highest first)', () => {
      const multiNewRisksAnalysis: RiskAnalysis = {
        ...newAnalysis,
        risks: [
          ...oldAnalysis.risks,
          {
            id: 'risk-7',
            title: 'Low Risk',
            description: 'Low priority risk',
            category: 'External',
            score: 30.0,
            probability: 0.3,
            impact: 0.3,
            status: 'Open',
          },
          {
            id: 'risk-8',
            title: 'High Risk',
            description: 'High priority risk',
            category: 'Technical',
            score: 85.0,
            probability: 0.9,
            impact: 0.8,
            status: 'Open',
          },
          {
            id: 'risk-9',
            title: 'Medium Risk',
            description: 'Medium priority risk',
            category: 'Resource',
            score: 55.0,
            probability: 0.5,
            impact: 0.6,
            status: 'Open',
          },
        ],
      };

      const newRisks = identifyNewRisks(oldAnalysis, multiNewRisksAnalysis);

      expect(newRisks).toHaveLength(3);
      expect(newRisks[0].title).toBe('High Risk');
      expect(newRisks[0].score).toBe(85.0);
      expect(newRisks[1].title).toBe('Medium Risk');
      expect(newRisks[1].score).toBe(55.0);
      expect(newRisks[2].title).toBe('Low Risk');
      expect(newRisks[2].score).toBe(30.0);
    });
  });

  describe('identifyResolvedRisks', () => {
    it('should identify risks that were in old analysis but not in new', () => {
      const resolvedRisks = identifyResolvedRisks(oldAnalysis, newAnalysis);

      expect(resolvedRisks).toHaveLength(1);
      expect(resolvedRisks[0].title).toBe('Team Experience Gap');
      expect(resolvedRisks[0].category).toBe('Resource');
      expect(resolvedRisks[0].score).toBe(60.0);
    });

    it('should return empty array when no resolved risks', () => {
      const sameRisksAnalysis: RiskAnalysis = {
        ...newAnalysis,
        risks: oldAnalysis.risks,
      };

      const resolvedRisks = identifyResolvedRisks(oldAnalysis, sameRisksAnalysis);

      expect(resolvedRisks).toHaveLength(0);
    });

    it('should sort resolved risks by score (highest first)', () => {
      const multiResolvedAnalysis: RiskAnalysis = {
        ...newAnalysis,
        risks: [], // All risks resolved
      };

      const resolvedRisks = identifyResolvedRisks(oldAnalysis, multiResolvedAnalysis);

      expect(resolvedRisks).toHaveLength(3);
      // Should be sorted by score: 75, 70, 60
      expect(resolvedRisks[0].title).toBe('Timeline Compression Risk');
      expect(resolvedRisks[0].score).toBe(75.0);
      expect(resolvedRisks[1].title).toBe('Budget Constraint Risk');
      expect(resolvedRisks[1].score).toBe(70.0);
      expect(resolvedRisks[2].title).toBe('Team Experience Gap');
      expect(resolvedRisks[2].score).toBe(60.0);
    });
  });

  describe('Edge cases', () => {
    it('should handle risks with same title but different category', () => {
      const analysisWithDuplicateTitle: RiskAnalysis = {
        ...oldAnalysis,
        risks: [
          {
            id: 'risk-1',
            title: 'Resource Risk',
            description: 'Team resource issue',
            category: 'Resource',
            score: 60.0,
            probability: 0.6,
            impact: 0.6,
            status: 'Open',
          },
          {
            id: 'risk-2',
            title: 'Resource Risk',
            description: 'Budget resource issue',
            category: 'Budget',
            score: 70.0,
            probability: 0.7,
            impact: 0.7,
            status: 'Open',
          },
        ],
      };

      const newAnalysisWithDuplicateTitle: RiskAnalysis = {
        ...newAnalysis,
        risks: [
          {
            id: 'risk-3',
            title: 'Resource Risk',
            description: 'Team resource issue',
            category: 'Resource',
            score: 50.0, // Changed
            probability: 0.5,
            impact: 0.5,
            status: 'Open',
          },
          {
            id: 'risk-4',
            title: 'Resource Risk',
            description: 'Budget resource issue',
            category: 'Budget',
            score: 70.0, // Same
            probability: 0.7,
            impact: 0.7,
            status: 'Open',
          },
        ],
      };

      const scoreChanges = calculateRiskScoreChanges(
        analysisWithDuplicateTitle,
        newAnalysisWithDuplicateTitle
      );

      // Should only detect change in Resource category, not Budget
      expect(scoreChanges).toHaveLength(1);
      expect(scoreChanges[0].category).toBe('Resource');
      expect(scoreChanges[0].scoreDelta).toBe(-10);
    });
  });
});

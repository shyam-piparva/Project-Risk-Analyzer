/**
 * Dashboard Metrics Service Tests
 * Tests for dashboard metric calculations
 */

import {
  calculateOverallRiskScore,
  countRisksByCategory,
  countRisksBySeverity,
  calculateMitigationStatistics,
  calculateAverageTimeToResolution,
  getDashboardMetrics,
} from './dashboardMetricsService';

// Mock the logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Dashboard Metrics Service', () => {
  describe('calculateOverallRiskScore', () => {
    it('should return 0 for empty array', () => {
      expect(calculateOverallRiskScore([])).toBe(0);
    });

    it('should return the score for single risk', () => {
      expect(calculateOverallRiskScore([75])).toBe(75);
    });

    it('should calculate weighted average for multiple risks', () => {
      const score = calculateOverallRiskScore([80, 60, 40]);
      expect(score).toBeGreaterThan(60);
      expect(score).toBeLessThan(80);
      // Weighted average with exponential weighting gives higher weight to higher scores
      expect(score).toBeCloseTo(66.45, 1);
    });

    it('should give more weight to higher risks', () => {
      const scoreWithHighRisk = calculateOverallRiskScore([90, 30, 30]);
      const scoreWithoutHighRisk = calculateOverallRiskScore([50, 50, 50]);
      expect(scoreWithHighRisk).toBeGreaterThan(scoreWithoutHighRisk);
    });

    it('should handle all low risks', () => {
      const score = calculateOverallRiskScore([10, 20, 30]);
      // With exponential weighting, higher risks get more weight even among low scores
      expect(score).toBeCloseTo(24.65, 1);
    });

    it('should handle all high risks', () => {
      const score = calculateOverallRiskScore([90, 95, 100]);
      expect(score).toBeGreaterThan(90);
    });

    it('should throw error for invalid scores', () => {
      expect(() => calculateOverallRiskScore([101])).toThrow();
      expect(() => calculateOverallRiskScore([-1])).toThrow();
      expect(() => calculateOverallRiskScore([50, 150])).toThrow();
    });

    it('should return value between 0 and 100', () => {
      const score = calculateOverallRiskScore([0, 50, 100]);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('countRisksByCategory', () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        query: jest.fn(),
      };
    });

    it('should count risks by category', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [
          { category: 'Technical', count: '5' },
          { category: 'Schedule', count: '3' },
          { category: 'Budget', count: '2' },
        ],
      } as any);

      const result = await countRisksByCategory(mockDb, 'analysis-123');

      expect(result).toEqual([
        { category: 'Technical', count: 5 },
        { category: 'Schedule', count: 3 },
        { category: 'Budget', count: 2 },
      ]);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY category'),
        ['analysis-123']
      );
    });

    it('should return empty array when no risks', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await countRisksByCategory(mockDb, 'analysis-123');

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      (mockDb.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(countRisksByCategory(mockDb, 'analysis-123')).rejects.toThrow(
        'Failed to count risks by category'
      );
    });
  });

  describe('countRisksBySeverity', () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        query: jest.fn(),
      };
    });

    it('should count risks by severity', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [
          { severity: 'High', count: '4' },
          { severity: 'Medium', count: '6' },
          { severity: 'Low', count: '2' },
        ],
      } as any);

      const result = await countRisksBySeverity(mockDb, 'analysis-123');

      expect(result).toEqual([
        { severity: 'High', count: 4 },
        { severity: 'Medium', count: 6 },
        { severity: 'Low', count: 2 },
      ]);
    });

    it('should handle missing severity levels', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [{ severity: 'High', count: '3' }],
      });

      const result = await countRisksBySeverity(mockDb, 'analysis-123');

      expect(result).toEqual([{ severity: 'High', count: 3 }]);
    });

    it('should throw error on database failure', async () => {
      (mockDb.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(countRisksBySeverity(mockDb, 'analysis-123')).rejects.toThrow(
        'Failed to count risks by severity'
      );
    });
  });

  describe('calculateMitigationStatistics', () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        query: jest.fn(),
      };
    });

    it('should calculate mitigation statistics', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            total_mitigations: '10',
            implemented_mitigations: '6',
          },
        ],
      } as any);

      const result = await calculateMitigationStatistics(mockDb, 'analysis-123');

      expect(result).toEqual({
        totalMitigations: 10,
        implementedMitigations: 6,
        pendingMitigations: 4,
        implementationRate: 60,
      });
    });

    it('should handle zero mitigations', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            total_mitigations: '0',
            implemented_mitigations: '0',
          },
        ],
      });

      const result = await calculateMitigationStatistics(mockDb, 'analysis-123');

      expect(result).toEqual({
        totalMitigations: 0,
        implementedMitigations: 0,
        pendingMitigations: 0,
        implementationRate: 0,
      });
    });

    it('should calculate correct implementation rate', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            total_mitigations: '8',
            implemented_mitigations: '7',
          },
        ],
      });

      const result = await calculateMitigationStatistics(mockDb, 'analysis-123');

      expect(result.implementationRate).toBe(87.5);
    });

    it('should throw error on database failure', async () => {
      (mockDb.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(calculateMitigationStatistics(mockDb, 'analysis-123')).rejects.toThrow(
        'Failed to calculate mitigation statistics'
      );
    });
  });

  describe('calculateAverageTimeToResolution', () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        query: jest.fn(),
      };
    });

    it('should calculate average time to resolution', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [{ avg_days: '5.5' }],
      });

      const result = await calculateAverageTimeToResolution(mockDb, 'project-123');

      expect(result).toBe(5.5);
    });

    it('should return null when no resolved risks', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [{ avg_days: null }],
      });

      const result = await calculateAverageTimeToResolution(mockDb, 'project-123');

      expect(result).toBeNull();
    });

    it('should round to 2 decimal places', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [{ avg_days: '7.123456' }],
      });

      const result = await calculateAverageTimeToResolution(mockDb, 'project-123');

      expect(result).toBe(7.12);
    });

    it('should throw error on database failure', async () => {
      (mockDb.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(calculateAverageTimeToResolution(mockDb, 'project-123')).rejects.toThrow(
        'Failed to calculate average time to resolution'
      );
    });
  });

  describe('getDashboardMetrics', () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        query: jest.fn(),
      };
    });

    it('should return null when no analysis exists', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await getDashboardMetrics(mockDb, 'project-123');

      expect(result).toBeNull();
    });

    it('should return complete dashboard metrics', async () => {
      // Mock latest analysis query
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 'analysis-123', overall_score: '75.5' }],
        })
        // Mock status counts query
        .mockResolvedValueOnce({
          rows: [
            {
              total_risks: '10',
              high_priority_risks: '3',
              mitigated_risks: '2',
              open_risks: '5',
            },
          ],
        })
        // Mock category counts
        .mockResolvedValueOnce({
          rows: [
            { category: 'Technical', count: '4' },
            { category: 'Schedule', count: '3' },
          ],
        })
        // Mock severity counts
        .mockResolvedValueOnce({
          rows: [
            { severity: 'High', count: '3' },
            { severity: 'Medium', count: '5' },
          ],
        })
        // Mock mitigation statistics
        .mockResolvedValueOnce({
          rows: [{ total_mitigations: '15', implemented_mitigations: '8' }],
        })
        // Mock average time to resolution
        .mockResolvedValueOnce({
          rows: [{ avg_days: '4.5' }],
        });

      const result = await getDashboardMetrics(mockDb, 'project-123');

      expect(result).toEqual({
        totalRisks: 10,
        highPriorityRisks: 3,
        mitigatedRisks: 2,
        openRisks: 5,
        overallRiskScore: 75.5,
        risksByCategory: [
          { category: 'Technical', count: 4 },
          { category: 'Schedule', count: 3 },
        ],
        risksBySeverity: [
          { severity: 'High', count: 3 },
          { severity: 'Medium', count: 5 },
        ],
        mitigationStatistics: {
          totalMitigations: 15,
          implementedMitigations: 8,
          pendingMitigations: 7,
          implementationRate: 53.33,
        },
        averageTimeToResolution: 4.5,
      });
    });

    it('should throw error on database failure', async () => {
      (mockDb.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getDashboardMetrics(mockDb, 'project-123')).rejects.toThrow(
        'Failed to get dashboard metrics'
      );
    });
  });
});

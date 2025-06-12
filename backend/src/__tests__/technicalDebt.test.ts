import {
  calculateTicketImpactScore,
  calculateUsageHealthScore,
  calculateTechnicalDebtScore,
  generateRecommendations,
  getScoreCategory,
  validateScoringInputs,
  SEVERITY_WEIGHTS,
  UNUSED_KEY_MODULE_PENALTY,
  UNUSED_REGULAR_MODULE_PENALTY,
  USAGE_DROP_THRESHOLD
} from '../utils/scoringUtils';
import { TicketCounts, UsageMetrics } from '../services/technicalDebtService';

describe('Technical Debt Scoring Algorithm', () => {
  describe('calculateTicketImpactScore', () => {
    it('should calculate correct impact score with all severity types', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 2,
        SEVERE: 3,
        MODERATE: 4,
        LOW: 5
      };

      const expectedScore = (2 * 4) + (3 * 3) + (4 * 2) + (5 * 1); // 8 + 9 + 8 + 5 = 30
      expect(calculateTicketImpactScore(ticketCounts)).toBe(expectedScore);
    });

    it('should handle zero tickets', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 0,
        SEVERE: 0,
        MODERATE: 0,
        LOW: 0
      };

      expect(calculateTicketImpactScore(ticketCounts)).toBe(0);
    });

    it('should handle only critical tickets', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 5,
        SEVERE: 0,
        MODERATE: 0,
        LOW: 0
      };

      expect(calculateTicketImpactScore(ticketCounts)).toBe(20);
    });

    it('should use correct severity weights', () => {
      expect(SEVERITY_WEIGHTS.CRITICAL).toBe(4);
      expect(SEVERITY_WEIGHTS.SEVERE).toBe(3);
      expect(SEVERITY_WEIGHTS.MODERATE).toBe(2);
      expect(SEVERITY_WEIGHTS.LOW).toBe(1);
    });
  });

  describe('calculateUsageHealthScore', () => {
    it('should return 100 for healthy usage', () => {
      const usageMetrics: UsageMetrics = {
        currentUsage: 1000,
        previousUsage: 1000,
        usageDropPercentage: 0,
        isZeroUsage: false
      };

      expect(calculateUsageHealthScore(usageMetrics, false)).toBe(100);
    });

    it('should apply zero usage penalty for regular modules', () => {
      const usageMetrics: UsageMetrics = {
        currentUsage: 0,
        previousUsage: 1000,
        usageDropPercentage: 0,
        isZeroUsage: true
      };

      const expectedScore = 100 - UNUSED_REGULAR_MODULE_PENALTY;
      expect(calculateUsageHealthScore(usageMetrics, false)).toBe(expectedScore);
    });

    it('should apply zero usage penalty for key modules', () => {
      const usageMetrics: UsageMetrics = {
        currentUsage: 0,
        previousUsage: 1000,
        usageDropPercentage: 0,
        isZeroUsage: true
      };

      const expectedScore = 100 - UNUSED_KEY_MODULE_PENALTY;
      expect(calculateUsageHealthScore(usageMetrics, true)).toBe(expectedScore);
    });

    it('should apply usage drop penalty when drop exceeds threshold', () => {
      const usageMetrics: UsageMetrics = {
        currentUsage: 500,
        previousUsage: 1000,
        usageDropPercentage: 50,
        isZeroUsage: false
      };

      // Should apply both drop percentage and unused penalty for key module
      const expectedScore = 100 - 50 - UNUSED_KEY_MODULE_PENALTY;
      expect(calculateUsageHealthScore(usageMetrics, true)).toBe(expectedScore);
    });

    it('should not go below zero', () => {
      const usageMetrics: UsageMetrics = {
        currentUsage: 0,
        previousUsage: 1000,
        usageDropPercentage: 100,
        isZeroUsage: true
      };

      expect(calculateUsageHealthScore(usageMetrics, true)).toBe(0);
    });

    it('should handle small usage drops without penalty', () => {
      const usageMetrics: UsageMetrics = {
        currentUsage: 800,
        previousUsage: 1000,
        usageDropPercentage: 20, // Below 30% threshold
        isZeroUsage: false
      };

      const expectedScore = 100 - 20; // Only drop percentage, no unused penalty
      expect(calculateUsageHealthScore(usageMetrics, false)).toBe(expectedScore);
    });
  });

  describe('calculateTechnicalDebtScore', () => {
    it('should calculate correct technical debt score', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 1,
        SEVERE: 2,
        MODERATE: 1,
        LOW: 1
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: 1000,
        previousUsage: 1000,
        usageDropPercentage: 0,
        isZeroUsage: false
      };

      const ticketImpactScore = calculateTicketImpactScore(ticketCounts); // 1*4 + 2*3 + 1*2 + 1*1 = 13
      const usageHealthScore = calculateUsageHealthScore(usageMetrics, false); // 100
      const expectedDebtScore = (ticketImpactScore * 2) + (100 - usageHealthScore); // (13 * 2) + 0 = 26

      expect(calculateTechnicalDebtScore(ticketCounts, usageMetrics, false)).toBe(expectedDebtScore);
    });

    it('should handle high debt scenario', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 10,
        SEVERE: 5,
        MODERATE: 3,
        LOW: 2
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: 0,
        previousUsage: 1000,
        usageDropPercentage: 0,
        isZeroUsage: true
      };

      const debtScore = calculateTechnicalDebtScore(ticketCounts, usageMetrics, true);
      expect(debtScore).toBeGreaterThan(150); // Should be in high risk range
    });
  });

  describe('getScoreCategory', () => {
    it('should categorize scores correctly', () => {
      expect(getScoreCategory(25)).toBe('Good');
      expect(getScoreCategory(50)).toBe('Good');
      expect(getScoreCategory(75)).toBe('Moderate Risk');
      expect(getScoreCategory(100)).toBe('Moderate Risk');
      expect(getScoreCategory(150)).toBe('High Risk');
      expect(getScoreCategory(200)).toBe('High Risk');
      expect(getScoreCategory(250)).toBe('Critical');
    });

    it('should handle edge cases', () => {
      expect(getScoreCategory(0)).toBe('Good');
      expect(getScoreCategory(51)).toBe('Moderate Risk');
      expect(getScoreCategory(101)).toBe('High Risk');
      expect(getScoreCategory(201)).toBe('Critical');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate critical ticket recommendations', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 3,
        SEVERE: 0,
        MODERATE: 0,
        LOW: 0
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: 1000,
        previousUsage: 1000,
        usageDropPercentage: 0,
        isZeroUsage: false
      };

      const recommendations = generateRecommendations(50, ticketCounts, usageMetrics, false);
      expect(recommendations.some((r: string) => r.includes('critical ticket'))).toBe(true);
      expect(recommendations.some((r: string) => r.includes('3 critical'))).toBe(true);
    });

    it('should generate zero usage recommendations for key modules', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 0,
        SEVERE: 0,
        MODERATE: 0,
        LOW: 0
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: 0,
        previousUsage: 1000,
        usageDropPercentage: 0,
        isZeroUsage: true
      };

      const recommendations = generateRecommendations(100, ticketCounts, usageMetrics, true);
      expect(recommendations.some((r: string) => r.includes('URGENT'))).toBe(true);
      expect(recommendations.some((r: string) => r.includes('Key module'))).toBe(true);
    });

    it('should generate usage drop recommendations', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 0,
        SEVERE: 0,
        MODERATE: 0,
        LOW: 0
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: 500,
        previousUsage: 1000,
        usageDropPercentage: 50,
        isZeroUsage: false
      };

      const recommendations = generateRecommendations(75, ticketCounts, usageMetrics, false);
      expect(recommendations.some((r: string) => r.includes('usage drop'))).toBe(true);
      expect(recommendations.some((r: string) => r.includes('50.0%'))).toBe(true);
    });

    it('should generate score-based recommendations', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 0,
        SEVERE: 0,
        MODERATE: 0,
        LOW: 0
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: 1000,
        previousUsage: 1000,
        usageDropPercentage: 0,
        isZeroUsage: false
      };

      // Test critical score
      let recommendations = generateRecommendations(250, ticketCounts, usageMetrics, false);
      expect(recommendations.some((r: string) => r.includes('CRITICAL'))).toBe(true);

      // Test high risk score
      recommendations = generateRecommendations(150, ticketCounts, usageMetrics, false);
      expect(recommendations.some((r: string) => r.includes('HIGH RISK'))).toBe(true);

      // Test moderate risk score
      recommendations = generateRecommendations(75, ticketCounts, usageMetrics, false);
      expect(recommendations.some((r: string) => r.includes('MODERATE RISK'))).toBe(true);

      // Test good score
      recommendations = generateRecommendations(25, ticketCounts, usageMetrics, false);
      expect(recommendations.some((r: string) => r.includes('good health'))).toBe(true);
    });

    it('should generate high ticket volume recommendations', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 3,
        SEVERE: 3,
        MODERATE: 3,
        LOW: 3
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: 1000,
        previousUsage: 1000,
        usageDropPercentage: 0,
        isZeroUsage: false
      };

      const recommendations = generateRecommendations(100, ticketCounts, usageMetrics, false);
      expect(recommendations.some((r: string) => r.includes('High ticket volume'))).toBe(true);
      expect(recommendations.some((r: string) => r.includes('12 tickets'))).toBe(true);
    });

    it('should generate key module specific recommendations', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 1,
        SEVERE: 0,
        MODERATE: 0,
        LOW: 0
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: 1000,
        previousUsage: 1000,
        usageDropPercentage: 0,
        isZeroUsage: false
      };

      const recommendations = generateRecommendations(60, ticketCounts, usageMetrics, true);
      expect(recommendations.some((r: string) => r.includes('key module'))).toBe(true);
    });
  });

  describe('validateScoringInputs', () => {
    it('should pass validation for valid inputs', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 1,
        SEVERE: 2,
        MODERATE: 3,
        LOW: 4
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: 1000,
        previousUsage: 800,
        usageDropPercentage: 20,
        isZeroUsage: false
      };

      const errors = validateScoringInputs(ticketCounts, usageMetrics);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid ticket counts', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: -1,
        SEVERE: 2.5,
        MODERATE: 3,
        LOW: 4
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: 1000,
        previousUsage: 800,
        usageDropPercentage: 20,
        isZeroUsage: false
      };

      const errors = validateScoringInputs(ticketCounts, usageMetrics);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e: string) => e.includes('CRITICAL'))).toBe(true);
      expect(errors.some((e: string) => e.includes('SEVERE'))).toBe(true);
    });

    it('should detect invalid usage metrics', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 1,
        SEVERE: 2,
        MODERATE: 3,
        LOW: 4
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: -100,
        previousUsage: 800,
        usageDropPercentage: -10,
        isZeroUsage: false
      };

      const errors = validateScoringInputs(ticketCounts, usageMetrics);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e: string) => e.includes('current usage'))).toBe(true);
      expect(errors.some((e: string) => e.includes('usage drop percentage'))).toBe(true);
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle extremely large ticket counts', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 1000,
        SEVERE: 1000,
        MODERATE: 1000,
        LOW: 1000
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: 1000,
        previousUsage: 1000,
        usageDropPercentage: 0,
        isZeroUsage: false
      };

      const score = calculateTechnicalDebtScore(ticketCounts, usageMetrics, false);
      expect(score).toBeGreaterThan(10000);
      expect(typeof score).toBe('number');
      expect(Number.isFinite(score)).toBe(true);
    });

    it('should handle zero previous usage', () => {
      const usageMetrics: UsageMetrics = {
        currentUsage: 1000,
        previousUsage: 0,
        usageDropPercentage: 0,
        isZeroUsage: false
      };

      const score = calculateUsageHealthScore(usageMetrics, false);
      expect(score).toBe(100);
    });

    it('should handle missing data gracefully', () => {
      const ticketCounts: TicketCounts = {
        CRITICAL: 0,
        SEVERE: 0,
        MODERATE: 0,
        LOW: 0
      };

      const usageMetrics: UsageMetrics = {
        currentUsage: 0,
        previousUsage: 0,
        usageDropPercentage: 0,
        isZeroUsage: true
      };

      const score = calculateTechnicalDebtScore(ticketCounts, usageMetrics, false);
      expect(typeof score).toBe('number');
      expect(Number.isFinite(score)).toBe(true);
    });
  });
});

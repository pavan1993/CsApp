import { TicketCounts, UsageMetrics } from '../services/technicalDebtService';

export type ScoreCategory = 'Good' | 'Moderate Risk' | 'High Risk' | 'Critical';

// Severity weights as specified
export const SEVERITY_WEIGHTS = {
  CRITICAL: 4,
  SEVERE: 3,
  MODERATE: 2,
  LOW: 1
} as const;

// Penalty constants
export const UNUSED_KEY_MODULE_PENALTY = 50;
export const UNUSED_REGULAR_MODULE_PENALTY = 25;
export const USAGE_DROP_THRESHOLD = 30; // 30% drop threshold

/**
 * Calculate the ticket impact score based on severity counts and weights
 */
export function calculateTicketImpactScore(ticketCounts: TicketCounts): number {
  return (
    ticketCounts.CRITICAL * SEVERITY_WEIGHTS.CRITICAL +
    ticketCounts.SEVERE * SEVERITY_WEIGHTS.SEVERE +
    ticketCounts.MODERATE * SEVERITY_WEIGHTS.MODERATE +
    ticketCounts.LOW * SEVERITY_WEIGHTS.LOW
  );
}

/**
 * Calculate the usage health score
 */
export function calculateUsageHealthScore(usageMetrics: UsageMetrics, isKeyModule: boolean): number {
  let penalty = 0;

  // Apply zero usage penalty
  if (usageMetrics.isZeroUsage) {
    penalty += isKeyModule ? UNUSED_KEY_MODULE_PENALTY : UNUSED_REGULAR_MODULE_PENALTY;
  }
  // Apply usage drop penalty if drop is significant
  else if (usageMetrics.usageDropPercentage >= USAGE_DROP_THRESHOLD) {
    penalty += isKeyModule ? UNUSED_KEY_MODULE_PENALTY : UNUSED_REGULAR_MODULE_PENALTY;
  }

  // Add usage drop percentage to penalty
  penalty += usageMetrics.usageDropPercentage;

  return Math.max(0, 100 - penalty);
}

/**
 * Calculate the overall technical debt score
 */
export function calculateTechnicalDebtScore(
  ticketCounts: TicketCounts,
  usageMetrics: UsageMetrics,
  isKeyModule: boolean
): number {
  const ticketImpactScore = calculateTicketImpactScore(ticketCounts);
  const usageHealthScore = calculateUsageHealthScore(usageMetrics, isKeyModule);
  
  // Technical Debt Score = (Ticket_Impact_Score * 2) + (100 - Usage_Health_Score)
  return (ticketImpactScore * 2) + (100 - usageHealthScore);
}

/**
 * Generate actionable recommendations based on score and contributing factors
 */
export function generateRecommendations(
  debtScore: number,
  ticketCounts: TicketCounts,
  usageMetrics: UsageMetrics,
  isKeyModule: boolean
): string[] {
  const recommendations: string[] = [];

  // Critical ticket recommendations
  if (ticketCounts.CRITICAL > 0) {
    recommendations.push(`Address ${ticketCounts.CRITICAL} critical ticket(s) immediately - these have the highest impact on technical debt.`);
  }

  // Severe ticket recommendations
  if (ticketCounts.SEVERE > 2) {
    recommendations.push(`High volume of severe tickets (${ticketCounts.SEVERE}) detected. Consider dedicating additional resources to resolve these issues.`);
  }

  // Usage-based recommendations
  if (usageMetrics.isZeroUsage) {
    if (isKeyModule) {
      recommendations.push('URGENT: Key module shows zero usage. Investigate potential system failures or user adoption issues.');
    } else {
      recommendations.push('Module shows zero usage. Consider deprecation or investigate integration issues.');
    }
  } else if (usageMetrics.usageDropPercentage >= USAGE_DROP_THRESHOLD) {
    recommendations.push(`Significant usage drop detected (${usageMetrics.usageDropPercentage.toFixed(1)}%). Investigate potential performance issues or user experience problems.`);
  }

  // Score-based recommendations
  if (debtScore >= 200) {
    recommendations.push('CRITICAL: Immediate action required. Consider emergency response team allocation.');
    recommendations.push('Schedule daily standups to track progress on critical issues.');
  } else if (debtScore >= 101) {
    recommendations.push('HIGH RISK: Prioritize this module in the next sprint planning.');
    recommendations.push('Consider code review and refactoring initiatives.');
  } else if (debtScore >= 51) {
    recommendations.push('MODERATE RISK: Monitor closely and address issues proactively.');
    recommendations.push('Schedule regular maintenance windows for this module.');
  } else {
    recommendations.push('Module is in good health. Continue current maintenance practices.');
  }

  // Ticket volume recommendations
  const totalTickets = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);
  if (totalTickets > 10) {
    recommendations.push(`High ticket volume (${totalTickets} tickets). Consider root cause analysis to identify systemic issues.`);
  }

  // Key module specific recommendations
  if (isKeyModule && debtScore > 50) {
    recommendations.push('This is a key module - consider additional monitoring and faster response times.');
  }

  return recommendations;
}

/**
 * Get score category based on debt score
 */
export function getScoreCategory(score: number): ScoreCategory {
  if (score <= 50) return 'Good';
  if (score <= 100) return 'Moderate Risk';
  if (score <= 200) return 'High Risk';
  return 'Critical';
}

/**
 * Validate input data for scoring calculations
 */
export function validateScoringInputs(
  ticketCounts: TicketCounts,
  usageMetrics: UsageMetrics
): string[] {
  const errors: string[] = [];

  // Validate ticket counts
  Object.entries(ticketCounts).forEach(([severity, count]) => {
    if (typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
      errors.push(`Invalid ticket count for ${severity}: must be a non-negative integer`);
    }
  });

  // Validate usage metrics
  if (typeof usageMetrics.currentUsage !== 'number' || usageMetrics.currentUsage < 0) {
    errors.push('Invalid current usage: must be a non-negative number');
  }

  if (typeof usageMetrics.previousUsage !== 'number' || usageMetrics.previousUsage < 0) {
    errors.push('Invalid previous usage: must be a non-negative number');
  }

  if (typeof usageMetrics.usageDropPercentage !== 'number' || usageMetrics.usageDropPercentage < 0) {
    errors.push('Invalid usage drop percentage: must be a non-negative number');
  }

  if (typeof usageMetrics.isZeroUsage !== 'boolean') {
    errors.push('Invalid zero usage flag: must be a boolean');
  }

  return errors;
}

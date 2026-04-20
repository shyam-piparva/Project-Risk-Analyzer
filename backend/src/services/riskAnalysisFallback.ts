/**
 * Risk Analysis Fallback Service
 * Provides basic risk analysis when Python service is unavailable
 * Uses rule-based analysis engine
 */

import { Project } from './projectService';
import { calculateRiskScore, RiskPrediction } from './riskAnalysisEngine';
import { randomUUID } from 'crypto';

interface RiskAnalysisResult {
  id: string;
  projectId: string;
  overallScore: number;
  analyzedAt: string;
  risks: Array<{
    id: string;
    analysisId: string;
    title: string;
    description: string;
    category: string;
    score: number;
    probability: number;
    impact: number;
    status: string;
    mitigations: Array<{
      id: string;
      riskId: string;
      strategy: string;
      priority: string;
      estimatedEffort: string;
      isImplemented: boolean;
      implementedAt: string | null;
      isCustom: boolean;
      createdAt: string;
    }>;
    detectedAt: string;
    resolvedAt: string | null;
  }>;
  metadata: {
    modelVersion: string;
    engineVersion: string;
    processingTime: number;
    dataCompleteness: number;
  };
}

/**
 * Analyze project using rule-based engine
 */
export async function analyzeProjectFallback(project: Project): Promise<RiskAnalysisResult> {
  const startTime = Date.now();
  const analysisId = randomUUID();
  const now = new Date().toISOString();

  const risks: RiskPrediction[] = [];

  // Rule 1: Timeline Compression Risk
  const projectDuration = Math.ceil(
    (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) /
      (1000 * 60 * 60 * 24 * 30)
  ); // months

  if (projectDuration < 3) {
    const probability = 0.8;
    const impact = 0.7;
    risks.push({
      title: 'Timeline Compression Risk',
      description: `Project timeline of ${projectDuration} months is aggressive and may lead to rushed development, quality issues, and team burnout.`,
      category: 'Schedule',
      score: calculateRiskScore(probability, impact),
      probability,
      impact,
      mitigations: [
        {
          strategy: 'Implement agile methodology with 2-week sprints to maintain flexibility',
          priority: 'High',
          estimatedEffort: '1 week',
        },
        {
          strategy: 'Prioritize core features and defer nice-to-have features to later phases',
          priority: 'High',
          estimatedEffort: '3 days',
        },
        {
          strategy: 'Add buffer time (20%) to critical path activities',
          priority: 'Medium',
          estimatedEffort: '2 days',
        },
      ],
    });
  }

  // Rule 2: Budget Constraint Risk
  const estimatedCostPerMonth = project.teamSize * 10000; // Rough estimate
  const estimatedTotalCost = estimatedCostPerMonth * projectDuration;

  if (project.budget < estimatedTotalCost * 0.8) {
    const probability = 0.7;
    const impact = 0.8;
    risks.push({
      title: 'Budget Constraint Risk',
      description: `Budget of $${project.budget.toLocaleString()} may be insufficient for a ${projectDuration}-month project with ${project.teamSize} team members. Estimated cost: $${estimatedTotalCost.toLocaleString()}.`,
      category: 'Budget',
      score: calculateRiskScore(probability, impact),
      probability,
      impact,
      mitigations: [
        {
          strategy: 'Conduct detailed cost estimation and secure additional funding if needed',
          priority: 'High',
          estimatedEffort: '1 week',
        },
        {
          strategy: 'Implement strict budget tracking and monthly reviews',
          priority: 'High',
          estimatedEffort: '2 days',
        },
        {
          strategy: 'Identify cost-saving opportunities (e.g., open-source tools, cloud optimization)',
          priority: 'Medium',
          estimatedEffort: '1 week',
        },
      ],
    });
  }

  // Rule 3: Team Experience Gap Risk
  const juniorCount =
    project.teamComposition?.filter((m) => m.experienceLevel === 'Junior').reduce((sum, m) => sum + m.count, 0) || 0;
  const totalMembers = project.teamComposition?.reduce((sum, m) => sum + m.count, 0) || project.teamSize;
  const juniorRatio = totalMembers > 0 ? juniorCount / totalMembers : 0;

  if (juniorRatio > 0.4) {
    const probability = 0.6;
    const impact = 0.6;
    risks.push({
      title: 'Team Experience Gap',
      description: `${Math.round(juniorRatio * 100)}% of the team consists of junior members, which may impact productivity and code quality.`,
      category: 'Resource',
      score: calculateRiskScore(probability, impact),
      probability,
      impact,
      mitigations: [
        {
          strategy: 'Implement mentorship program pairing junior developers with senior team members',
          priority: 'High',
          estimatedEffort: '1 week',
        },
        {
          strategy: 'Provide training and upskilling opportunities for junior team members',
          priority: 'Medium',
          estimatedEffort: '2 weeks',
        },
        {
          strategy: 'Establish code review process with senior developers reviewing all code',
          priority: 'High',
          estimatedEffort: '3 days',
        },
      ],
    });
  }

  // Rule 4: Technology Maturity Risk
  const experimentalTech =
    project.technologyStack?.filter((t) => t.maturity === 'Experimental').length || 0;

  if (experimentalTech > 0) {
    const probability = 0.5;
    const impact = 0.7;
    risks.push({
      title: 'Technology Maturity Risk',
      description: `Project uses ${experimentalTech} experimental ${experimentalTech === 1 ? 'technology' : 'technologies'}, which may have limited documentation, community support, and stability issues.`,
      category: 'Technical',
      score: calculateRiskScore(probability, impact),
      probability,
      impact,
      mitigations: [
        {
          strategy: 'Conduct proof-of-concept to validate experimental technologies',
          priority: 'High',
          estimatedEffort: '2 weeks',
        },
        {
          strategy: 'Have fallback plan with mature alternative technologies',
          priority: 'High',
          estimatedEffort: '1 week',
        },
        {
          strategy: 'Allocate extra time for learning curve and troubleshooting',
          priority: 'Medium',
          estimatedEffort: '1 week',
        },
      ],
    });
  }

  // Rule 5: Large Team Coordination Risk
  if (project.teamSize > 10) {
    const probability = 0.5;
    const impact = 0.5;
    risks.push({
      title: 'Team Coordination Complexity',
      description: `Large team size of ${project.teamSize} members may lead to communication overhead and coordination challenges.`,
      category: 'Resource',
      score: calculateRiskScore(probability, impact),
      probability,
      impact,
      mitigations: [
        {
          strategy: 'Divide team into smaller sub-teams with clear responsibilities',
          priority: 'High',
          estimatedEffort: '1 week',
        },
        {
          strategy: 'Implement daily stand-ups and weekly sync meetings',
          priority: 'Medium',
          estimatedEffort: '2 days',
        },
        {
          strategy: 'Use collaboration tools (Slack, Jira) for transparent communication',
          priority: 'Medium',
          estimatedEffort: '3 days',
        },
      ],
    });
  }

  // Calculate overall score (weighted average)
  const overallScore =
    risks.length > 0 ? risks.reduce((sum, r) => sum + r.score, 0) / risks.length : 0;

  // Transform to API format
  const transformedRisks = risks.map((risk) => ({
    id: randomUUID(),
    analysisId,
    title: risk.title,
    description: risk.description,
    category: risk.category,
    score: risk.score,
    probability: risk.probability,
    impact: risk.impact,
    status: 'Open',
    mitigations: risk.mitigations.map((m) => ({
      id: randomUUID(),
      riskId: '', // Will be set after risk is created
      strategy: m.strategy,
      priority: m.priority,
      estimatedEffort: m.estimatedEffort,
      isImplemented: false,
      implementedAt: null,
      isCustom: false,
      createdAt: now,
    })),
    detectedAt: now,
    resolvedAt: null,
  }));

  // Set riskId for mitigations
  transformedRisks.forEach((risk) => {
    risk.mitigations.forEach((m) => {
      m.riskId = risk.id;
    });
  });

  const processingTime = Date.now() - startTime;

  return {
    id: analysisId,
    projectId: project.id,
    overallScore: Math.round(overallScore * 100) / 100,
    analyzedAt: now,
    risks: transformedRisks,
    metadata: {
      modelVersion: 'fallback-1.0',
      engineVersion: 'rule-based-1.0',
      processingTime,
      dataCompleteness: 100,
    },
  };
}

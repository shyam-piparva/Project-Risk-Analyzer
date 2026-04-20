/**
 * Risk Analysis Service - Integration Example
 * 
 * This file demonstrates how to integrate the Python Risk Analysis Engine
 * with the TypeScript backend.
 * 
 * The actual implementation will be completed in task 9.
 */

import axios from 'axios';
import { Project } from './projectService';
import { logger } from '../utils/logger';

const RISK_ENGINE_URL = process.env.RISK_ENGINE_URL || 'http://localhost:5001';

interface RiskAnalysisResponse {
  project_id: string;
  overall_score: number;
  risks: Array<{
    title: string;
    description: string;
    category: string;
    score: number;
    probability: number;
    impact: number;
    mitigations: Array<{
      strategy: string;
      priority: string;
      estimated_effort: string;
    }>;
  }>;
  metadata: {
    model_version: string;
    engine_version: string;
    processing_time: number;
    data_completeness: number;
    risks_detected: number;
  };
}

/**
 * Call the Python Risk Analysis Engine to analyze a project
 * 
 * @param project - Project to analyze
 * @returns Risk analysis results
 */
export async function analyzeProjectWithEngine(
  project: Project
): Promise<RiskAnalysisResponse> {
  try {
    logger.info(`Calling risk engine for project ${project.id}`);
    
    // Transform TypeScript project to Python API format
    const requestData = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description || '',
        start_date: project.startDate.toISOString().split('T')[0],
        end_date: project.endDate.toISOString().split('T')[0],
        budget: project.budget,
        team_size: project.teamSize,
        team_composition: project.teamComposition.map(member => ({
          role: member.role,
          count: member.count,
          experience_level: member.experienceLevel
        })),
        technology_stack: project.technologyStack.map(tech => ({
          name: tech.name,
          category: tech.category,
          maturity: tech.maturity
        })),
        scope: project.scope || ''
      }
    };
    
    // Call Python risk engine
    const response = await axios.post<RiskAnalysisResponse>(
      `${RISK_ENGINE_URL}/api/analyze`,
      requestData,
      {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    logger.info(
      `Risk analysis complete for project ${project.id}: ` +
      `${response.data.risks.length} risks detected, ` +
      `overall score: ${response.data.overall_score}`
    );
    
    return response.data;
    
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Risk engine returned an error response
        logger.error(
          `Risk engine error for project ${project.id}: ${error.response.status}`,
          { error: error.response.data }
        );
        throw new Error(
          `Risk analysis failed: ${error.response.data.message || 'Unknown error'}`
        );
      } else if (error.request) {
        // Risk engine is unavailable
        logger.error(`Risk engine unavailable for project ${project.id}`);
        throw new Error(
          'Risk analysis service is currently unavailable. Please try again later.'
        );
      }
    }
    
    logger.error(`Unexpected error calling risk engine for project ${project.id}`, error);
    throw new Error('An unexpected error occurred during risk analysis');
  }
}

/**
 * Check if the Risk Analysis Engine is healthy
 * 
 * @returns True if engine is healthy, false otherwise
 */
export async function checkRiskEngineHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${RISK_ENGINE_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200 && response.data.status === 'healthy';
  } catch (error) {
    logger.warn('Risk engine health check failed', error);
    return false;
  }
}

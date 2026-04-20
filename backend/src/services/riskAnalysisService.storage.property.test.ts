import fc from 'fast-check';
import dotenv from 'dotenv';
import axios from 'axios';
import { pool } from '../config/database';
import { createProject, CreateProjectDTO, Project } from './projectService';

// Load environment variables
dotenv.config();

/**
 * Property-Based Tests for Risk Analysis Storage
 * Feature: ai-project-risk-analyzer, Property 21: Analyses are stored with timestamps
 * Validates: Requirements 7.1
 */

const RISK_ENGINE_URL = process.env.RISK_ENGINE_URL || 'http://localhost:5001';

interface RiskAnalysisResponse {
  project_id: string;
  overall_score: number;
  risks: Array<{
    title: string;
    description: string;
    category: string;
    score: number;
 
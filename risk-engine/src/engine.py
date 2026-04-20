"""
Risk Analysis Engine - Main Orchestrator
Coordinates risk detection, scoring, and mitigation generation
Validates: Requirements 3.1, 3.2, 3.3, 3.4, 5.1
"""

import time
from typing import List
from .models import Project, RiskPrediction, RiskAnalysisResponse
from .risk_rules import detect_all_risks
from .mitigation_generator import generate_mitigations
from .scoring import calculate_overall_risk_score


class RiskAnalysisEngine:
    """
    Main Risk Analysis Engine
    
    Orchestrates the complete risk analysis workflow:
    1. Validate project data
    2. Detect risks using rule-based analysis
    3. Generate mitigation strategies for each risk
    4. Calculate overall project risk score
    5. Return comprehensive analysis results
    """
    
    def __init__(self):
        self.version = "1.0.0"
        self.model_version = "rule-based-v1"
    
    def analyze(self, project: Project) -> RiskAnalysisResponse:
        """
        Perform comprehensive risk analysis on a project
        
        Args:
            project: Project to analyze
        
        Returns:
            RiskAnalysisResponse with all identified risks and mitigations
        
        Raises:
            ValueError: If project data is incomplete or invalid
        
        Validates: Requirements 3.1, 3.2, 3.3, 3.4, 5.1
        """
        start_time = time.time()
        
        # Validate project has required data
        self._validate_project(project)
        
        # Detect risks using rule-based analysis
        risks = detect_all_risks(project)
        
        # Generate mitigations for each risk
        for risk in risks:
            risk.mitigations = generate_mitigations(risk)
        
        # Calculate overall project risk score
        if risks:
            risk_scores = [risk.score for risk in risks]
            overall_score = calculate_overall_risk_score(risk_scores)
        else:
            # No risks detected - low risk project
            overall_score = 0.0
        
        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)  # milliseconds
        
        # Calculate data completeness
        data_completeness = self._calculate_data_completeness(project)
        
        # Build response
        response = RiskAnalysisResponse(
            project_id=project.id,
            overall_score=overall_score,
            risks=risks,
            metadata={
                'model_version': self.model_version,
                'engine_version': self.version,
                'processing_time': processing_time,
                'data_completeness': data_completeness,
                'risks_detected': len(risks),
                'timestamp': time.time()
            }
        )
        
        return response
    
    def _validate_project(self, project: Project) -> None:
        """
        Validate that project has all required data for analysis
        
        Args:
            project: Project to validate
        
        Raises:
            ValueError: If required fields are missing
        
        Validates: Requirements 3.5
        """
        missing_fields = []
        
        if not project.name or not project.name.strip():
            missing_fields.append('name')
        
        if not project.start_date:
            missing_fields.append('start_date')
        
        if not project.end_date:
            missing_fields.append('end_date')
        
        if not project.budget or project.budget <= 0:
            missing_fields.append('budget')
        
        if not project.team_size or project.team_size <= 0:
            missing_fields.append('team_size')
        
        if not project.team_composition or len(project.team_composition) == 0:
            missing_fields.append('team_composition')
        
        if not project.technology_stack or len(project.technology_stack) == 0:
            missing_fields.append('technology_stack')
        
        if missing_fields:
            raise ValueError(
                f"Project is missing required fields for analysis: {', '.join(missing_fields)}"
            )
    
    def _calculate_data_completeness(self, project: Project) -> float:
        """
        Calculate percentage of project data fields that are populated
        
        Args:
            project: Project to evaluate
        
        Returns:
            Completeness percentage (0-100)
        """
        total_fields = 10
        populated_fields = 0
        
        if project.name and project.name.strip():
            populated_fields += 1
        if project.description and project.description.strip():
            populated_fields += 1
        if project.start_date:
            populated_fields += 1
        if project.end_date:
            populated_fields += 1
        if project.budget and project.budget > 0:
            populated_fields += 1
        if project.team_size and project.team_size > 0:
            populated_fields += 1
        if project.team_composition and len(project.team_composition) > 0:
            populated_fields += 1
        if project.technology_stack and len(project.technology_stack) > 0:
            populated_fields += 1
        if project.scope and project.scope.strip():
            populated_fields += 1
        # Always count ID as populated
        populated_fields += 1
        
        return round((populated_fields / total_fields) * 100, 2)

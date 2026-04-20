"""
Risk Analysis Service
Handles all risk analysis operations including database persistence
Validates: Requirements 3.1, 3.7, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.5
"""

import uuid
from datetime import datetime
from typing import List, Optional
import logging
import psycopg2.extras

from .database import get_db_cursor
from .db_models import (
    RiskAnalysisDB, RiskDB, MitigationDB,
    RiskAnalysisWithRisks, AnalysisComparison
)
from .models import Project, RiskPrediction, RiskAnalysisResponse
from .engine import RiskAnalysisEngine

logger = logging.getLogger(__name__)


class RiskAnalysisService:
    """
    Service for managing risk analyses
    
    Provides methods for:
    - Analyzing projects and saving results
    - Retrieving analyses and history
    - Comparing analyses
    - Managing custom mitigations
    - Updating risk statuses
    """
    
    def __init__(self):
        self.engine = RiskAnalysisEngine()
    
    def analyze_and_save(self, project: Project, user_id: str) -> RiskAnalysisWithRisks:
        """
        Analyze a project and save results to database
        
        Args:
            project: Project to analyze
            user_id: User ID performing the analysis
        
        Returns:
            Complete risk analysis with all risks and mitigations
        
        Validates: Requirements 3.1, 7.1
        """
        logger.info(f"Analyzing project {project.id} for user {user_id}")
        
        # Perform analysis using the engine
        analysis_result = self.engine.analyze(project)
        
        # Generate UUIDs
        analysis_id = str(uuid.uuid4())
        analyzed_at = datetime.utcnow()
        
        # Save to database
        with get_db_cursor() as cur:
            # Insert risk analysis
            cur.execute(
                """
                INSERT INTO risk_analyses (id, project_id, overall_score, analyzed_at, metadata)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    analysis_id,
                    project.id,
                    analysis_result.overall_score,
                    analyzed_at,
                    psycopg2.extras.Json(analysis_result.metadata)
                )
            )
            
            # Save each risk and its mitigations
            risks_db = []
            mitigations_db = {}
            
            for risk in analysis_result.risks:
                risk_id = str(uuid.uuid4())
                
                # Insert risk
                cur.execute(
                    """
                    INSERT INTO risks (
                        id, analysis_id, title, description, category,
                        score, probability, impact, status, detected_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        risk_id,
                        analysis_id,
                        risk.title,
                        risk.description,
                        risk.category,
                        risk.score,
                        risk.probability,
                        risk.impact,
                        'Open',
                        analyzed_at
                    )
                )
                
                # Create risk DB model
                risk_db = RiskDB(
                    id=risk_id,
                    analysis_id=analysis_id,
                    title=risk.title,
                    description=risk.description,
                    category=risk.category,
                    score=risk.score,
                    probability=risk.probability,
                    impact=risk.impact,
                    status='Open',
                    detected_at=analyzed_at,
                    resolved_at=None
                )
                risks_db.append(risk_db)
                
                # Insert mitigations
                risk_mitigations = []
                for mitigation in risk.mitigations:
                    mitigation_id = str(uuid.uuid4())
                    
                    cur.execute(
                        """
                        INSERT INTO mitigations (
                            id, risk_id, strategy, priority, estimated_effort,
                            is_implemented, is_custom, created_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                        """,
                        (
                            mitigation_id,
                            risk_id,
                            mitigation.strategy,
                            mitigation.priority,
                            mitigation.estimated_effort,
                            False,
                            False,  # AI-generated
                            analyzed_at
                        )
                    )
                    
                    mitigation_db = MitigationDB(
                        id=mitigation_id,
                        risk_id=risk_id,
                        strategy=mitigation.strategy,
                        priority=mitigation.priority,
                        estimated_effort=mitigation.estimated_effort,
                        is_implemented=False,
                        implemented_at=None,
                        is_custom=False,
                        created_at=analyzed_at
                    )
                    risk_mitigations.append(mitigation_db)
                
                mitigations_db[risk_id] = risk_mitigations
        
        # Create analysis DB model
        analysis_db = RiskAnalysisDB(
            id=analysis_id,
            project_id=project.id,
            overall_score=analysis_result.overall_score,
            analyzed_at=analyzed_at,
            metadata=analysis_result.metadata
        )
        
        logger.info(
            f"Analysis saved for project {project.id}: "
            f"{len(risks_db)} risks, overall score {analysis_result.overall_score}"
        )
        
        return RiskAnalysisWithRisks(
            analysis=analysis_db,
            risks=risks_db,
            mitigations=mitigations_db
        )
    
    def get_latest_analysis(self, project_id: str) -> Optional[RiskAnalysisWithRisks]:
        """
        Retrieve the latest risk analysis for a project
        
        Args:
            project_id: Project UUID
        
        Returns:
            Latest risk analysis or None if no analyses exist
        
        Validates: Requirements 3.7
        """
        with get_db_cursor(commit=False) as cur:
            # Get latest analysis
            cur.execute(
                """
                SELECT id, project_id, overall_score, analyzed_at, metadata
                FROM risk_analyses
                WHERE project_id = %s
                ORDER BY analyzed_at DESC
                LIMIT 1
                """,
                (project_id,)
            )
            
            analysis_row = cur.fetchone()
            if not analysis_row:
                return None
            
            analysis = RiskAnalysisDB(**dict(analysis_row))
            
            # Get all risks for this analysis
            cur.execute(
                """
                SELECT id, analysis_id, title, description, category,
                       score, probability, impact, status, detected_at, resolved_at
                FROM risks
                WHERE analysis_id = %s
                ORDER BY score DESC
                """,
                (analysis.id,)
            )
            
            risks = [RiskDB(**dict(row)) for row in cur.fetchall()]
            
            # Get mitigations for each risk
            mitigations = {}
            for risk in risks:
                cur.execute(
                    """
                    SELECT id, risk_id, strategy, priority, estimated_effort,
                           is_implemented, implemented_at, is_custom, created_at
                    FROM mitigations
                    WHERE risk_id = %s
                    ORDER BY 
                        CASE priority
                            WHEN 'High' THEN 1
                            WHEN 'Medium' THEN 2
                            WHEN 'Low' THEN 3
                        END
                    """,
                    (risk.id,)
                )
                
                mitigations[risk.id] = [MitigationDB(**dict(row)) for row in cur.fetchall()]
            
            return RiskAnalysisWithRisks(
                analysis=analysis,
                risks=risks,
                mitigations=mitigations
            )
    
    def get_analysis_history(
        self,
        project_id: str,
        limit: int = 10
    ) -> List[RiskAnalysisDB]:
        """
        Retrieve analysis history for a project
        
        Args:
            project_id: Project UUID
            limit: Maximum number of analyses to return
        
        Returns:
            List of analyses in chronological order (oldest first)
        
        Validates: Requirements 7.1, 7.2
        """
        with get_db_cursor(commit=False) as cur:
            cur.execute(
                """
                SELECT id, project_id, overall_score, analyzed_at, metadata
                FROM risk_analyses
                WHERE project_id = %s
                ORDER BY analyzed_at ASC
                LIMIT %s
                """,
                (project_id, limit)
            )
            
            return [RiskAnalysisDB(**dict(row)) for row in cur.fetchall()]
    
    def compare_analyses(
        self,
        analysis_id1: str,
        analysis_id2: str
    ) -> AnalysisComparison:
        """
        Compare two risk analyses
        
        Args:
            analysis_id1: First analysis UUID (older)
            analysis_id2: Second analysis UUID (newer)
        
        Returns:
            Comparison showing differences between analyses
        
        Validates: Requirements 7.3
        """
        with get_db_cursor(commit=False) as cur:
            # Get both analyses
            cur.execute(
                """
                SELECT id, project_id, overall_score, analyzed_at, metadata
                FROM risk_analyses
                WHERE id IN (%s, %s)
                ORDER BY analyzed_at ASC
                """,
                (analysis_id1, analysis_id2)
            )
            
            analyses = [RiskAnalysisDB(**dict(row)) for row in cur.fetchall()]
            if len(analyses) != 2:
                raise ValueError("One or both analyses not found")
            
            analysis1, analysis2 = analyses
            
            # Get risks for both analyses
            cur.execute(
                """
                SELECT id, analysis_id, title, description, category,
                       score, probability, impact, status, detected_at, resolved_at
                FROM risks
                WHERE analysis_id IN (%s, %s)
                """,
                (analysis1.id, analysis2.id)
            )
            
            all_risks = [RiskDB(**dict(row)) for row in cur.fetchall()]
            
            # Separate risks by analysis
            risks1 = [r for r in all_risks if r.analysis_id == analysis1.id]
            risks2 = [r for r in all_risks if r.analysis_id == analysis2.id]
            
            # Create risk title mappings for comparison
            risks1_by_title = {r.title: r for r in risks1}
            risks2_by_title = {r.title: r for r in risks2}
            
            # Find new and resolved risks
            new_risks = [r for r in risks2 if r.title not in risks1_by_title]
            resolved_risks = [r for r in risks1 if r.title not in risks2_by_title]
            
            # Calculate score changes for common risks
            risk_score_changes = {}
            for title in risks1_by_title:
                if title in risks2_by_title:
                    old_risk = risks1_by_title[title]
                    new_risk = risks2_by_title[title]
                    change = new_risk.score - old_risk.score
                    
                    risk_score_changes[new_risk.id] = {
                        'title': title,
                        'old_score': old_risk.score,
                        'new_score': new_risk.score,
                        'change': change,
                        'old_status': old_risk.status,
                        'new_status': new_risk.status
                    }
            
            return AnalysisComparison(
                analysis1_id=analysis1.id,
                analysis2_id=analysis2.id,
                analysis1_date=analysis1.analyzed_at,
                analysis2_date=analysis2.analyzed_at,
                overall_score_change=analysis2.overall_score - analysis1.overall_score,
                total_risks_change=len(risks2) - len(risks1),
                new_risks=new_risks,
                resolved_risks=resolved_risks,
                risk_score_changes=risk_score_changes
            )
    
    def add_custom_mitigation(
        self,
        risk_id: str,
        strategy: str,
        priority: str = "Medium",
        estimated_effort: str = "TBD"
    ) -> MitigationDB:
        """
        Add a custom mitigation strategy to a risk
        
        Args:
            risk_id: Risk UUID
            strategy: Mitigation strategy description
            priority: Priority level (High/Medium/Low)
            estimated_effort: Estimated effort
        
        Returns:
            Created mitigation
        
        Validates: Requirements 5.4
        """
        mitigation_id = str(uuid.uuid4())
        created_at = datetime.utcnow()
        
        with get_db_cursor() as cur:
            # Verify risk exists
            cur.execute("SELECT id FROM risks WHERE id = %s", (risk_id,))
            if not cur.fetchone():
                raise ValueError(f"Risk {risk_id} not found")
            
            # Insert custom mitigation
            cur.execute(
                """
                INSERT INTO mitigations (
                    id, risk_id, strategy, priority, estimated_effort,
                    is_implemented, is_custom, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    mitigation_id,
                    risk_id,
                    strategy,
                    priority,
                    estimated_effort,
                    False,
                    True,  # Custom mitigation
                    created_at
                )
            )
        
        logger.info(f"Custom mitigation added to risk {risk_id}")
        
        return MitigationDB(
            id=mitigation_id,
            risk_id=risk_id,
            strategy=strategy,
            priority=priority,
            estimated_effort=estimated_effort,
            is_implemented=False,
            implemented_at=None,
            is_custom=True,
            created_at=created_at
        )
    
    def mark_mitigation_implemented(self, mitigation_id: str) -> MitigationDB:
        """
        Mark a mitigation strategy as implemented
        
        Args:
            mitigation_id: Mitigation UUID
        
        Returns:
            Updated mitigation
        
        Validates: Requirements 5.3, 7.5
        """
        implemented_at = datetime.utcnow()
        
        with get_db_cursor() as cur:
            cur.execute(
                """
                UPDATE mitigations
                SET is_implemented = TRUE, implemented_at = %s
                WHERE id = %s
                RETURNING id, risk_id, strategy, priority, estimated_effort,
                          is_implemented, implemented_at, is_custom, created_at
                """,
                (implemented_at, mitigation_id)
            )
            
            row = cur.fetchone()
            if not row:
                raise ValueError(f"Mitigation {mitigation_id} not found")
            
            mitigation = MitigationDB(**dict(row))
        
        logger.info(f"Mitigation {mitigation_id} marked as implemented")
        return mitigation
    
    def update_risk_status(
        self,
        risk_id: str,
        status: str,
        resolved: bool = False
    ) -> RiskDB:
        """
        Update risk status
        
        Args:
            risk_id: Risk UUID
            status: New status (Open/In Progress/Mitigated/Resolved/Accepted)
            resolved: Whether to mark as resolved
        
        Returns:
            Updated risk
        
        Validates: Requirements 5.3, 7.5
        """
        resolved_at = datetime.utcnow() if resolved else None
        
        with get_db_cursor() as cur:
            if resolved:
                cur.execute(
                    """
                    UPDATE risks
                    SET status = %s, resolved_at = %s
                    WHERE id = %s
                    RETURNING id, analysis_id, title, description, category,
                              score, probability, impact, status, detected_at, resolved_at
                    """,
                    (status, resolved_at, risk_id)
                )
            else:
                cur.execute(
                    """
                    UPDATE risks
                    SET status = %s
                    WHERE id = %s
                    RETURNING id, analysis_id, title, description, category,
                              score, probability, impact, status, detected_at, resolved_at
                    """,
                    (status, risk_id)
                )
            
            row = cur.fetchone()
            if not row:
                raise ValueError(f"Risk {risk_id} not found")
            
            risk = RiskDB(**dict(row))
        
        logger.info(f"Risk {risk_id} status updated to {status}")
        return risk
    
    def get_risk_by_id(self, risk_id: str) -> Optional[tuple[RiskDB, List[MitigationDB]]]:
        """
        Get a specific risk with its mitigations
        
        Args:
            risk_id: Risk UUID
        
        Returns:
            Tuple of (risk, mitigations) or None if not found
        """
        with get_db_cursor(commit=False) as cur:
            # Get risk
            cur.execute(
                """
                SELECT id, analysis_id, title, description, category,
                       score, probability, impact, status, detected_at, resolved_at
                FROM risks
                WHERE id = %s
                """,
                (risk_id,)
            )
            
            risk_row = cur.fetchone()
            if not risk_row:
                return None
            
            risk = RiskDB(**dict(risk_row))
            
            # Get mitigations
            cur.execute(
                """
                SELECT id, risk_id, strategy, priority, estimated_effort,
                       is_implemented, implemented_at, is_custom, created_at
                FROM mitigations
                WHERE risk_id = %s
                ORDER BY 
                    CASE priority
                        WHEN 'High' THEN 1
                        WHEN 'Medium' THEN 2
                        WHEN 'Low' THEN 3
                    END
                """,
                (risk_id,)
            )
            
            mitigations = [MitigationDB(**dict(row)) for row in cur.fetchall()]
            
            return (risk, mitigations)

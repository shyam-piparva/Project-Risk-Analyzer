"""
Database models for risk analysis data
Represents the database schema for storing risk analyses
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class RiskAnalysisDB(BaseModel):
    """Risk Analysis database model"""
    id: str = Field(..., description="Analysis UUID")
    project_id: str = Field(..., description="Project UUID")
    overall_score: float = Field(..., ge=0, le=100, description="Overall risk score")
    analyzed_at: datetime = Field(..., description="Analysis timestamp")
    metadata: dict = Field(..., description="Analysis metadata")


class RiskDB(BaseModel):
    """Risk database model"""
    id: str = Field(..., description="Risk UUID")
    analysis_id: str = Field(..., description="Analysis UUID")
    title: str = Field(..., description="Risk title")
    description: str = Field(..., description="Risk description")
    category: str = Field(..., description="Risk category")
    score: float = Field(..., ge=0, le=100, description="Risk score")
    probability: float = Field(..., ge=0, le=1, description="Probability")
    impact: float = Field(..., ge=0, le=1, description="Impact")
    status: str = Field(default="Open", description="Risk status")
    detected_at: datetime = Field(..., description="Detection timestamp")
    resolved_at: Optional[datetime] = Field(None, description="Resolution timestamp")


class MitigationDB(BaseModel):
    """Mitigation database model"""
    id: str = Field(..., description="Mitigation UUID")
    risk_id: str = Field(..., description="Risk UUID")
    strategy: str = Field(..., description="Mitigation strategy")
    priority: str = Field(..., description="Priority level")
    estimated_effort: str = Field(..., description="Estimated effort")
    is_implemented: bool = Field(default=False, description="Implementation status")
    implemented_at: Optional[datetime] = Field(None, description="Implementation timestamp")
    is_custom: bool = Field(default=False, description="Custom vs AI-generated")
    created_at: datetime = Field(..., description="Creation timestamp")


class RiskAnalysisWithRisks(BaseModel):
    """Complete risk analysis with all risks and mitigations"""
    analysis: RiskAnalysisDB
    risks: List[RiskDB]
    mitigations: dict[str, List[MitigationDB]]  # risk_id -> mitigations


class AnalysisComparison(BaseModel):
    """Comparison between two risk analyses"""
    analysis1_id: str
    analysis2_id: str
    analysis1_date: datetime
    analysis2_date: datetime
    overall_score_change: float
    total_risks_change: int
    new_risks: List[RiskDB]
    resolved_risks: List[RiskDB]
    risk_score_changes: dict[str, dict]  # risk_id -> {old_score, new_score, change}

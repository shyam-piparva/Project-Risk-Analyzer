"""
Data models for Risk Analysis Engine
Uses Pydantic for strong type validation and data integrity
"""

from typing import List, Literal
from pydantic import BaseModel, Field, field_validator
from datetime import date


class TeamMember(BaseModel):
    """Team member composition"""
    role: str = Field(..., min_length=1, description="Team member role")
    count: int = Field(..., gt=0, description="Number of team members in this role")
    experience_level: Literal['Junior', 'Mid', 'Senior'] = Field(..., description="Experience level")


class Technology(BaseModel):
    """Technology stack item"""
    name: str = Field(..., min_length=1, description="Technology name")
    category: Literal['Frontend', 'Backend', 'Database', 'DevOps', 'Other'] = Field(
        ..., description="Technology category"
    )
    maturity: Literal['Stable', 'Emerging', 'Experimental'] = Field(
        ..., description="Technology maturity level"
    )


class Project(BaseModel):
    """Project data model for risk analysis"""
    id: str = Field(..., description="Project UUID")
    name: str = Field(..., min_length=1, description="Project name")
    description: str | None = Field(None, description="Project description")
    start_date: date = Field(..., description="Project start date")
    end_date: date = Field(..., description="Project end date")
    budget: float = Field(..., gt=0, description="Project budget in USD")
    team_size: int = Field(..., gt=0, description="Total team size")
    team_composition: List[TeamMember] = Field(..., min_length=1, description="Team composition")
    technology_stack: List[Technology] = Field(..., min_length=1, description="Technology stack")
    scope: str | None = Field(None, description="Project scope description")

    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v: date, info) -> date:
        """Ensure end date is after start date"""
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class MitigationStrategy(BaseModel):
    """Mitigation strategy for a risk"""
    strategy: str = Field(..., min_length=1, description="Mitigation strategy description")
    priority: Literal['High', 'Medium', 'Low'] = Field(..., description="Priority level")
    estimated_effort: str = Field(..., description="Estimated effort (e.g., '2 days', '1 week')")


class RiskPrediction(BaseModel):
    """Risk prediction output"""
    title: str = Field(..., min_length=1, description="Risk title")
    description: str = Field(..., min_length=1, description="Detailed risk description")
    category: Literal['Technical', 'Resource', 'Schedule', 'Budget', 'External'] = Field(
        ..., description="Risk category"
    )
    score: float = Field(..., ge=0, le=100, description="Risk score (0-100)")
    probability: float = Field(..., ge=0, le=1, description="Probability of occurrence (0-1)")
    impact: float = Field(..., ge=0, le=1, description="Impact severity (0-1)")
    mitigations: List[MitigationStrategy] = Field(
        default_factory=list, description="Mitigation strategies"
    )


class RiskAnalysisRequest(BaseModel):
    """Request model for risk analysis"""
    project: Project = Field(..., description="Project to analyze")


class RiskAnalysisResponse(BaseModel):
    """Response model for risk analysis"""
    project_id: str = Field(..., description="Project UUID")
    overall_score: float = Field(..., ge=0, le=100, description="Overall project risk score")
    risks: List[RiskPrediction] = Field(..., description="Identified risks")
    metadata: dict = Field(..., description="Analysis metadata")

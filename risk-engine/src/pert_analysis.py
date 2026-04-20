"""
PERT (Program Evaluation and Review Technique) Analysis
Implements PERT methodology for project timeline and risk analysis
"""

import math
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from .models import Project


@dataclass
class PERTEstimate:
    """PERT time estimate for a task or project phase"""
    optimistic: float  # Best case scenario (O)
    most_likely: float  # Most probable scenario (M)
    pessimistic: float  # Worst case scenario (P)
    
    @property
    def expected_time(self) -> float:
        """
        Calculate expected time using PERT formula
        TE = (O + 4M + P) / 6
        """
        return (self.optimistic + 4 * self.most_likely + self.pessimistic) / 6
    
    @property
    def standard_deviation(self) -> float:
        """
        Calculate standard deviation using PERT formula
        σ = (P - O) / 6
        """
        return (self.pessimistic - self.optimistic) / 6
    
    @property
    def variance(self) -> float:
        """Calculate variance (σ²)"""
        return self.standard_deviation ** 2


@dataclass
class PERTAnalysisResult:
    """Results from PERT analysis"""
    expected_duration: float  # Expected project duration in days
    standard_deviation: float  # Overall standard deviation
    variance: float  # Overall variance
    optimistic_duration: float  # Best case
    pessimistic_duration: float  # Worst case
    probability_on_time: float  # Probability of completing on schedule
    schedule_risk_score: float  # Risk score based on schedule variance (0-100)
    confidence_intervals: Dict[str, Tuple[float, float]]  # 68%, 95%, 99.7%


def estimate_project_duration_pert(project: Project) -> PERTEstimate:
    """
    Estimate project duration using PERT based on project parameters
    
    Uses heuristics to estimate optimistic, most likely, and pessimistic durations
    based on team size, complexity, and other factors.
    
    Args:
        project: Project to analyze
    
    Returns:
        PERTEstimate with O, M, P values
    """
    # Calculate actual planned duration
    actual_duration = (project.end_date - project.start_date).days
    
    # Calculate complexity factors
    team_experience_factor = calculate_team_experience_factor(project)
    tech_complexity_factor = calculate_tech_complexity_factor(project)
    
    # Most likely time is the planned duration adjusted for complexity
    most_likely = actual_duration * (1 + (tech_complexity_factor * 0.2))
    
    # Optimistic: 70-80% of most likely (best case with experienced team)
    optimistic_factor = 0.7 + (team_experience_factor * 0.1)
    optimistic = most_likely * optimistic_factor
    
    # Pessimistic: 130-180% of most likely (worst case with delays)
    pessimistic_factor = 1.3 + ((1 - team_experience_factor) * 0.5) + (tech_complexity_factor * 0.3)
    pessimistic = most_likely * pessimistic_factor
    
    return PERTEstimate(
        optimistic=round(optimistic, 2),
        most_likely=round(most_likely, 2),
        pessimistic=round(pessimistic, 2)
    )


def calculate_team_experience_factor(project: Project) -> float:
    """
    Calculate team experience factor (0.0 to 1.0)
    1.0 = highly experienced, 0.0 = all juniors
    
    Args:
        project: Project to analyze
    
    Returns:
        Experience factor between 0 and 1
    """
    total_members = sum(member.count for member in project.team_composition)
    if total_members == 0:
        return 0.5  # Default to medium
    
    # Weight by experience level
    experience_weights = {
        'Junior': 0.3,
        'Mid': 0.6,
        'Senior': 1.0
    }
    
    weighted_sum = sum(
        member.count * experience_weights.get(member.experience_level, 0.5)
        for member in project.team_composition
    )
    
    return weighted_sum / total_members


def calculate_tech_complexity_factor(project: Project) -> float:
    """
    Calculate technology complexity factor (0.0 to 1.0)
    1.0 = highly complex/experimental, 0.0 = all mature tech
    
    Args:
        project: Project to analyze
    
    Returns:
        Complexity factor between 0 and 1
    """
    if not project.technology_stack:
        return 0.5  # Default to medium
    
    # Weight by maturity level
    complexity_weights = {
        'Mature': 0.1,
        'Stable': 0.3,
        'Emerging': 0.6,
        'Experimental': 1.0
    }
    
    total_complexity = sum(
        complexity_weights.get(tech.maturity, 0.5)
        for tech in project.technology_stack
    )
    
    return total_complexity / len(project.technology_stack)


def perform_pert_analysis(project: Project) -> PERTAnalysisResult:
    """
    Perform complete PERT analysis on a project
    
    Args:
        project: Project to analyze
    
    Returns:
        PERTAnalysisResult with comprehensive analysis
    """
    # Get PERT estimates
    pert_estimate = estimate_project_duration_pert(project)
    
    # Calculate expected duration and variance
    expected_duration = pert_estimate.expected_time
    std_dev = pert_estimate.standard_deviation
    variance = pert_estimate.variance
    
    # Calculate actual planned duration
    planned_duration = (project.end_date - project.start_date).days
    
    # Calculate probability of completing on time using normal distribution
    # Z = (Planned - Expected) / StdDev
    if std_dev > 0:
        z_score = (planned_duration - expected_duration) / std_dev
        probability_on_time = calculate_normal_cdf(z_score)
    else:
        probability_on_time = 1.0 if planned_duration >= expected_duration else 0.0
    
    # Calculate schedule risk score (0-100)
    # Higher variance and lower probability = higher risk
    schedule_risk_score = calculate_schedule_risk_score(
        planned_duration,
        expected_duration,
        std_dev,
        probability_on_time
    )
    
    # Calculate confidence intervals
    confidence_intervals = {
        '68%': (expected_duration - std_dev, expected_duration + std_dev),  # 1σ
        '95%': (expected_duration - 2*std_dev, expected_duration + 2*std_dev),  # 2σ
        '99.7%': (expected_duration - 3*std_dev, expected_duration + 3*std_dev)  # 3σ
    }
    
    return PERTAnalysisResult(
        expected_duration=round(expected_duration, 2),
        standard_deviation=round(std_dev, 2),
        variance=round(variance, 2),
        optimistic_duration=pert_estimate.optimistic,
        pessimistic_duration=pert_estimate.pessimistic,
        probability_on_time=round(probability_on_time, 4),
        schedule_risk_score=round(schedule_risk_score, 2),
        confidence_intervals=confidence_intervals
    )


def calculate_normal_cdf(z: float) -> float:
    """
    Calculate cumulative distribution function for standard normal distribution
    Approximation using error function
    
    Args:
        z: Z-score
    
    Returns:
        Probability (0 to 1)
    """
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))


def calculate_schedule_risk_score(
    planned: float,
    expected: float,
    std_dev: float,
    probability: float
) -> float:
    """
    Calculate schedule risk score based on PERT analysis
    
    Args:
        planned: Planned duration
        expected: Expected duration from PERT
        std_dev: Standard deviation
        probability: Probability of completing on time
    
    Returns:
        Risk score (0-100)
    """
    # Factor 1: Schedule compression (planned vs expected)
    if expected > 0:
        compression_ratio = planned / expected
        if compression_ratio < 0.8:
            compression_risk = 90  # Severely compressed
        elif compression_ratio < 0.9:
            compression_risk = 70  # Highly compressed
        elif compression_ratio < 1.0:
            compression_risk = 50  # Moderately compressed
        elif compression_ratio < 1.1:
            compression_risk = 30  # Slightly tight
        else:
            compression_risk = 10  # Adequate buffer
    else:
        compression_risk = 50
    
    # Factor 2: Uncertainty (standard deviation relative to expected)
    if expected > 0:
        coefficient_of_variation = std_dev / expected
        if coefficient_of_variation > 0.3:
            uncertainty_risk = 80  # Very high uncertainty
        elif coefficient_of_variation > 0.2:
            uncertainty_risk = 60  # High uncertainty
        elif coefficient_of_variation > 0.1:
            uncertainty_risk = 40  # Moderate uncertainty
        else:
            uncertainty_risk = 20  # Low uncertainty
    else:
        uncertainty_risk = 50
    
    # Factor 3: Probability of success
    probability_risk = (1 - probability) * 100
    
    # Weighted combination
    risk_score = (
        compression_risk * 0.4 +
        uncertainty_risk * 0.3 +
        probability_risk * 0.3
    )
    
    return max(0.0, min(100.0, risk_score))


def calculate_pert_probability_range(
    pert_estimate: PERTEstimate,
    target_duration: float
) -> Dict[str, float]:
    """
    Calculate probability of completing within target duration
    at different confidence levels
    
    Args:
        pert_estimate: PERT estimate
        target_duration: Target completion time
    
    Returns:
        Dictionary with probabilities at different confidence levels
    """
    expected = pert_estimate.expected_time
    std_dev = pert_estimate.standard_deviation
    
    if std_dev == 0:
        return {
            'probability': 1.0 if target_duration >= expected else 0.0,
            'z_score': 0.0
        }
    
    z_score = (target_duration - expected) / std_dev
    probability = calculate_normal_cdf(z_score)
    
    return {
        'probability': round(probability, 4),
        'z_score': round(z_score, 2),
        'expected_duration': round(expected, 2),
        'standard_deviation': round(std_dev, 2),
        'target_duration': target_duration
    }

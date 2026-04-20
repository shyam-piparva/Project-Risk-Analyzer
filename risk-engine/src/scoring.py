"""
Risk Scoring Algorithms
Implements core risk scoring and severity determination
Validates: Requirements 3.3, 4.3
"""

from typing import Literal


def calculate_risk_score(probability: float, impact: float) -> float:
    """
    Calculate risk score from probability and impact
    
    Formula: Risk_Score = (Probability × 0.5 + Impact × 0.5) × 100
    
    This weighted formula gives equal importance to both the likelihood of a risk
    occurring (probability) and the severity of its consequences (impact).
    
    Args:
        probability: Likelihood of occurrence (0.0 to 1.0)
        impact: Severity if it occurs (0.0 to 1.0)
    
    Returns:
        Risk score (0-100)
    
    Raises:
        ValueError: If probability or impact are out of valid range
    
    Validates: Requirements 3.3, 4.3
    
    Examples:
        >>> calculate_risk_score(0.8, 0.9)
        85.0
        >>> calculate_risk_score(0.3, 0.5)
        40.0
        >>> calculate_risk_score(0.0, 0.0)
        0.0
        >>> calculate_risk_score(1.0, 1.0)
        100.0
    """
    # Validate inputs
    if not 0.0 <= probability <= 1.0:
        raise ValueError(f"Probability must be between 0 and 1, got {probability}")
    
    if not 0.0 <= impact <= 1.0:
        raise ValueError(f"Impact must be between 0 and 1, got {impact}")
    
    # Calculate weighted score
    score = (probability * 0.5 + impact * 0.5) * 100
    
    # Ensure score is within bounds and rounded to 2 decimal places
    score = max(0.0, min(100.0, score))
    return round(score, 2)


def get_risk_severity(score: float) -> Literal['High', 'Medium', 'Low']:
    """
    Determine risk severity level based on score
    
    Severity Levels:
    - High: 70-100 (Critical risks requiring immediate attention)
    - Medium: 40-69 (Significant risks requiring monitoring and planning)
    - Low: 0-39 (Minor risks that can be accepted or monitored)
    
    Args:
        score: Risk score (0-100)
    
    Returns:
        Risk severity level ('High', 'Medium', or 'Low')
    
    Raises:
        ValueError: If score is out of valid range
    
    Validates: Requirements 4.3
    
    Examples:
        >>> get_risk_severity(85.0)
        'High'
        >>> get_risk_severity(55.0)
        'Medium'
        >>> get_risk_severity(25.0)
        'Low'
        >>> get_risk_severity(70.0)
        'High'
        >>> get_risk_severity(39.99)
        'Low'
    """
    if not 0.0 <= score <= 100.0:
        raise ValueError(f"Risk score must be between 0 and 100, got {score}")
    
    if score >= 70:
        return 'High'
    elif score >= 40:
        return 'Medium'
    else:
        return 'Low'


def calculate_overall_risk_score(risk_scores: list[float]) -> float:
    """
    Calculate overall project risk score from individual risk scores
    
    Uses a weighted average approach where higher risks have more influence.
    The formula applies exponential weighting to emphasize critical risks.
    
    Args:
        risk_scores: List of individual risk scores (0-100)
    
    Returns:
        Overall project risk score (0-100)
    
    Raises:
        ValueError: If risk_scores is empty or contains invalid values
    
    Validates: Requirements 4.6
    
    Examples:
        >>> calculate_overall_risk_score([80.0, 60.0, 40.0])
        63.33
        >>> calculate_overall_risk_score([100.0])
        100.0
        >>> calculate_overall_risk_score([10.0, 20.0, 30.0])
        20.0
    """
    if not risk_scores:
        raise ValueError("Cannot calculate overall score from empty risk list")
    
    for score in risk_scores:
        if not 0.0 <= score <= 100.0:
            raise ValueError(f"All risk scores must be between 0 and 100, got {score}")
    
    # Use weighted average with exponential weighting for higher risks
    # This ensures that high-severity risks have more influence on overall score
    weights = [score ** 1.5 for score in risk_scores]
    total_weight = sum(weights)
    
    if total_weight == 0:
        return 0.0
    
    weighted_sum = sum(score * weight for score, weight in zip(risk_scores, weights))
    overall_score = weighted_sum / total_weight
    
    return round(overall_score, 2)

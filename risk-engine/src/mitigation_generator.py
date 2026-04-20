"""
Mitigation Strategy Generator
Generates actionable mitigation strategies based on risk category and severity
Validates: Requirements 5.1, 5.6
"""

from typing import List
from .models import MitigationStrategy, RiskPrediction
from .scoring import get_risk_severity


def generate_timeline_mitigations(risk: RiskPrediction) -> List[MitigationStrategy]:
    """
    Generate mitigation strategies for timeline/schedule risks
    
    Args:
        risk: Risk prediction with timeline category
    
    Returns:
        List of prioritized mitigation strategies
    
    Validates: Requirements 5.1, 5.6
    """
    severity = get_risk_severity(risk.score)
    strategies = []
    
    if severity == 'High':
        strategies.extend([
            MitigationStrategy(
                strategy="Immediately reassess project scope and identify features that can be "
                        "deferred to future phases (MVP approach)",
                priority="High",
                estimated_effort="2-3 days"
            ),
            MitigationStrategy(
                strategy="Negotiate timeline extension with stakeholders, presenting data-driven "
                        "analysis of realistic completion dates",
                priority="High",
                estimated_effort="1 week"
            ),
            MitigationStrategy(
                strategy="Increase team size by bringing in additional experienced developers "
                        "or contractors",
                priority="High",
                estimated_effort="2-4 weeks"
            ),
        ])
    
    if severity in ['High', 'Medium']:
        strategies.extend([
            MitigationStrategy(
                strategy="Implement agile methodology with 2-week sprints to maintain velocity "
                        "and identify blockers early",
                priority="High" if severity == 'High' else "Medium",
                estimated_effort="1 week setup"
            ),
            MitigationStrategy(
                strategy="Establish daily standups and weekly risk reviews to track progress "
                        "and address issues promptly",
                priority="Medium",
                estimated_effort="Ongoing"
            ),
            MitigationStrategy(
                strategy="Identify and eliminate non-critical meetings and administrative overhead "
                        "to maximize development time",
                priority="Medium",
                estimated_effort="3-5 days"
            ),
        ])
    
    # Always include these
    strategies.append(
        MitigationStrategy(
            strategy="Create detailed project timeline with milestones and buffer time for "
                    "unexpected issues (15-20% buffer recommended)",
            priority="Medium",
            estimated_effort="3-5 days"
        )
    )
    
    return strategies


def generate_budget_mitigations(risk: RiskPrediction) -> List[MitigationStrategy]:
    """
    Generate mitigation strategies for budget risks
    
    Args:
        risk: Risk prediction with budget category
    
    Returns:
        List of prioritized mitigation strategies
    
    Validates: Requirements 5.1, 5.6
    """
    severity = get_risk_severity(risk.score)
    strategies = []
    
    if severity == 'High':
        strategies.extend([
            MitigationStrategy(
                strategy="Request immediate budget increase from stakeholders with detailed "
                        "justification and ROI analysis",
                priority="High",
                estimated_effort="1-2 weeks"
            ),
            MitigationStrategy(
                strategy="Reduce project scope to fit within budget constraints, focusing on "
                        "core features with highest business value",
                priority="High",
                estimated_effort="1 week"
            ),
            MitigationStrategy(
                strategy="Explore alternative funding sources: grants, partnerships, or "
                        "phased funding approach",
                priority="High",
                estimated_effort="2-4 weeks"
            ),
        ])
    
    if severity in ['High', 'Medium']:
        strategies.extend([
            MitigationStrategy(
                strategy="Optimize resource allocation by using open-source tools and cloud "
                        "services with free tiers where possible",
                priority="High" if severity == 'High' else "Medium",
                estimated_effort="1 week"
            ),
            MitigationStrategy(
                strategy="Negotiate better rates with vendors and service providers, or switch "
                        "to more cost-effective alternatives",
                priority="Medium",
                estimated_effort="2-3 weeks"
            ),
            MitigationStrategy(
                strategy="Consider hiring mix of full-time and contract workers to optimize "
                        "costs while maintaining quality",
                priority="Medium",
                estimated_effort="3-4 weeks"
            ),
        ])
    
    strategies.append(
        MitigationStrategy(
            strategy="Implement strict budget tracking and weekly financial reviews to catch "
                    "overruns early",
            priority="Medium",
            estimated_effort="1 week setup"
        )
    )
    
    return strategies


def generate_resource_mitigations(risk: RiskPrediction) -> List[MitigationStrategy]:
    """
    Generate mitigation strategies for resource/team risks
    
    Args:
        risk: Risk prediction with resource category
    
    Returns:
        List of prioritized mitigation strategies
    
    Validates: Requirements 5.1, 5.6
    """
    severity = get_risk_severity(risk.score)
    strategies = []
    
    if severity == 'High':
        strategies.extend([
            MitigationStrategy(
                strategy="Hire or contract 1-2 senior developers immediately to provide "
                        "technical leadership and mentorship",
                priority="High",
                estimated_effort="3-6 weeks"
            ),
            MitigationStrategy(
                strategy="Engage external technical consultant or architect for critical "
                        "design decisions and code reviews",
                priority="High",
                estimated_effort="2-3 weeks"
            ),
            MitigationStrategy(
                strategy="Implement mandatory pair programming between junior and mid-level "
                        "developers to accelerate knowledge transfer",
                priority="High",
                estimated_effort="1 week setup"
            ),
        ])
    
    if severity in ['High', 'Medium']:
        strategies.extend([
            MitigationStrategy(
                strategy="Establish comprehensive onboarding program with documentation, "
                        "training materials, and mentorship assignments",
                priority="High" if severity == 'High' else "Medium",
                estimated_effort="2-3 weeks"
            ),
            MitigationStrategy(
                strategy="Schedule weekly technical training sessions and code review workshops "
                        "to build team capabilities",
                priority="Medium",
                estimated_effort="Ongoing"
            ),
            MitigationStrategy(
                strategy="Create detailed technical documentation and coding standards to guide "
                        "less experienced team members",
                priority="Medium",
                estimated_effort="2-3 weeks"
            ),
        ])
    
    strategies.append(
        MitigationStrategy(
            strategy="Implement rigorous code review process with automated testing to catch "
                    "issues early and maintain quality",
            priority="Medium",
            estimated_effort="1-2 weeks"
        )
    )
    
    return strategies


def generate_technical_mitigations(risk: RiskPrediction) -> List[MitigationStrategy]:
    """
    Generate mitigation strategies for technical risks
    
    Args:
        risk: Risk prediction with technical category
    
    Returns:
        List of prioritized mitigation strategies
    
    Validates: Requirements 5.1, 5.6
    """
    severity = get_risk_severity(risk.score)
    strategies = []
    
    if severity == 'High':
        strategies.extend([
            MitigationStrategy(
                strategy="Conduct immediate technical spike (1-2 weeks) to validate experimental "
                        "technologies and identify potential issues",
                priority="High",
                estimated_effort="1-2 weeks"
            ),
            MitigationStrategy(
                strategy="Consider replacing experimental technologies with proven, stable "
                        "alternatives that have strong community support",
                priority="High",
                estimated_effort="2-4 weeks"
            ),
            MitigationStrategy(
                strategy="Hire or contract specialists with expertise in the specific "
                        "technologies being used",
                priority="High",
                estimated_effort="3-6 weeks"
            ),
        ])
    
    if severity in ['High', 'Medium']:
        strategies.extend([
            MitigationStrategy(
                strategy="Allocate dedicated time for team to learn new technologies through "
                        "training, courses, and proof-of-concepts",
                priority="High" if severity == 'High' else "Medium",
                estimated_effort="2-3 weeks"
            ),
            MitigationStrategy(
                strategy="Establish relationships with technology vendors or open-source "
                        "maintainers for priority support",
                priority="Medium",
                estimated_effort="1-2 weeks"
            ),
            MitigationStrategy(
                strategy="Create abstraction layers around experimental technologies to enable "
                        "easier replacement if needed",
                priority="Medium",
                estimated_effort="2-3 weeks"
            ),
        ])
    
    strategies.extend([
        MitigationStrategy(
            strategy="Implement comprehensive automated testing and monitoring to catch "
                    "technology-related issues early",
            priority="Medium",
            estimated_effort="2-3 weeks"
        ),
        MitigationStrategy(
            strategy="Document all technology decisions, workarounds, and known issues for "
                    "team reference",
            priority="Low",
            estimated_effort="Ongoing"
        ),
    ])
    
    return strategies


def generate_external_mitigations(risk: RiskPrediction) -> List[MitigationStrategy]:
    """
    Generate mitigation strategies for external risks
    
    Args:
        risk: Risk prediction with external category
    
    Returns:
        List of prioritized mitigation strategies
    
    Validates: Requirements 5.1, 5.6
    """
    severity = get_risk_severity(risk.score)
    strategies = []
    
    if severity == 'High':
        strategies.extend([
            MitigationStrategy(
                strategy="Establish direct communication channels with key stakeholders and "
                        "schedule weekly alignment meetings",
                priority="High",
                estimated_effort="1 week"
            ),
            MitigationStrategy(
                strategy="Create contingency plans for critical external dependencies with "
                        "alternative vendors or solutions",
                priority="High",
                estimated_effort="2-3 weeks"
            ),
        ])
    
    strategies.extend([
        MitigationStrategy(
            strategy="Implement Service Level Agreements (SLAs) with external vendors and "
                    "monitor compliance closely",
            priority="High" if severity == 'High' else "Medium",
            estimated_effort="2-3 weeks"
        ),
        MitigationStrategy(
            strategy="Build buffer time into schedule to account for external dependencies "
                    "and potential delays",
            priority="Medium",
            estimated_effort="1 week"
        ),
        MitigationStrategy(
            strategy="Maintain regular stakeholder communication with status reports and "
                    "risk updates",
            priority="Medium",
            estimated_effort="Ongoing"
        ),
    ])
    
    return strategies


def generate_mitigations(risk: RiskPrediction) -> List[MitigationStrategy]:
    """
    Generate mitigation strategies based on risk category
    
    Routes to appropriate category-specific generator and ensures
    strategies are prioritized correctly.
    
    Args:
        risk: Risk prediction to generate mitigations for
    
    Returns:
        List of prioritized mitigation strategies
    
    Validates: Requirements 5.1, 5.6
    """
    category_generators = {
        'Schedule': generate_timeline_mitigations,
        'Budget': generate_budget_mitigations,
        'Resource': generate_resource_mitigations,
        'Technical': generate_technical_mitigations,
        'External': generate_external_mitigations,
    }
    
    generator = category_generators.get(risk.category)
    if not generator:
        # Fallback to generic mitigations
        return [
            MitigationStrategy(
                strategy="Conduct detailed risk assessment and develop specific action plan",
                priority="High",
                estimated_effort="1 week"
            ),
            MitigationStrategy(
                strategy="Monitor risk indicators closely and escalate to stakeholders if needed",
                priority="Medium",
                estimated_effort="Ongoing"
            ),
        ]
    
    strategies = generator(risk)
    
    # Sort by priority (High > Medium > Low)
    priority_order = {'High': 0, 'Medium': 1, 'Low': 2}
    strategies.sort(key=lambda s: priority_order[s.priority])
    
    return strategies


def prioritize_mitigations(mitigations: List[MitigationStrategy]) -> List[MitigationStrategy]:
    """
    Prioritize mitigation strategies
    
    Sorts mitigations by priority level: High > Medium > Low
    
    Args:
        mitigations: List of mitigation strategies
    
    Returns:
        Sorted list of mitigation strategies
    
    Validates: Requirements 5.6
    """
    priority_order = {'High': 0, 'Medium': 1, 'Low': 2}
    return sorted(mitigations, key=lambda m: priority_order[m.priority])

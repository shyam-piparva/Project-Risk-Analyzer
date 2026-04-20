"""
Rule-Based Risk Detection
Implements specific risk detection rules for different risk categories
Integrates PERT and CPM analysis for advanced project risk assessment
Validates: Requirements 3.1, 3.4, 3.6
"""

from datetime import date, timedelta
from typing import List, Optional
from .models import Project, RiskPrediction, TeamMember, Technology
from .scoring import calculate_risk_score
from .pert_analysis import perform_pert_analysis, PERTAnalysisResult
from .cpm_analysis import perform_cpm_analysis, CPMAnalysisResult


def detect_timeline_compression_risk(project: Project, pert_result: Optional[PERTAnalysisResult] = None, cpm_result: Optional[CPMAnalysisResult] = None) -> Optional[RiskPrediction]:
    """
    Detect risks related to compressed or aggressive timelines using PERT/CPM analysis
    
    Uses PERT analysis to calculate expected duration and probability of completion.
    Uses CPM analysis to identify critical path and schedule constraints.
    
    Args:
        project: Project to analyze
        pert_result: PERT analysis results (optional, will calculate if not provided)
        cpm_result: CPM analysis results (optional, will calculate if not provided)
    
    Returns:
        RiskPrediction if risk detected, None otherwise
    
    Validates: Requirements 3.1, 3.6
    """
    # Perform PERT analysis if not provided
    if pert_result is None:
        pert_result = perform_pert_analysis(project)
    
    # Perform CPM analysis if not provided
    if cpm_result is None:
        cpm_result = perform_cpm_analysis(project)
    
    duration_days = (project.end_date - project.start_date).days
    
    # Use PERT probability and CPM critical path for risk assessment
    probability_on_time = pert_result.probability_on_time
    expected_duration = pert_result.expected_duration
    critical_path_duration = cpm_result.critical_path_duration
    
    # Calculate probability and impact based on PERT/CPM results
    # Probability: inverse of probability_on_time
    probability = 1.0 - probability_on_time
    
    # Impact: based on schedule compression and critical path
    schedule_compression = duration_days / expected_duration if expected_duration > 0 else 1.0
    critical_path_ratio = critical_path_duration / duration_days if duration_days > 0 else 1.0
    
    # High impact if schedule is compressed or critical path is tight
    if schedule_compression < 0.8 or critical_path_ratio > 1.1:
        impact = 0.9
    elif schedule_compression < 0.9 or critical_path_ratio > 1.0:
        impact = 0.7
    elif schedule_compression < 1.0 or critical_path_ratio > 0.95:
        impact = 0.5
    else:
        impact = 0.3
    
    # Only report risk if probability is significant
    if probability < 0.2:
        return None
    
    score = calculate_risk_score(probability, impact)
    
    # Build detailed description with PERT/CPM insights
    description_parts = []
    description_parts.append(
        f"PERT Analysis: Expected duration is {expected_duration:.1f} days "
        f"(planned: {duration_days} days). "
        f"Probability of on-time completion: {probability_on_time*100:.1f}%."
    )
    
    description_parts.append(
        f"CPM Analysis: Critical path duration is {critical_path_duration:.1f} days "
        f"with {cpm_result.critical_tasks_count} critical tasks "
        f"({cpm_result.critical_path_percentage*100:.1f}% of all tasks)."
    )
    
    if schedule_compression < 1.0:
        description_parts.append(
            f"Schedule is compressed by {(1-schedule_compression)*100:.1f}%, "
            "increasing risk of delays, rushed development, and quality issues."
        )
    
    if pert_result.standard_deviation > expected_duration * 0.15:
        description_parts.append(
            f"High schedule uncertainty (σ={pert_result.standard_deviation:.1f} days) "
            "indicates significant variability in completion time."
        )
    
    return RiskPrediction(
        title="Schedule Risk (PERT/CPM Analysis)",
        description=" ".join(description_parts),
        category="Schedule",
        score=score,
        probability=probability,
        impact=impact,
        mitigations=[]  # Will be populated by mitigation generator
    )


def detect_budget_constraint_risk(project: Project) -> Optional[RiskPrediction]:
    """
    Detect risks related to budget constraints
    
    Rule: Budget per team member per month below industry thresholds indicates
    budget constraint risks.
    
    Industry benchmarks:
    - < $5,000/person/month: High risk
    - $5,000-$8,000/person/month: Medium risk
    - > $8,000/person/month: Low/No risk
    
    Args:
        project: Project to analyze
    
    Returns:
        RiskPrediction if risk detected, None otherwise
    
    Validates: Requirements 3.1, 3.6
    """
    duration_days = (project.end_date - project.start_date).days
    duration_months = max(1, duration_days / 30.0)
    
    budget_per_person_per_month = project.budget / (project.team_size * duration_months)
    
    probability = 0.0
    impact = 0.0
    risk_level = ""
    
    # Determine risk based on budget thresholds
    if budget_per_person_per_month < 3000:
        probability = 0.9
        impact = 0.8
        risk_level = "critically low"
    elif budget_per_person_per_month < 5000:
        probability = 0.7
        impact = 0.7
        risk_level = "very low"
    elif budget_per_person_per_month < 8000:
        probability = 0.4
        impact = 0.5
        risk_level = "below recommended"
    else:
        # Budget is adequate
        return None
    
    score = calculate_risk_score(probability, impact)
    
    return RiskPrediction(
        title="Budget Constraint Risk",
        description=(
            f"The project budget is {risk_level} at ${budget_per_person_per_month:,.2f} "
            f"per person per month (total: ${project.budget:,.2f} for {project.team_size} "
            f"people over {duration_months:.1f} months). This may result in inability to "
            "hire qualified talent, inadequate tooling and infrastructure, scope reduction, "
            "or project delays."
        ),
        category="Budget",
        score=score,
        probability=probability,
        impact=impact,
        mitigations=[]
    )


def detect_team_experience_gap_risk(project: Project) -> Optional[RiskPrediction]:
    """
    Detect risks related to team experience gaps
    
    Rule: Teams with >50% junior members or lacking senior leadership
    face experience gap risks.
    
    Args:
        project: Project to analyze
    
    Returns:
        RiskPrediction if risk detected, None otherwise
    
    Validates: Requirements 3.1, 3.6
    """
    total_members = sum(member.count for member in project.team_composition)
    junior_count = sum(
        member.count for member in project.team_composition 
        if member.experience_level == 'Junior'
    )
    senior_count = sum(
        member.count for member in project.team_composition 
        if member.experience_level == 'Senior'
    )
    
    junior_ratio = junior_count / total_members if total_members > 0 else 0
    senior_ratio = senior_count / total_members if total_members > 0 else 0
    
    probability = 0.0
    impact = 0.0
    risk_factors = []
    
    # High junior ratio
    if junior_ratio > 0.7:
        probability += 0.7
        impact += 0.7
        risk_factors.append(f"{junior_ratio*100:.0f}% junior team members")
    elif junior_ratio > 0.5:
        probability += 0.5
        impact += 0.5
        risk_factors.append(f"{junior_ratio*100:.0f}% junior team members")
    
    # Lack of senior leadership
    if senior_count == 0:
        probability += 0.6
        impact += 0.7
        risk_factors.append("no senior leadership")
    elif senior_ratio < 0.2:
        probability += 0.3
        impact += 0.4
        risk_factors.append(f"only {senior_ratio*100:.0f}% senior members")
    
    # No risk detected
    if probability == 0:
        return None
    
    # Cap at 1.0
    probability = min(1.0, probability)
    impact = min(1.0, impact)
    
    score = calculate_risk_score(probability, impact)
    
    return RiskPrediction(
        title="Team Experience Gap Risk",
        description=(
            f"The team composition shows potential experience gaps with "
            f"{', '.join(risk_factors)}. This may lead to slower development, "
            "more bugs, architectural issues, inadequate code reviews, and "
            "difficulty making critical technical decisions."
        ),
        category="Resource",
        score=score,
        probability=probability,
        impact=impact,
        mitigations=[]
    )


def detect_technology_maturity_risk(project: Project) -> Optional[RiskPrediction]:
    """
    Detect risks related to immature or experimental technologies
    
    Rule: Projects using experimental or emerging technologies face
    higher risks due to lack of documentation, community support, and stability.
    
    Args:
        project: Project to analyze
    
    Returns:
        RiskPrediction if risk detected, None otherwise
    
    Validates: Requirements 3.1, 3.6
    """
    experimental_count = sum(
        1 for tech in project.technology_stack 
        if tech.maturity == 'Experimental'
    )
    emerging_count = sum(
        1 for tech in project.technology_stack 
        if tech.maturity == 'Emerging'
    )
    total_tech = len(project.technology_stack)
    
    experimental_ratio = experimental_count / total_tech if total_tech > 0 else 0
    emerging_ratio = emerging_count / total_tech if total_tech > 0 else 0
    
    probability = 0.0
    impact = 0.0
    risk_factors = []
    
    # Experimental technologies
    if experimental_count > 0:
        probability += 0.3 * experimental_count
        impact += 0.4 * experimental_count
        risk_factors.append(
            f"{experimental_count} experimental {'technology' if experimental_count == 1 else 'technologies'}"
        )
    
    # Emerging technologies
    if emerging_count > 2:
        probability += 0.4
        impact += 0.3
        risk_factors.append(f"{emerging_count} emerging technologies")
    elif emerging_count > 0:
        probability += 0.2
        impact += 0.2
        risk_factors.append(
            f"{emerging_count} emerging {'technology' if emerging_count == 1 else 'technologies'}"
        )
    
    # No risk detected
    if probability == 0:
        return None
    
    # Cap at 1.0
    probability = min(1.0, probability)
    impact = min(1.0, impact)
    
    score = calculate_risk_score(probability, impact)
    
    experimental_names = [
        tech.name for tech in project.technology_stack 
        if tech.maturity == 'Experimental'
    ]
    emerging_names = [
        tech.name for tech in project.technology_stack 
        if tech.maturity == 'Emerging'
    ]
    
    tech_list = []
    if experimental_names:
        tech_list.append(f"Experimental: {', '.join(experimental_names)}")
    if emerging_names:
        tech_list.append(f"Emerging: {', '.join(emerging_names)}")
    
    return RiskPrediction(
        title="Technology Maturity Risk",
        description=(
            f"The project uses {', '.join(risk_factors)}. "
            f"{' | '.join(tech_list)}. "
            "This may result in limited documentation, lack of community support, "
            "breaking changes in updates, difficulty finding experienced developers, "
            "and potential technology abandonment."
        ),
        category="Technical",
        score=score,
        probability=probability,
        impact=impact,
        mitigations=[]
    )


def categorize_risk(risk_description: str, context: str = "") -> str:
    """
    Categorize a risk based on its description and context
    
    Uses keyword matching to determine the most appropriate category.
    
    Args:
        risk_description: Description of the risk
        context: Additional context about the risk
    
    Returns:
        Risk category ('Technical', 'Resource', 'Schedule', 'Budget', or 'External')
    
    Validates: Requirements 3.4
    """
    text = (risk_description + " " + context).lower()
    
    # Category keywords
    technical_keywords = [
        'technology', 'technical', 'architecture', 'code', 'bug', 'performance',
        'security', 'infrastructure', 'integration', 'api', 'database'
    ]
    resource_keywords = [
        'team', 'staff', 'resource', 'skill', 'experience', 'talent', 'hiring',
        'training', 'knowledge', 'expertise', 'personnel'
    ]
    schedule_keywords = [
        'timeline', 'schedule', 'deadline', 'delay', 'time', 'duration',
        'milestone', 'sprint', 'velocity', 'late'
    ]
    budget_keywords = [
        'budget', 'cost', 'financial', 'funding', 'money', 'expense',
        'price', 'payment', 'investment'
    ]
    external_keywords = [
        'vendor', 'client', 'stakeholder', 'market', 'regulatory', 'compliance',
        'legal', 'external', 'third-party', 'dependency'
    ]
    
    # Count keyword matches
    scores = {
        'Technical': sum(1 for kw in technical_keywords if kw in text),
        'Resource': sum(1 for kw in resource_keywords if kw in text),
        'Schedule': sum(1 for kw in schedule_keywords if kw in text),
        'Budget': sum(1 for kw in budget_keywords if kw in text),
        'External': sum(1 for kw in external_keywords if kw in text),
    }
    
    # Return category with highest score, default to Technical
    max_category = max(scores.items(), key=lambda x: x[1])
    return max_category[0] if max_category[1] > 0 else 'Technical'


def detect_all_risks(project: Project) -> List[RiskPrediction]:
    """
    Run all risk detection rules on a project
    Performs PERT and CPM analysis once and reuses results
    
    Args:
        project: Project to analyze
    
    Returns:
        List of detected risks
    
    Validates: Requirements 3.1, 3.6
    """
    risks = []
    
    # Perform PERT and CPM analysis once
    pert_result = perform_pert_analysis(project)
    cpm_result = perform_cpm_analysis(project)
    
    # Run all detection rules with PERT/CPM results
    timeline_risk = detect_timeline_compression_risk(project, pert_result, cpm_result)
    if timeline_risk:
        risks.append(timeline_risk)
    
    budget_risk = detect_budget_constraint_risk(project)
    if budget_risk:
        risks.append(budget_risk)
    
    experience_risk = detect_team_experience_gap_risk(project)
    if experience_risk:
        risks.append(experience_risk)
    
    tech_risk = detect_technology_maturity_risk(project)
    if tech_risk:
        risks.append(tech_risk)
    
    # Add PERT-specific risk if high uncertainty
    pert_uncertainty_risk = detect_pert_uncertainty_risk(project, pert_result)
    if pert_uncertainty_risk:
        risks.append(pert_uncertainty_risk)
    
    # Add CPM-specific risk if critical path is problematic
    cpm_critical_path_risk = detect_cpm_critical_path_risk(project, cpm_result)
    if cpm_critical_path_risk:
        risks.append(cpm_critical_path_risk)
    
    return risks


def detect_pert_uncertainty_risk(project: Project, pert_result: PERTAnalysisResult) -> Optional[RiskPrediction]:
    """
    Detect risks related to high schedule uncertainty from PERT analysis
    
    Args:
        project: Project to analyze
        pert_result: PERT analysis results
    
    Returns:
        RiskPrediction if high uncertainty detected, None otherwise
    """
    # Check coefficient of variation (CV = σ / μ)
    cv = pert_result.standard_deviation / pert_result.expected_duration if pert_result.expected_duration > 0 else 0
    
    # Only report if uncertainty is high
    if cv < 0.15:
        return None
    
    # Probability based on CV
    if cv > 0.3:
        probability = 0.8
        impact = 0.7
        uncertainty_level = "very high"
    elif cv > 0.2:
        probability = 0.6
        impact = 0.6
        uncertainty_level = "high"
    else:
        probability = 0.4
        impact = 0.5
        uncertainty_level = "moderate"
    
    score = calculate_risk_score(probability, impact)
    
    description = (
        f"PERT analysis reveals {uncertainty_level} schedule uncertainty "
        f"(σ={pert_result.standard_deviation:.1f} days, CV={cv*100:.1f}%). "
        f"Expected duration: {pert_result.expected_duration:.1f} days "
        f"(range: {pert_result.optimistic_duration:.1f} to {pert_result.pessimistic_duration:.1f} days). "
        f"This variability indicates unpredictable factors that could significantly impact the schedule."
    )
    
    return RiskPrediction(
        title="Schedule Uncertainty Risk (PERT)",
        description=description,
        category="Schedule",
        score=score,
        probability=probability,
        impact=impact,
        mitigations=[]
    )


def detect_cpm_critical_path_risk(project: Project, cpm_result: CPMAnalysisResult) -> Optional[RiskPrediction]:
    """
    Detect risks related to critical path constraints from CPM analysis
    
    Args:
        project: Project to analyze
        cpm_result: CPM analysis results
    
    Returns:
        RiskPrediction if critical path risk detected, None otherwise
    """
    # Check if too many tasks are on critical path
    critical_percentage = cpm_result.critical_path_percentage
    
    # Only report if critical path percentage is high
    if critical_percentage < 0.4:
        return None
    
    # Probability and impact based on critical path percentage
    if critical_percentage > 0.7:
        probability = 0.8
        impact = 0.8
        risk_level = "severe"
    elif critical_percentage > 0.5:
        probability = 0.6
        impact = 0.6
        risk_level = "high"
    else:
        probability = 0.4
        impact = 0.5
        risk_level = "moderate"
    
    score = calculate_risk_score(probability, impact)
    
    description = (
        f"CPM analysis shows {risk_level} critical path constraints: "
        f"{cpm_result.critical_tasks_count} out of {cpm_result.total_tasks} tasks "
        f"({critical_percentage*100:.1f}%) are on the critical path. "
        f"Critical path duration: {cpm_result.critical_path_duration:.1f} days. "
        f"Any delay in these tasks will directly delay the entire project. "
        f"Limited flexibility for schedule adjustments."
    )
    
    return RiskPrediction(
        title="Critical Path Constraint Risk (CPM)",
        description=description,
        category="Schedule",
        score=score,
        probability=probability,
        impact=impact,
        mitigations=[]
    )

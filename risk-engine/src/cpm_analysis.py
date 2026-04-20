"""
CPM (Critical Path Method) Analysis
Implements CPM methodology for project scheduling and critical path identification
"""

from typing import List, Dict, Set, Tuple, Optional
from dataclasses import dataclass, field
from .models import Project


@dataclass
class Task:
    """Represents a project task in CPM network"""
    id: str
    name: str
    duration: float  # in days
    dependencies: List[str] = field(default_factory=list)  # Task IDs this depends on
    
    # Calculated fields
    earliest_start: float = 0.0
    earliest_finish: float = 0.0
    latest_start: float = 0.0
    latest_finish: float = 0.0
    slack: float = 0.0  # Float/slack time
    is_critical: bool = False


@dataclass
class CPMAnalysisResult:
    """Results from CPM analysis"""
    critical_path: List[str]  # Task IDs on critical path
    critical_path_duration: float  # Total duration of critical path
    total_tasks: int
    critical_tasks_count: int
    critical_path_percentage: float  # % of tasks on critical path
    schedule_risk_score: float  # Risk score based on critical path (0-100)
    tasks: List[Task]  # All tasks with calculated times
    network_complexity: float  # Measure of network complexity (0-1)
    parallel_paths_count: int  # Number of parallel execution paths


def generate_project_tasks(project: Project) -> List[Task]:
    """
    Generate typical project tasks based on project parameters
    
    Creates a realistic task breakdown structure with dependencies
    based on software development lifecycle phases.
    
    Args:
        project: Project to analyze
    
    Returns:
        List of tasks with dependencies
    """
    tasks = []
    
    # Calculate task durations based on project parameters
    total_duration = (project.end_date - project.start_date).days
    team_size = project.team_size
    
    # Adjust durations based on team size (more people = some parallelization)
    parallelization_factor = min(1.0, 0.5 + (team_size / 10))
    
    # Phase 1: Requirements & Planning (10-15% of project)
    req_duration = total_duration * 0.12
    tasks.extend([
        Task(id="REQ-1", name="Requirements Gathering", duration=req_duration * 0.4, dependencies=[]),
        Task(id="REQ-2", name="Requirements Analysis", duration=req_duration * 0.3, dependencies=["REQ-1"]),
        Task(id="REQ-3", name="Project Planning", duration=req_duration * 0.3, dependencies=["REQ-2"]),
    ])
    
    # Phase 2: Design (15-20% of project)
    design_duration = total_duration * 0.17
    tasks.extend([
        Task(id="DES-1", name="System Architecture Design", duration=design_duration * 0.4, dependencies=["REQ-3"]),
        Task(id="DES-2", name="Database Design", duration=design_duration * 0.3, dependencies=["DES-1"]),
        Task(id="DES-3", name="UI/UX Design", duration=design_duration * 0.3, dependencies=["DES-1"]),
    ])
    
    # Phase 3: Development (40-50% of project) - Can be parallelized
    dev_duration = total_duration * 0.45 * parallelization_factor
    tasks.extend([
        Task(id="DEV-1", name="Backend Development", duration=dev_duration * 0.4, dependencies=["DES-2"]),
        Task(id="DEV-2", name="Frontend Development", duration=dev_duration * 0.4, dependencies=["DES-3"]),
        Task(id="DEV-3", name="API Integration", duration=dev_duration * 0.2, dependencies=["DEV-1", "DEV-2"]),
    ])
    
    # Phase 4: Testing (15-20% of project)
    test_duration = total_duration * 0.17
    tasks.extend([
        Task(id="TEST-1", name="Unit Testing", duration=test_duration * 0.3, dependencies=["DEV-3"]),
        Task(id="TEST-2", name="Integration Testing", duration=test_duration * 0.3, dependencies=["TEST-1"]),
        Task(id="TEST-3", name="User Acceptance Testing", duration=test_duration * 0.4, dependencies=["TEST-2"]),
    ])
    
    # Phase 5: Deployment (5-10% of project)
    deploy_duration = total_duration * 0.09
    tasks.extend([
        Task(id="DEP-1", name="Deployment Preparation", duration=deploy_duration * 0.4, dependencies=["TEST-3"]),
        Task(id="DEP-2", name="Production Deployment", duration=deploy_duration * 0.3, dependencies=["DEP-1"]),
        Task(id="DEP-3", name="Post-Deployment Monitoring", duration=deploy_duration * 0.3, dependencies=["DEP-2"]),
    ])
    
    return tasks


def perform_forward_pass(tasks: List[Task]) -> None:
    """
    Perform forward pass to calculate earliest start and finish times
    
    Args:
        tasks: List of tasks (modified in place)
    """
    # Create task lookup
    task_map = {task.id: task for task in tasks}
    
    # Process tasks in topological order
    processed = set()
    
    def process_task(task: Task):
        if task.id in processed:
            return
        
        # Process all dependencies first
        for dep_id in task.dependencies:
            if dep_id in task_map:
                process_task(task_map[dep_id])
        
        # Calculate earliest start (max of all predecessor finish times)
        if task.dependencies:
            task.earliest_start = max(
                task_map[dep_id].earliest_finish
                for dep_id in task.dependencies
                if dep_id in task_map
            )
        else:
            task.earliest_start = 0.0
        
        task.earliest_finish = task.earliest_start + task.duration
        processed.add(task.id)
    
    for task in tasks:
        process_task(task)


def perform_backward_pass(tasks: List[Task], project_duration: float) -> None:
    """
    Perform backward pass to calculate latest start and finish times
    
    Args:
        tasks: List of tasks (modified in place)
        project_duration: Total project duration
    """
    # Create task lookup and successor map
    task_map = {task.id: task for task in tasks}
    successors = {task.id: [] for task in tasks}
    
    for task in tasks:
        for dep_id in task.dependencies:
            if dep_id in successors:
                successors[dep_id].append(task.id)
    
    # Find tasks with no successors (end tasks)
    end_tasks = [task for task in tasks if not successors[task.id]]
    
    # Set latest finish for end tasks
    for task in end_tasks:
        task.latest_finish = project_duration
    
    # Process tasks in reverse topological order
    processed = set()
    
    def process_task(task: Task):
        if task.id in processed:
            return
        
        # Process all successors first
        for succ_id in successors[task.id]:
            if succ_id in task_map:
                process_task(task_map[succ_id])
        
        # Calculate latest finish (min of all successor start times)
        if successors[task.id]:
            task.latest_finish = min(
                task_map[succ_id].latest_start
                for succ_id in successors[task.id]
                if succ_id in task_map
            )
        
        task.latest_start = task.latest_finish - task.duration
        task.slack = task.latest_start - task.earliest_start
        task.is_critical = (task.slack < 0.01)  # Account for floating point
        
        processed.add(task.id)
    
    # Process in reverse order
    for task in reversed(tasks):
        process_task(task)


def identify_critical_path(tasks: List[Task]) -> List[str]:
    """
    Identify the critical path (tasks with zero slack)
    
    Args:
        tasks: List of tasks with calculated times
    
    Returns:
        List of task IDs on the critical path
    """
    return [task.id for task in tasks if task.is_critical]


def calculate_network_complexity(tasks: List[Task]) -> float:
    """
    Calculate network complexity based on dependencies and parallel paths
    
    Args:
        tasks: List of tasks
    
    Returns:
        Complexity score (0-1)
    """
    if not tasks:
        return 0.0
    
    # Factor 1: Dependency density
    total_dependencies = sum(len(task.dependencies) for task in tasks)
    avg_dependencies = total_dependencies / len(tasks)
    dependency_complexity = min(1.0, avg_dependencies / 3.0)  # Normalize to 0-1
    
    # Factor 2: Path diversity (number of unique paths)
    # Simplified: count tasks with multiple dependencies
    multi_dep_tasks = sum(1 for task in tasks if len(task.dependencies) > 1)
    path_complexity = min(1.0, multi_dep_tasks / (len(tasks) * 0.3))
    
    # Combined complexity
    return (dependency_complexity * 0.6 + path_complexity * 0.4)


def count_parallel_paths(tasks: List[Task]) -> int:
    """
    Count the number of parallel execution paths in the network
    
    Args:
        tasks: List of tasks
    
    Returns:
        Number of parallel paths
    """
    # Find tasks that can run in parallel (same earliest start time)
    start_times = {}
    for task in tasks:
        start_time = round(task.earliest_start, 2)
        if start_time not in start_times:
            start_times[start_time] = []
        start_times[start_time].append(task)
    
    # Maximum number of tasks running in parallel at any time
    max_parallel = max(len(task_list) for task_list in start_times.values())
    
    return max_parallel


def calculate_cpm_risk_score(
    critical_path_duration: float,
    planned_duration: float,
    critical_path_percentage: float,
    network_complexity: float
) -> float:
    """
    Calculate schedule risk score based on CPM analysis
    
    Args:
        critical_path_duration: Duration of critical path
        planned_duration: Planned project duration
        critical_path_percentage: Percentage of tasks on critical path
        network_complexity: Network complexity score
    
    Returns:
        Risk score (0-100)
    """
    # Factor 1: Critical path vs planned duration
    if planned_duration > 0:
        duration_ratio = critical_path_duration / planned_duration
        if duration_ratio > 1.1:
            duration_risk = 90  # Critical path exceeds plan significantly
        elif duration_ratio > 1.0:
            duration_risk = 70  # Critical path exceeds plan
        elif duration_ratio > 0.95:
            duration_risk = 50  # Very tight schedule
        elif duration_ratio > 0.85:
            duration_risk = 30  # Reasonable buffer
        else:
            duration_risk = 10  # Good buffer
    else:
        duration_risk = 50
    
    # Factor 2: Critical path percentage (more critical tasks = higher risk)
    if critical_path_percentage > 0.6:
        cp_risk = 80  # Most tasks are critical
    elif critical_path_percentage > 0.4:
        cp_risk = 60  # Many tasks are critical
    elif critical_path_percentage > 0.2:
        cp_risk = 40  # Moderate critical tasks
    else:
        cp_risk = 20  # Few critical tasks
    
    # Factor 3: Network complexity (more complex = higher risk)
    complexity_risk = network_complexity * 70
    
    # Weighted combination
    risk_score = (
        duration_risk * 0.5 +
        cp_risk * 0.3 +
        complexity_risk * 0.2
    )
    
    return max(0.0, min(100.0, risk_score))


def perform_cpm_analysis(project: Project) -> CPMAnalysisResult:
    """
    Perform complete CPM analysis on a project
    
    Args:
        project: Project to analyze
    
    Returns:
        CPMAnalysisResult with comprehensive analysis
    """
    # Generate project tasks
    tasks = generate_project_tasks(project)
    
    # Perform forward pass
    perform_forward_pass(tasks)
    
    # Get project duration from forward pass
    project_duration = max(task.earliest_finish for task in tasks)
    
    # Perform backward pass
    perform_backward_pass(tasks, project_duration)
    
    # Identify critical path
    critical_path = identify_critical_path(tasks)
    
    # Calculate metrics
    critical_path_duration = project_duration
    total_tasks = len(tasks)
    critical_tasks_count = len(critical_path)
    critical_path_percentage = (critical_tasks_count / total_tasks) if total_tasks > 0 else 0.0
    
    # Calculate network complexity
    network_complexity = calculate_network_complexity(tasks)
    
    # Count parallel paths
    parallel_paths_count = count_parallel_paths(tasks)
    
    # Calculate planned duration
    planned_duration = (project.end_date - project.start_date).days
    
    # Calculate risk score
    schedule_risk_score = calculate_cpm_risk_score(
        critical_path_duration,
        planned_duration,
        critical_path_percentage,
        network_complexity
    )
    
    return CPMAnalysisResult(
        critical_path=critical_path,
        critical_path_duration=round(critical_path_duration, 2),
        total_tasks=total_tasks,
        critical_tasks_count=critical_tasks_count,
        critical_path_percentage=round(critical_path_percentage, 4),
        schedule_risk_score=round(schedule_risk_score, 2),
        tasks=tasks,
        network_complexity=round(network_complexity, 2),
        parallel_paths_count=parallel_paths_count
    )

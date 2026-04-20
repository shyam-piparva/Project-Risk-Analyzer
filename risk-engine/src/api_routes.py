"""
API Routes for Risk Analysis Service
Provides REST endpoints for risk analysis operations
"""

from flask import Blueprint, request, jsonify
from pydantic import ValidationError
import logging

from .models import RiskAnalysisRequest, Project
from .risk_analysis_service import RiskAnalysisService
from .db_models import RiskDB, MitigationDB
from .auth_middleware import (
    require_auth,
    require_project_access,
    require_risk_access,
    require_mitigation_access
)

logger = logging.getLogger(__name__)

# Create blueprint
api = Blueprint('api', __name__, url_prefix='/api')

# Initialize service
service = RiskAnalysisService()


@api.route('/projects/<project_id>/analyze', methods=['POST'])
@require_auth
@require_project_access
def analyze_project(project_id: str):
    """
    Analyze a project and save results
    
    POST /api/projects/:id/analyze
    
    Request Body:
        {
            "project": { ... },
            "user_id": "uuid"
        }
    
    Validates: Requirements 3.1, 7.1
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'ValidationError',
                'message': 'Request body is required'
            }), 400
        
        # Use authenticated user_id from token
        user_id = request.user_id
        
        # Validate project data
        try:
            analysis_request = RiskAnalysisRequest(**data)
            project = analysis_request.project
        except ValidationError as e:
            return jsonify({
                'error': 'ValidationError',
                'message': 'Invalid project data',
                'details': e.errors()
            }), 400
        
        # Ensure project_id matches
        if project.id != project_id:
            return jsonify({
                'error': 'ValidationError',
                'message': 'Project ID mismatch'
            }), 400
        
        # Analyze and save
        result = service.analyze_and_save(project, user_id)
        
        # Format response
        response = {
            'analysis_id': result.analysis.id,
            'project_id': result.analysis.project_id,
            'overall_score': result.analysis.overall_score,
            'analyzed_at': result.analysis.analyzed_at.isoformat(),
            'risks_count': len(result.risks),
            'metadata': result.analysis.metadata
        }
        
        logger.info(f"Project {project_id} analyzed successfully")
        return jsonify(response), 201
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({
            'error': 'ValidationError',
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Error analyzing project: {e}", exc_info=True)
        return jsonify({
            'error': 'ServerError',
            'message': 'Failed to analyze project'
        }), 500


@api.route('/projects/<project_id>/risks', methods=['GET'])
@require_auth
@require_project_access
def get_project_risks(project_id: str):
    """
    Get latest risk analysis for a project
    
    GET /api/projects/:id/risks
    
    Validates: Requirements 3.7
    """
    try:
        result = service.get_latest_analysis(project_id)
        
        if not result:
            return jsonify({
                'error': 'NotFound',
                'message': 'No risk analysis found for this project'
            }), 404
        
        # Format response
        risks_data = []
        for risk in result.risks:
            mitigations = result.mitigations.get(risk.id, [])
            risks_data.append({
                'id': risk.id,
                'title': risk.title,
                'description': risk.description,
                'category': risk.category,
                'score': risk.score,
                'probability': risk.probability,
                'impact': risk.impact,
                'status': risk.status,
                'detected_at': risk.detected_at.isoformat(),
                'resolved_at': risk.resolved_at.isoformat() if risk.resolved_at else None,
                'mitigations': [
                    {
                        'id': m.id,
                        'strategy': m.strategy,
                        'priority': m.priority,
                        'estimated_effort': m.estimated_effort,
                        'is_implemented': m.is_implemented,
                        'implemented_at': m.implemented_at.isoformat() if m.implemented_at else None,
                        'is_custom': m.is_custom
                    }
                    for m in mitigations
                ]
            })
        
        response = {
            'analysis_id': result.analysis.id,
            'project_id': result.analysis.project_id,
            'overall_score': result.analysis.overall_score,
            'analyzed_at': result.analysis.analyzed_at.isoformat(),
            'risks': risks_data,
            'metadata': result.analysis.metadata
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error retrieving risks: {e}", exc_info=True)
        return jsonify({
            'error': 'ServerError',
            'message': 'Failed to retrieve risks'
        }), 500


@api.route('/projects/<project_id>/risks/history', methods=['GET'])
@require_auth
@require_project_access
def get_risk_history(project_id: str):
    """
    Get risk analysis history for a project
    
    GET /api/projects/:id/risks/history?limit=10
    
    Validates: Requirements 7.1, 7.2
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        
        if limit < 1 or limit > 100:
            return jsonify({
                'error': 'ValidationError',
                'message': 'Limit must be between 1 and 100'
            }), 400
        
        history = service.get_analysis_history(project_id, limit)
        
        response = {
            'project_id': project_id,
            'count': len(history),
            'analyses': [
                {
                    'id': analysis.id,
                    'overall_score': analysis.overall_score,
                    'analyzed_at': analysis.analyzed_at.isoformat(),
                    'metadata': analysis.metadata
                }
                for analysis in history
            ]
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error retrieving history: {e}", exc_info=True)
        return jsonify({
            'error': 'ServerError',
            'message': 'Failed to retrieve analysis history'
        }), 500


@api.route('/analyses/compare', methods=['POST'])
@require_auth
def compare_analyses():
    """
    Compare two risk analyses
    
    POST /api/analyses/compare
    
    Request Body:
        {
            "analysis_id1": "uuid",
            "analysis_id2": "uuid"
        }
    
    Validates: Requirements 7.3
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'ValidationError',
                'message': 'Request body is required'
            }), 400
        
        analysis_id1 = data.get('analysis_id1')
        analysis_id2 = data.get('analysis_id2')
        
        if not analysis_id1 or not analysis_id2:
            return jsonify({
                'error': 'ValidationError',
                'message': 'Both analysis_id1 and analysis_id2 are required'
            }), 400
        
        comparison = service.compare_analyses(analysis_id1, analysis_id2)
        
        response = {
            'analysis1_id': comparison.analysis1_id,
            'analysis2_id': comparison.analysis2_id,
            'analysis1_date': comparison.analysis1_date.isoformat(),
            'analysis2_date': comparison.analysis2_date.isoformat(),
            'overall_score_change': comparison.overall_score_change,
            'total_risks_change': comparison.total_risks_change,
            'new_risks': [
                {
                    'id': risk.id,
                    'title': risk.title,
                    'category': risk.category,
                    'score': risk.score
                }
                for risk in comparison.new_risks
            ],
            'resolved_risks': [
                {
                    'id': risk.id,
                    'title': risk.title,
                    'category': risk.category,
                    'score': risk.score
                }
                for risk in comparison.resolved_risks
            ],
            'risk_score_changes': comparison.risk_score_changes
        }
        
        return jsonify(response), 200
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({
            'error': 'ValidationError',
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Error comparing analyses: {e}", exc_info=True)
        return jsonify({
            'error': 'ServerError',
            'message': 'Failed to compare analyses'
        }), 500


@api.route('/risks/<risk_id>', methods=['GET'])
@require_auth
@require_risk_access
def get_risk(risk_id: str):
    """
    Get a specific risk with mitigations
    
    GET /api/risks/:id
    """
    try:
        result = service.get_risk_by_id(risk_id)
        
        if not result:
            return jsonify({
                'error': 'NotFound',
                'message': 'Risk not found'
            }), 404
        
        risk, mitigations = result
        
        response = {
            'id': risk.id,
            'analysis_id': risk.analysis_id,
            'title': risk.title,
            'description': risk.description,
            'category': risk.category,
            'score': risk.score,
            'probability': risk.probability,
            'impact': risk.impact,
            'status': risk.status,
            'detected_at': risk.detected_at.isoformat(),
            'resolved_at': risk.resolved_at.isoformat() if risk.resolved_at else None,
            'mitigations': [
                {
                    'id': m.id,
                    'strategy': m.strategy,
                    'priority': m.priority,
                    'estimated_effort': m.estimated_effort,
                    'is_implemented': m.is_implemented,
                    'implemented_at': m.implemented_at.isoformat() if m.implemented_at else None,
                    'is_custom': m.is_custom,
                    'created_at': m.created_at.isoformat()
                }
                for m in mitigations
            ]
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error retrieving risk: {e}", exc_info=True)
        return jsonify({
            'error': 'ServerError',
            'message': 'Failed to retrieve risk'
        }), 500


@api.route('/risks/<risk_id>/mitigations', methods=['POST'])
@require_auth
@require_risk_access
def add_mitigation(risk_id: str):
    """
    Add custom mitigation to a risk
    
    POST /api/risks/:id/mitigations
    
    Request Body:
        {
            "strategy": "string",
            "priority": "High|Medium|Low",
            "estimated_effort": "string"
        }
    
    Validates: Requirements 5.4
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'ValidationError',
                'message': 'Request body is required'
            }), 400
        
        strategy = data.get('strategy')
        if not strategy or not strategy.strip():
            return jsonify({
                'error': 'ValidationError',
                'message': 'strategy is required'
            }), 400
        
        priority = data.get('priority', 'Medium')
        if priority not in ['High', 'Medium', 'Low']:
            return jsonify({
                'error': 'ValidationError',
                'message': 'priority must be High, Medium, or Low'
            }), 400
        
        estimated_effort = data.get('estimated_effort', 'TBD')
        
        mitigation = service.add_custom_mitigation(
            risk_id,
            strategy,
            priority,
            estimated_effort
        )
        
        response = {
            'id': mitigation.id,
            'risk_id': mitigation.risk_id,
            'strategy': mitigation.strategy,
            'priority': mitigation.priority,
            'estimated_effort': mitigation.estimated_effort,
            'is_implemented': mitigation.is_implemented,
            'is_custom': mitigation.is_custom,
            'created_at': mitigation.created_at.isoformat()
        }
        
        return jsonify(response), 201
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({
            'error': 'ValidationError',
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Error adding mitigation: {e}", exc_info=True)
        return jsonify({
            'error': 'ServerError',
            'message': 'Failed to add mitigation'
        }), 500


@api.route('/mitigations/<mitigation_id>/implement', methods=['PUT'])
@require_auth
@require_mitigation_access
def implement_mitigation(mitigation_id: str):
    """
    Mark mitigation as implemented
    
    PUT /api/mitigations/:id/implement
    
    Validates: Requirements 5.3, 7.5
    """
    try:
        mitigation = service.mark_mitigation_implemented(mitigation_id)
        
        response = {
            'id': mitigation.id,
            'risk_id': mitigation.risk_id,
            'strategy': mitigation.strategy,
            'is_implemented': mitigation.is_implemented,
            'implemented_at': mitigation.implemented_at.isoformat() if mitigation.implemented_at else None
        }
        
        return jsonify(response), 200
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({
            'error': 'NotFound',
            'message': str(e)
        }), 404
    except Exception as e:
        logger.error(f"Error implementing mitigation: {e}", exc_info=True)
        return jsonify({
            'error': 'ServerError',
            'message': 'Failed to mark mitigation as implemented'
        }), 500


@api.route('/risks/<risk_id>/status', methods=['PUT'])
@require_auth
@require_risk_access
def update_risk_status(risk_id: str):
    """
    Update risk status
    
    PUT /api/risks/:id/status
    
    Request Body:
        {
            "status": "Open|In Progress|Mitigated|Resolved|Accepted",
            "resolved": false
        }
    
    Validates: Requirements 5.3, 7.5
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'ValidationError',
                'message': 'Request body is required'
            }), 400
        
        status = data.get('status')
        if not status:
            return jsonify({
                'error': 'ValidationError',
                'message': 'status is required'
            }), 400
        
        valid_statuses = ['Open', 'In Progress', 'Mitigated', 'Resolved', 'Accepted']
        if status not in valid_statuses:
            return jsonify({
                'error': 'ValidationError',
                'message': f'status must be one of: {", ".join(valid_statuses)}'
            }), 400
        
        resolved = data.get('resolved', False)
        
        risk = service.update_risk_status(risk_id, status, resolved)
        
        response = {
            'id': risk.id,
            'title': risk.title,
            'status': risk.status,
            'resolved_at': risk.resolved_at.isoformat() if risk.resolved_at else None
        }
        
        return jsonify(response), 200
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({
            'error': 'NotFound',
            'message': str(e)
        }), 404
    except Exception as e:
        logger.error(f"Error updating risk status: {e}", exc_info=True)
        return jsonify({
            'error': 'ServerError',
            'message': 'Failed to update risk status'
        }), 500

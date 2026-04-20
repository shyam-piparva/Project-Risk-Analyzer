"""
Authorization Middleware for Risk Analysis API
Validates JWT tokens and enforces access control
Validates: Requirements 1.3, 1.7, 2.3
"""

import os
import jwt
import logging
from functools import wraps
from flask import request, jsonify
from typing import Optional, Callable

logger = logging.getLogger(__name__)

# JWT configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'


def extract_token_from_header() -> Optional[str]:
    """
    Extract JWT token from Authorization header
    
    Returns:
        Token string or None if not found
    """
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return None
    
    # Expected format: "Bearer <token>"
    parts = auth_header.split()
    
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    
    return parts[1]


def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return None


def require_auth(f: Callable) -> Callable:
    """
    Decorator to require authentication for an endpoint
    
    Usage:
        @api.route('/protected')
        @require_auth
        def protected_endpoint():
            user_id = request.user_id
            ...
    
    Validates: Requirements 1.3, 1.4
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Extract token
        token = extract_token_from_header()
        
        if not token:
            return jsonify({
                'error': 'AuthenticationError',
                'message': 'Missing authentication token'
            }), 401
        
        # Verify token
        payload = verify_token(token)
        
        if not payload:
            return jsonify({
                'error': 'AuthenticationError',
                'message': 'Invalid or expired token'
            }), 401
        
        # Extract user information
        user_id = payload.get('userId') or payload.get('user_id')
        
        if not user_id:
            return jsonify({
                'error': 'AuthenticationError',
                'message': 'Invalid token payload'
            }), 401
        
        # Attach user info to request
        request.user_id = user_id
        request.user_email = payload.get('email')
        
        return f(*args, **kwargs)
    
    return decorated_function


def verify_project_ownership(project_id: str, user_id: str) -> bool:
    """
    Verify that a user owns a project
    
    Args:
        project_id: Project UUID
        user_id: User UUID
    
    Returns:
        True if user owns project, False otherwise
    
    Validates: Requirements 1.7, 2.3
    """
    from .database import get_db_cursor
    
    try:
        with get_db_cursor(commit=False) as cur:
            cur.execute(
                "SELECT user_id FROM projects WHERE id = %s",
                (project_id,)
            )
            
            row = cur.fetchone()
            
            if not row:
                return False
            
            return row['user_id'] == user_id
    except Exception as e:
        logger.error(f"Error verifying project ownership: {e}")
        return False


def require_project_access(f: Callable) -> Callable:
    """
    Decorator to require project ownership for an endpoint
    
    Expects 'project_id' in route parameters
    
    Usage:
        @api.route('/projects/<project_id>/analyze')
        @require_auth
        @require_project_access
        def analyze_project(project_id):
            ...
    
    Validates: Requirements 1.7, 2.3
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        project_id = kwargs.get('project_id')
        
        if not project_id:
            return jsonify({
                'error': 'ValidationError',
                'message': 'Project ID is required'
            }), 400
        
        user_id = getattr(request, 'user_id', None)
        
        if not user_id:
            return jsonify({
                'error': 'AuthenticationError',
                'message': 'User not authenticated'
            }), 401
        
        # Verify ownership
        if not verify_project_ownership(project_id, user_id):
            return jsonify({
                'error': 'AuthorizationError',
                'message': 'You do not have permission to access this project'
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function


def verify_risk_access(risk_id: str, user_id: str) -> bool:
    """
    Verify that a user has access to a risk
    (by verifying they own the project containing the risk)
    
    Args:
        risk_id: Risk UUID
        user_id: User UUID
    
    Returns:
        True if user has access, False otherwise
    
    Validates: Requirements 1.7
    """
    from .database import get_db_cursor
    
    try:
        with get_db_cursor(commit=False) as cur:
            cur.execute(
                """
                SELECT p.user_id
                FROM risks r
                JOIN risk_analyses ra ON r.analysis_id = ra.id
                JOIN projects p ON ra.project_id = p.id
                WHERE r.id = %s
                """,
                (risk_id,)
            )
            
            row = cur.fetchone()
            
            if not row:
                return False
            
            return row['user_id'] == user_id
    except Exception as e:
        logger.error(f"Error verifying risk access: {e}")
        return False


def require_risk_access(f: Callable) -> Callable:
    """
    Decorator to require risk access for an endpoint
    
    Expects 'risk_id' in route parameters
    
    Usage:
        @api.route('/risks/<risk_id>')
        @require_auth
        @require_risk_access
        def get_risk(risk_id):
            ...
    
    Validates: Requirements 1.7
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        risk_id = kwargs.get('risk_id')
        
        if not risk_id:
            return jsonify({
                'error': 'ValidationError',
                'message': 'Risk ID is required'
            }), 400
        
        user_id = getattr(request, 'user_id', None)
        
        if not user_id:
            return jsonify({
                'error': 'AuthenticationError',
                'message': 'User not authenticated'
            }), 401
        
        # Verify access
        if not verify_risk_access(risk_id, user_id):
            return jsonify({
                'error': 'AuthorizationError',
                'message': 'You do not have permission to access this risk'
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function


def verify_mitigation_access(mitigation_id: str, user_id: str) -> bool:
    """
    Verify that a user has access to a mitigation
    (by verifying they own the project containing the mitigation)
    
    Args:
        mitigation_id: Mitigation UUID
        user_id: User UUID
    
    Returns:
        True if user has access, False otherwise
    
    Validates: Requirements 1.7
    """
    from .database import get_db_cursor
    
    try:
        with get_db_cursor(commit=False) as cur:
            cur.execute(
                """
                SELECT p.user_id
                FROM mitigations m
                JOIN risks r ON m.risk_id = r.id
                JOIN risk_analyses ra ON r.analysis_id = ra.id
                JOIN projects p ON ra.project_id = p.id
                WHERE m.id = %s
                """,
                (mitigation_id,)
            )
            
            row = cur.fetchone()
            
            if not row:
                return False
            
            return row['user_id'] == user_id
    except Exception as e:
        logger.error(f"Error verifying mitigation access: {e}")
        return False


def require_mitigation_access(f: Callable) -> Callable:
    """
    Decorator to require mitigation access for an endpoint
    
    Expects 'mitigation_id' in route parameters
    
    Usage:
        @api.route('/mitigations/<mitigation_id>/implement')
        @require_auth
        @require_mitigation_access
        def implement_mitigation(mitigation_id):
            ...
    
    Validates: Requirements 1.7
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        mitigation_id = kwargs.get('mitigation_id')
        
        if not mitigation_id:
            return jsonify({
                'error': 'ValidationError',
                'message': 'Mitigation ID is required'
            }), 400
        
        user_id = getattr(request, 'user_id', None)
        
        if not user_id:
            return jsonify({
                'error': 'AuthenticationError',
                'message': 'User not authenticated'
            }), 401
        
        # Verify access
        if not verify_mitigation_access(mitigation_id, user_id):
            return jsonify({
                'error': 'AuthorizationError',
                'message': 'You do not have permission to access this mitigation'
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

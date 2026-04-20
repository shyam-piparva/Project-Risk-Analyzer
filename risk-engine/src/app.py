"""
Flask REST API for Risk Analysis Engine
Provides HTTP endpoints for risk analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from pydantic import ValidationError
import logging
import os

from .models import RiskAnalysisRequest, Project
from .engine import RiskAnalysisEngine
from .api_routes import api
from .database import initialize_pool, close_pool, test_connection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Register blueprints
app.register_blueprint(api)

# Initialize Risk Analysis Engine
engine = RiskAnalysisEngine()


# Initialize database connection pool on startup
def setup():
    """Initialize database connection pool"""
    try:
        initialize_pool()
        if test_connection():
            logger.info("Database connection successful")
        else:
            logger.warning("Database connection test failed")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")


# Call setup when module is loaded
with app.app_context():
    setup()


@app.teardown_appcontext
def shutdown_session(exception=None):
    """Clean up database connections"""
    if exception:
        logger.error(f"Application error: {exception}")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    db_healthy = test_connection()
    
    return jsonify({
        'status': 'healthy' if db_healthy else 'degraded',
        'service': 'risk-analysis-engine',
        'version': engine.version,
        'database': 'connected' if db_healthy else 'disconnected'
    }), 200 if db_healthy else 503


@app.route('/api/analyze', methods=['POST'])
def analyze_project():
    """
    Analyze a project for risks
    
    Request Body:
        {
            "project": {
                "id": "uuid",
                "name": "Project Name",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "budget": 100000,
                "team_size": 5,
                "team_composition": [...],
                "technology_stack": [...]
            }
        }
    
    Returns:
        {
            "project_id": "uuid",
            "overall_score": 65.5,
            "risks": [...],
            "metadata": {...}
        }
    """
    try:
        # Parse and validate request
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'ValidationError',
                'message': 'Request body is required',
                'field': 'body'
            }), 400
        
        # Validate using Pydantic models
        try:
            analysis_request = RiskAnalysisRequest(**data)
        except ValidationError as e:
            logger.warning(f"Validation error: {e}")
            return jsonify({
                'error': 'ValidationError',
                'message': 'Invalid request data',
                'details': e.errors()
            }), 400
        
        # Perform risk analysis
        logger.info(f"Analyzing project: {analysis_request.project.id}")
        result = engine.analyze(analysis_request.project)
        
        # Return response
        logger.info(
            f"Analysis complete for project {result.project_id}: "
            f"{len(result.risks)} risks detected, overall score: {result.overall_score}"
        )
        
        return jsonify(result.model_dump()), 200
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({
            'error': 'ValidationError',
            'message': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Unexpected error during analysis: {e}", exc_info=True)
        return jsonify({
            'error': 'ServerError',
            'message': 'An unexpected error occurred during analysis',
            'details': str(e)
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'NotFound',
        'message': 'The requested endpoint does not exist'
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors"""
    return jsonify({
        'error': 'MethodNotAllowed',
        'message': 'The HTTP method is not allowed for this endpoint'
    }), 405


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}", exc_info=True)
    return jsonify({
        'error': 'ServerError',
        'message': 'An internal server error occurred'
    }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting Risk Analysis Engine on port {port}")
    
    try:
        app.run(host='0.0.0.0', port=port, debug=debug)
    finally:
        close_pool()
        logger.info("Application shutdown complete")

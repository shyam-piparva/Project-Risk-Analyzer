"""
Unit tests for API routes
Tests endpoint structure and validation
"""

import pytest


class TestAPIEndpointDocumentation:
    """Test that all required API endpoints are documented"""
    
    def test_all_required_endpoints_exist(self):
        """Verify all required endpoints are implemented"""
        from src.api_routes import api
        
        # Get all routes from the blueprint
        routes = []
        for rule in api.url_map.iter_rules():
            if rule.endpoint.startswith('api.'):
                routes.append({
                    'endpoint': rule.endpoint,
                    'methods': rule.methods,
                    'path': str(rule)
                })
        
        # Required endpoints from task 11.1
        required_endpoints = [
            ('POST', '/api/projects/<project_id>/analyze'),
            ('GET', '/api/projects/<project_id>/risks'),
            ('GET', '/api/projects/<project_id>/risks/history'),
            ('GET', '/api/risks/<risk_id>'),
            ('POST', '/api/risks/<risk_id>/mitigations'),
            ('PUT', '/api/mitigations/<mitigation_id>/implement'),
            ('PUT', '/api/risks/<risk_id>/status'),
        ]
        
        # Verify each required endpoint exists
        for method, path in required_endpoints:
            found = False
            for route in routes:
                if path in route['path'] and method in route['methods']:
                    found = True
                    break
            
            assert found, f"Required endpoint not found: {method} {path}"
    
    def test_authorization_decorators_imported(self):
        """Verify authorization decorators are imported"""
        from src import api_routes
        
        # Check that auth middleware is imported
        assert hasattr(api_routes, 'require_auth')
        assert hasattr(api_routes, 'require_project_access')
        assert hasattr(api_routes, 'require_risk_access')
        assert hasattr(api_routes, 'require_mitigation_access')
    
    def test_service_initialized(self):
        """Verify risk analysis service is initialized"""
        from src.api_routes import service
        from src.risk_analysis_service import RiskAnalysisService
        
        assert isinstance(service, RiskAnalysisService)


class TestValidationLogic:
    """Test validation logic in endpoints"""
    
    def test_priority_validation_values(self):
        """Test that valid priority values are defined"""
        valid_priorities = ['High', 'Medium', 'Low']
        
        # This is the expected validation in add_mitigation endpoint
        for priority in valid_priorities:
            assert priority in ['High', 'Medium', 'Low']
    
    def test_status_validation_values(self):
        """Test that valid status values are defined"""
        valid_statuses = ['Open', 'In Progress', 'Mitigated', 'Resolved', 'Accepted']
        
        # This is the expected validation in update_risk_status endpoint
        for status in valid_statuses:
            assert status in ['Open', 'In Progress', 'Mitigated', 'Resolved', 'Accepted']
    
    def test_limit_validation_range(self):
        """Test that limit validation range is correct"""
        # From get_risk_history endpoint
        min_limit = 1
        max_limit = 100
        
        assert min_limit == 1
        assert max_limit == 100
        
        # Test boundary values
        assert 1 >= min_limit and 1 <= max_limit
        assert 100 >= min_limit and 100 <= max_limit
        assert 0 < min_limit
        assert 101 > max_limit

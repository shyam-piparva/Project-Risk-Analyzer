"""
Unit tests for risk scoring algorithms
"""

import pytest
from src.scoring import calculate_risk_score, get_risk_severity, calculate_overall_risk_score


class TestCalculateRiskScore:
    """Test risk score calculation"""
    
    def test_zero_probability_and_impact(self):
        """Test with zero probability and impact"""
        score = calculate_risk_score(0.0, 0.0)
        assert score == 0.0
    
    def test_max_probability_and_impact(self):
        """Test with maximum probability and impact"""
        score = calculate_risk_score(1.0, 1.0)
        assert score == 100.0
    
    def test_equal_probability_and_impact(self):
        """Test with equal probability and impact"""
        score = calculate_risk_score(0.5, 0.5)
        assert score == 50.0
    
    def test_high_probability_low_impact(self):
        """Test with high probability but low impact"""
        score = calculate_risk_score(0.9, 0.1)
        assert score == 50.0
    
    def test_low_probability_high_impact(self):
        """Test with low probability but high impact"""
        score = calculate_risk_score(0.1, 0.9)
        assert score == 50.0
    
    def test_invalid_probability_too_low(self):
        """Test with probability below valid range"""
        with pytest.raises(ValueError, match="Probability must be between 0 and 1"):
            calculate_risk_score(-0.1, 0.5)
    
    def test_invalid_probability_too_high(self):
        """Test with probability above valid range"""
        with pytest.raises(ValueError, match="Probability must be between 0 and 1"):
            calculate_risk_score(1.1, 0.5)
    
    def test_invalid_impact_too_low(self):
        """Test with impact below valid range"""
        with pytest.raises(ValueError, match="Impact must be between 0 and 1"):
            calculate_risk_score(0.5, -0.1)
    
    def test_invalid_impact_too_high(self):
        """Test with impact above valid range"""
        with pytest.raises(ValueError, match="Impact must be between 0 and 1"):
            calculate_risk_score(0.5, 1.1)
    
    def test_weighted_formula(self):
        """Test the weighted formula calculation"""
        # (0.8 * 0.5 + 0.6 * 0.5) * 100 = 70
        score = calculate_risk_score(0.8, 0.6)
        assert score == 70.0


class TestGetRiskSeverity:
    """Test risk severity determination"""
    
    def test_high_severity_boundary(self):
        """Test high severity at boundary (70)"""
        assert get_risk_severity(70.0) == 'High'
    
    def test_high_severity_max(self):
        """Test high severity at maximum (100)"""
        assert get_risk_severity(100.0) == 'High'
    
    def test_high_severity_middle(self):
        """Test high severity in middle range"""
        assert get_risk_severity(85.0) == 'High'
    
    def test_medium_severity_lower_boundary(self):
        """Test medium severity at lower boundary (40)"""
        assert get_risk_severity(40.0) == 'Medium'
    
    def test_medium_severity_upper_boundary(self):
        """Test medium severity just below high (69.99)"""
        assert get_risk_severity(69.99) == 'Medium'
    
    def test_medium_severity_middle(self):
        """Test medium severity in middle range"""
        assert get_risk_severity(55.0) == 'Medium'
    
    def test_low_severity_zero(self):
        """Test low severity at minimum (0)"""
        assert get_risk_severity(0.0) == 'Low'
    
    def test_low_severity_upper_boundary(self):
        """Test low severity just below medium (39.99)"""
        assert get_risk_severity(39.99) == 'Low'
    
    def test_low_severity_middle(self):
        """Test low severity in middle range"""
        assert get_risk_severity(20.0) == 'Low'
    
    def test_invalid_score_negative(self):
        """Test with negative score"""
        with pytest.raises(ValueError, match="Risk score must be between 0 and 100"):
            get_risk_severity(-1.0)
    
    def test_invalid_score_too_high(self):
        """Test with score above 100"""
        with pytest.raises(ValueError, match="Risk score must be between 0 and 100"):
            get_risk_severity(101.0)


class TestCalculateOverallRiskScore:
    """Test overall risk score calculation"""
    
    def test_single_risk(self):
        """Test with single risk"""
        score = calculate_overall_risk_score([75.0])
        assert score == 75.0
    
    def test_multiple_equal_risks(self):
        """Test with multiple equal risks"""
        score = calculate_overall_risk_score([50.0, 50.0, 50.0])
        assert score == 50.0
    
    def test_mixed_severity_risks(self):
        """Test with mixed severity risks"""
        score = calculate_overall_risk_score([80.0, 60.0, 40.0])
        # Higher risks should have more weight
        assert 60.0 < score < 80.0
    
    def test_all_low_risks(self):
        """Test with all low severity risks"""
        score = calculate_overall_risk_score([10.0, 20.0, 30.0])
        assert score == 20.0
    
    def test_empty_risk_list(self):
        """Test with empty risk list"""
        with pytest.raises(ValueError, match="Cannot calculate overall score from empty risk list"):
            calculate_overall_risk_score([])
    
    def test_invalid_risk_score(self):
        """Test with invalid risk score in list"""
        with pytest.raises(ValueError, match="All risk scores must be between 0 and 100"):
            calculate_overall_risk_score([50.0, 150.0, 30.0])

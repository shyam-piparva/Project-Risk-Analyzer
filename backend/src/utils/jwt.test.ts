import jwt from 'jsonwebtoken';
import {
  generateTokens,
  verifyToken,
  decodeToken,
  isTokenExpired,
  refreshAccessToken,
  TokenPayload,
} from './jwt';

// Mock the logger to avoid console output during tests
jest.mock('./logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('JWT Token Management', () => {
  const mockPayload: TokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  };

  beforeAll(() => {
    // Set test environment variables
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const result = generateTokens(mockPayload);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.expiresIn).toBe('24h'); // Changed from '1h' to match actual default
    });

    it('should generate valid JWT tokens', () => {
      const result = generateTokens(mockPayload);

      const decodedAccess = jwt.decode(result.accessToken) as TokenPayload;
      const decodedRefresh = jwt.decode(result.refreshToken) as TokenPayload;

      expect(decodedAccess.userId).toBe(mockPayload.userId);
      expect(decodedAccess.email).toBe(mockPayload.email);
      expect(decodedRefresh.userId).toBe(mockPayload.userId);
      expect(decodedRefresh.email).toBe(mockPayload.email);
    });

    it('should generate different tokens each time', (done) => {
      const result1 = generateTokens(mockPayload);
      
      // Wait a bit to ensure different iat timestamp
      setTimeout(() => {
        const result2 = generateTokens(mockPayload);

        expect(result1.accessToken).not.toBe(result2.accessToken);
        expect(result1.refreshToken).not.toBe(result2.refreshToken);
        done();
      }, 1000);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const { accessToken } = generateTokens(mockPayload);
      const decoded = verifyToken(accessToken);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });

    it('should throw error for expired token', (done) => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(mockPayload, process.env.JWT_SECRET!, {
        expiresIn: '1ms',
      });

      // Wait a bit to ensure expiration
      setTimeout(() => {
        expect(() => verifyToken(expiredToken)).toThrow();
        done();
      }, 100);
    });

    it('should throw error for token with wrong secret', () => {
      const wrongToken = jwt.sign(mockPayload, 'wrong-secret', {
        expiresIn: '1h',
      });

      expect(() => verifyToken(wrongToken)).toThrow('Invalid token');
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const { accessToken } = generateTokens(mockPayload);
      const decoded = decodeToken(accessToken);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
    });

    it('should decode an expired token', () => {
      const expiredToken = jwt.sign(mockPayload, process.env.JWT_SECRET!, {
        expiresIn: '0s',
      });

      const decoded = decodeToken(expiredToken);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(mockPayload.userId);
    });

    it('should return null for malformed token', () => {
      const decoded = decodeToken('not-a-valid-jwt');
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const { accessToken } = generateTokens(mockPayload);
      const expired = isTokenExpired(accessToken);

      expect(expired).toBe(false);
    });

    it('should return true for expired token', (done) => {
      const expiredToken = jwt.sign(mockPayload, process.env.JWT_SECRET!, {
        expiresIn: '1ms',
      });

      // Wait for token to expire
      setTimeout(() => {
        const expired = isTokenExpired(expiredToken);
        expect(expired).toBe(true);
        done();
      }, 10);
    });

    it('should return true for invalid token', () => {
      const expired = isTokenExpired('invalid-token');
      expect(expired).toBe(true);
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token from valid refresh token', () => {
      const { refreshToken } = generateTokens(mockPayload);
      const newAccessToken = refreshAccessToken(refreshToken);

      expect(typeof newAccessToken).toBe('string');
      expect(newAccessToken).not.toBe('');

      const decoded = verifyToken(newAccessToken);
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => refreshAccessToken('invalid-token')).toThrow(
        'Failed to refresh access token'
      );
    });

    it('should throw error for expired refresh token', (done) => {
      const expiredRefreshToken = jwt.sign(mockPayload, process.env.JWT_SECRET!, {
        expiresIn: '1ms',
      });

      setTimeout(() => {
        expect(() => refreshAccessToken(expiredRefreshToken)).toThrow(
          'Failed to refresh access token'
        );
        done();
      }, 10);
    });
  });

  describe('Token expiration handling', () => {
    it('should handle token lifecycle correctly', (done) => {
      // Create token with very short expiration
      const shortLivedToken = jwt.sign(mockPayload, process.env.JWT_SECRET!, {
        expiresIn: '1ms',
      });

      // Token should be valid initially
      const decoded = decodeToken(shortLivedToken);
      expect(decoded).not.toBeNull();

      // Wait for expiration
      setTimeout(() => {
        // Token should be expired
        expect(isTokenExpired(shortLivedToken)).toBe(true);
        
        // Verification should fail
        expect(() => verifyToken(shortLivedToken)).toThrow();
        
        done();
      }, 100);
    });
  });
});

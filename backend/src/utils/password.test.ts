import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  PASSWORD_REQUIREMENTS,
} from './password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
    });

    it('should throw error for whitespace-only password', async () => {
      await expect(hashPassword('   ')).rejects.toThrow(
        'Password cannot be empty'
      );
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await hashPassword('TestPassword123!');
      const isMatch = await comparePassword('', hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const isMatch = await comparePassword('TestPassword123!', '');

      expect(isMatch).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const isMatch = await comparePassword('TestPassword123!', 'invalid-hash');

      expect(isMatch).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('testpassword123!', hash);

      expect(isMatch).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      const result = validatePasswordStrength('StrongPass123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than minimum length', () => {
      const result = validatePasswordStrength('Short1!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`
      );
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePasswordStrength('lowercase123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePasswordStrength('UPPERCASE123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumberPass!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('NoSpecialChar123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one special character'
      );
    });

    it('should return multiple errors for weak password', () => {
      const result = validatePasswordStrength('weak');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain(
        `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`
      );
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain(
        'Password must contain at least one special character'
      );
    });

    it('should reject empty password', () => {
      const result = validatePasswordStrength('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should accept various special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{};\':"|,.<>/?';
      
      for (const char of specialChars) {
        const password = `TestPass123${char}`;
        const result = validatePasswordStrength(password);
        
        expect(result.isValid).toBe(true);
      }
    });

    it('should validate password at minimum length boundary', () => {
      const result = validatePasswordStrength('Pass123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Integration: hash and compare workflow', () => {
    it('should successfully hash and verify a valid password', async () => {
      const password = 'MySecurePass123!';
      
      // Validate strength
      const validation = validatePasswordStrength(password);
      expect(validation.isValid).toBe(true);
      
      // Hash password
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      
      // Verify correct password
      const isCorrect = await comparePassword(password, hash);
      expect(isCorrect).toBe(true);
      
      // Verify incorrect password
      const isIncorrect = await comparePassword('WrongPassword123!', hash);
      expect(isIncorrect).toBe(false);
    });
  });
});

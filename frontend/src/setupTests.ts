import '@testing-library/jest-dom';

// Mock import.meta for Vite environment variables
jest.mock('./config/env', () => ({
  env: {
    apiUrl: 'http://localhost:3000/api',
    apiVersion: 'v1',
    isDevelopment: true,
    isProduction: false,
  },
  default: {
    apiUrl: 'http://localhost:3000/api',
    apiVersion: 'v1',
    isDevelopment: true,
    isProduction: false,
  },
}));

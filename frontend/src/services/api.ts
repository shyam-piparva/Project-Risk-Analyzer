/**
 * API service utilities
 * Provides helper functions for making API requests
 */

import axios from '../config/axios';
import { AxiosResponse } from 'axios';

/**
 * Generic API response type
 */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

/**
 * API service class
 * Provides methods for common HTTP operations
 */
class ApiService {
  /**
   * GET request
   */
  async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const response: AxiosResponse<T> = await axios.get(url, { params });
    return response.data;
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await axios.post(url, data);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await axios.put(url, data);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await axios.delete(url);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await axios.patch(url, data);
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;

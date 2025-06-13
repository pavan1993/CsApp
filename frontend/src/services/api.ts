import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import config from '../config/environment'

// Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  status: number
  code?: string
}

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        // Enhanced logging for debugging connection issues
        console.error('API Error Details:', {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          code: error.code,
          response: error.response?.data,
          isNetworkError: !error.response,
          isTimeoutError: error.code === 'ECONNABORTED',
        })

        const apiError: ApiError = {
          message: error.message || 'An unexpected error occurred',
          status: error.response?.status || 500,
          code: error.code,
        }

        // Provide more specific error messages
        if (!error.response) {
          apiError.message = `Network error: Cannot connect to backend at ${config.apiUrl}. Is the backend server running on port 3001?`
        } else if (error.response.status >= 500) {
          apiError.message = `Server error (${error.response.status}): ${error.response.statusText}`
        } else if (error.response.status === 404) {
          apiError.message = `API endpoint not found: ${error.config?.url}`
        }

        // Handle specific error cases
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }

        return Promise.reject(apiError)
      }
    )
  }

  // Generic methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<any>(url, { params })
    console.log('Raw API Response:', response.data)
    
    // Handle the backend response format: { success: true, data: T }
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success && 'data' in response.data) {
        console.log('Extracted data:', response.data.data)
        return response.data.data as T
      } else {
        throw new Error(response.data.message || 'API request failed')
      }
    }
    
    // Fallback for other response formats
    return response.data as T
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data)
    return response.data.data
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data)
    return response.data.data
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url)
    return response.data.data
  }

  // Specific API methods
  async getOrganizations(): Promise<string[]> {
    console.log('🔄 Fetching organizations from:', `${config.apiUrl}/analytics/organizations`);
    try {
      const result = await this.get('/analytics/organizations');
      console.log('✅ Organizations fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch organizations:', error);
      throw error;
    }
  }

  async testConnection(): Promise<any> {
    console.log('🔄 Testing backend connection to:', `${config.apiUrl}/analytics/test`);
    try {
      const response = await this.client.get('/analytics/test');
      console.log('✅ Backend connection test successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      throw error;
    }
  }

  async getHealthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health')
  }

  async uploadTickets(organization: string, file: File): Promise<{ message: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('organization', organization)

    const response = await this.client.post('/tickets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async uploadUsage(organization: string, file: File): Promise<{ message: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('organization', organization)

    const response = await this.client.post('/usage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async getAnalytics(organization: string, type: string, params?: any) {
    return this.get(`/analytics/${type}`, { organization, ...params })
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService

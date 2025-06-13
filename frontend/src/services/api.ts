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
        const apiError: ApiError = {
          message: error.message || 'An unexpected error occurred',
          status: error.response?.status || 500,
          code: error.code,
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
    const response = await this.client.get<ApiResponse<T>>(url, { params })
    return response.data.data
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
    return this.get('/analytics/organizations')
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

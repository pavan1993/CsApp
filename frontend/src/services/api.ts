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
      (response: AxiosResponse) => {
        console.log('✅ Successful API response:', {
          url: response.config.url,
          status: response.status,
          dataType: typeof response.data,
          hasSuccess: 'success' in (response.data || {}),
          hasData: 'data' in (response.data || {})
        });
        return response;
      },
      (error: AxiosError) => {
        // Enhanced logging for debugging connection issues
        console.error('❌ API Error Details:', {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          fullURL: `${error.config?.baseURL}${error.config?.url}`,
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
    console.log(`🔄 Making GET request to: ${config.apiUrl}${url}`, params ? `with params: ${JSON.stringify(params)}` : '');
    try {
      const response = await this.client.get<any>(url, { params })
      console.log('✅ Raw API Response:', response.data)
      
      // Handle the backend response format: { success: true, data: T }
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success && 'data' in response.data) {
          console.log('✅ Extracted data:', response.data.data)
          return response.data.data as T
        } else {
          const errorMessage = response.data.message || 'API request failed';
          console.error('❌ API request failed:', errorMessage);
          throw new Error(errorMessage);
        }
      }
      
      // Fallback for other response formats
      console.log('⚠️ Using fallback response format');
      return response.data as T
    } catch (error) {
      console.error(`❌ GET request failed for ${url}:`, error);
      throw error;
    }
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
      const result = await this.get<string[]>('/analytics/organizations');
      console.log('✅ Organizations fetched successfully:', result);
      
      // Ensure we return an array of strings
      if (Array.isArray(result)) {
        return result;
      } else {
        console.warn('⚠️ Unexpected organizations format, returning empty array:', result);
        return [];
      }
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

  async uploadTickets(file: File): Promise<{ message: string }> {
    console.log('🔄 Uploading tickets file:', file.name);
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await this.client.post('/tickets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      console.log('✅ Tickets upload response:', response.data);
      
      // Handle the backend response format: { success: true, data: T }
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success) {
          return response.data.data || response.data;
        } else {
          throw new Error(response.data.message || 'Upload failed');
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Tickets upload failed:', error);
      throw error;
    }
  }

  async uploadUsage(organization: string, file: File, force: boolean = false): Promise<{ message: string; data?: any }> {
    console.log('🔄 Uploading usage file:', file.name, 'for organization:', organization, 'force:', force);
    const formData = new FormData()
    formData.append('file', file)
    formData.append('organization', organization)

    const url = force ? '/usage/upload?force=true' : '/usage/upload';

    try {
      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      console.log('✅ Usage upload response:', response.data);
      
      // Handle the backend response format: { success: true, data: T }
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success) {
          return {
            message: response.data.message || 'Upload successful',
            data: response.data.data
          };
        } else {
          throw new Error(response.data.message || 'Upload failed');
        }
      }
      
      return {
        message: response.data.message || 'Upload successful',
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ Usage upload failed:', error);
      
      // Enhanced error handling for 409 conflicts
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        const enhancedError = new Error(errorData.message || 'Upload conflict');
        (enhancedError as any).status = 409;
        (enhancedError as any).daysSinceLastUpload = errorData.daysSinceLastUpload;
        (enhancedError as any).lastUploadDate = errorData.lastUploadDate;
        throw enhancedError;
      }
      
      throw error;
    }
  }

  async getAnalytics(organization: string, type: string, params?: any) {
    return this.get(`/analytics/${type}`, { organization, ...params })
  }

  // Configuration API methods
  async getProductAreaMappings(organization: string) {
    return this.get(`/config/mapping/${organization}`)
  }

  async createProductAreaMapping(organization: string, data: {
    productArea: string
    dynatraceCapability: string
    isKeyModule?: boolean
  }) {
    return this.post(`/config/mapping/${organization}`, data)
  }

  async updateProductAreaMapping(organization: string, id: string, data: {
    productArea?: string
    dynatraceCapability?: string
    isKeyModule?: boolean
  }) {
    return this.put(`/config/mapping/${organization}/${id}`, data)
  }

  async deleteProductAreaMapping(organization: string, id: string) {
    return this.delete(`/config/mapping/${organization}/${id}`)
  }

  async getThresholdConfigurations(organization: string) {
    return this.get(`/config/thresholds/${organization}`)
  }

  async createThresholdConfiguration(organization: string, data: {
    productArea: string
    severityLevel: string
    ticketThreshold: number
    usageDropThreshold: number
  }) {
    return this.post(`/config/thresholds/${organization}`, data)
  }

  async updateThresholdConfiguration(organization: string, id: string, data: {
    productArea?: string
    severityLevel?: string
    ticketThreshold?: number
    usageDropThreshold?: number
  }) {
    return this.put(`/config/thresholds/${organization}/${id}`, data)
  }

  async deleteThresholdConfiguration(organization: string, id: string) {
    return this.delete(`/config/thresholds/${organization}/${id}`)
  }

  async getKeyModules(organization: string) {
    return this.get(`/config/key-modules/${organization}`)
  }

  async updateKeyModuleStatus(organization: string, id: string, isKeyModule: boolean) {
    return this.put(`/config/mapping/${organization}/${id}`, { isKeyModule })
  }

  // Batch operations for configuration
  async batchUpdateProductAreaMappings(organization: string, mappings: Array<{
    id?: string
    productArea: string
    dynatraceCapability: string
    isKeyModule?: boolean
  }>) {
    return this.post(`/config/mapping/${organization}/batch`, { mappings })
  }

  async batchUpdateThresholdConfigurations(organization: string, thresholds: Array<{
    id?: string
    productArea: string
    severityLevel: string
    ticketThreshold: number
    usageDropThreshold: number
  }>) {
    return this.post(`/config/thresholds/${organization}/batch`, { thresholds })
  }

  // Import/Export configuration
  async exportConfiguration(organization: string, type: 'mappings' | 'thresholds' | 'all') {
    return this.get(`/config/export/${organization}`, { type })
  }

  async importConfiguration(organization: string, file: File, type: 'mappings' | 'thresholds') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const response = await this.client.post(`/config/import/${organization}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success) {
          return response.data.data || response.data;
        } else {
          throw new Error(response.data.message || 'Import failed');
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Configuration import failed:', error);
      throw error;
    }
  }

  // Validation methods
  async validateConfiguration(organization: string) {
    return this.get(`/config/validate/${organization}`)
  }

  async getConfigurationStatus(organization: string) {
    try {
      return await this.get(`/config/status/${organization}`)
    } catch (error) {
      // Return default status if endpoint doesn't exist yet
      console.warn('Configuration status endpoint not available, using defaults')
      return {
        mappingsCount: 0,
        thresholdsCount: 0,
        keyModulesCount: 0,
        isComplete: false
      }
    }
  }

  // Analytics API methods
  async getTicketBreakdown(organization: string, dateRange?: string) {
    return this.get(`/analytics/tickets/breakdown`, { organization, dateRange })
  }

  async getUsageCorrelation(organization: string) {
    return this.get(`/analytics/usage/correlation`, { organization })
  }

  async getTechnicalDebtAnalysis(organization: string, analysisDate?: string) {
    return this.get(`/analytics/technical-debt`, { organization, analysisDate })
  }

  async getTrendAnalysis(organization: string, productArea?: string, dateRange?: string) {
    return this.get(`/analytics/trends`, { organization, productArea, dateRange })
  }

  async getExecutiveSummary(organization: string) {
    return this.get(`/analytics/executive-summary`, { organization })
  }

  // Additional analytics endpoints
  async getTicketsByProductArea(organization: string, productArea: string, dateRange?: string) {
    return this.get(`/analytics/tickets/product-area/${productArea}`, { organization, dateRange })
  }

  async getUsageMetrics(organization: string, capability?: string, dateRange?: string) {
    return this.get(`/analytics/usage/metrics`, { organization, capability, dateRange })
  }

  async getCorrelationMatrix(organization: string) {
    return this.get(`/analytics/correlation-matrix`, { organization })
  }

  async getDebtScoreHistory(organization: string, productArea?: string, dateRange?: string) {
    return this.get(`/analytics/debt-score/history`, { organization, productArea, dateRange })
  }

  async getRecommendations(organization: string, priority?: string) {
    return this.get(`/analytics/recommendations`, { organization, priority })
  }

  // Usage data methods
  async getUsageData(organization: string) {
    console.log('🔄 Fetching usage data for organization:', organization);
    try {
      const result = await this.get(`/usage/${organization}`);
      console.log('✅ Usage data fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch usage data:', error);
      throw error;
    }
  }

  async checkUsageUploadEligibility(organization: string) {
    console.log('🔄 Checking usage upload eligibility for organization:', organization);
    try {
      const result = await this.get(`/usage/check-upload-eligibility/${organization}`);
      console.log('✅ Upload eligibility check result:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to check upload eligibility:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService

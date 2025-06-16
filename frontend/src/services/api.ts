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
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()

  constructor() {
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
    this.setupCacheCleanup()
  }

  private setupCacheCleanup() {
    // Clean expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  }

  private getCacheKey(url: string, params?: any): string {
    return `${url}${params ? `?${JSON.stringify(params)}` : ''}`
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key)
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  public clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
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

  // Generic methods with caching
  async get<T>(url: string, params?: any, options?: { cache?: boolean; ttl?: number }): Promise<T> {
    const cacheKey = this.getCacheKey(url, params)
    const useCache = options?.cache !== false
    
    // Check cache first
    if (useCache) {
      const cachedData = this.getFromCache(cacheKey)
      if (cachedData) {
        console.log(`✅ Cache hit for: ${url}`)
        return cachedData
      }
    }

    console.log(`🔄 Making GET request to: ${config.apiUrl}${url}`, params ? `with params: ${JSON.stringify(params)}` : '');
    try {
      const response = await this.client.get<any>(url, { params })
      console.log('✅ Raw API Response:', response.data)
      
      let result: T
      
      // Handle the backend response format: { success: true, data: T }
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success && 'data' in response.data) {
          console.log('✅ Extracted data:', response.data.data)
          result = response.data.data as T
        } else {
          const errorMessage = response.data.message || 'API request failed';
          console.error('❌ API request failed:', errorMessage);
          throw new Error(errorMessage);
        }
      } else {
        // Fallback for other response formats
        console.log('⚠️ Using fallback response format');
        result = response.data as T
      }

      // Cache the result
      if (useCache) {
        this.setCache(cacheKey, result, options?.ttl)
      }

      return result
    } catch (error) {
      console.error(`❌ GET request failed for ${url}:`, error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any): Promise<T> {
    // Clear related cache entries
    this.clearCache(url.split('/')[1])
    
    const response = await this.client.post<ApiResponse<T>>(url, data)
    return response.data.data
  }

  async put<T>(url: string, data?: any): Promise<T> {
    // Clear related cache entries
    this.clearCache(url.split('/')[1])
    
    const response = await this.client.put<ApiResponse<T>>(url, data)
    return response.data.data
  }

  async delete<T>(url: string): Promise<T> {
    // Clear related cache entries
    this.clearCache(url.split('/')[1])
    
    const response = await this.client.delete<ApiResponse<T>>(url)
    return response.data.data
  }

  // Optimistic update helper
  async optimisticUpdate<T>(
    cacheKey: string,
    updateFn: (current: T) => T,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const currentData = this.getFromCache(cacheKey)
    
    if (currentData) {
      // Apply optimistic update
      const optimisticData = updateFn(currentData)
      this.setCache(cacheKey, optimisticData, 60000) // Short TTL for optimistic data
      
      try {
        // Make actual API call
        const result = await apiCall()
        // Update cache with real data
        this.setCache(cacheKey, result)
        return result
      } catch (error) {
        // Revert optimistic update on error
        this.setCache(cacheKey, currentData)
        throw error
      }
    } else {
      // No cached data, just make the API call
      return await apiCall()
    }
  }

  // Specific API methods
  async getOrganizations(): Promise<string[]> {
    console.log('🔄 Fetching organizations from:', `${config.apiUrl}/analytics/organizations`);
    try {
      const result = await this.get<string[]>('/analytics/organizations', undefined, { cache: true, ttl: 600000 }); // Cache for 10 minutes
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
    return this.get(`/analytics/${type}`, { organization, ...params }, { cache: true, ttl: 180000 }) // Cache for 3 minutes
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

  // Customer management methods
  async getCustomers() {
    console.log('🔄 Fetching customers');
    try {
      const result = await this.get('/customers');
      console.log('✅ Customers fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch customers:', error);
      throw error;
    }
  }

  async createCustomer(customerData: any) {
    console.log('🔄 Creating customer:', customerData);
    try {
      const result = await this.post('/customers', customerData);
      console.log('✅ Customer created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to create customer:', error);
      throw error;
    }
  }

  async deleteCustomer(customerId: string) {
    console.log('🔄 Deleting customer:', customerId);
    try {
      const result = await this.delete(`/customers/${customerId}`);
      console.log('✅ Customer deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to delete customer:', error);
      throw error;
    }
  }

  // Analytics data methods
  async getAnalyticsData(organization: string) {
    console.log('🔄 Fetching analytics data for organization:', organization);
    try {
      // Use existing analytics endpoints to build comprehensive data
      const [executiveSummary, technicalDebt, ticketBreakdown] = await Promise.all([
        this.getExecutiveSummary(organization).catch(() => null),
        this.getTechnicalDebtAnalysis(organization).catch(() => null),
        this.getTicketBreakdown(organization).catch(() => null)
      ]);
      
      const result = {
        summary: executiveSummary,
        technicalDebt,
        ticketBreakdown,
        organization
      };
      
      console.log('✅ Analytics data fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch analytics data:', error);
      throw error;
    }
  }

  // Dashboard summary method
  async getDashboardSummary(organization: string) {
    console.log('🔄 Fetching dashboard summary for organization:', organization);
    try {
      // Use existing analytics endpoints to build dashboard summary
      const [ticketBreakdown, technicalDebt, executiveSummary] = await Promise.all([
        this.getTicketBreakdown(organization).catch(() => null),
        this.getTechnicalDebtAnalysis(organization).catch(() => null),
        this.getExecutiveSummary(organization).catch(() => null)
      ]);
      
      // Calculate summary metrics from the data
      let totalProductAreas = 0;
      let totalTickets = 0;
      let criticalTickets = 0;
      let averageTechnicalDebtScore = 0;
      let highRiskAreas = 0;
      
      // Extract data from ticket breakdown
      if (ticketBreakdown && typeof ticketBreakdown === 'object' && 'breakdown' in ticketBreakdown) {
        const breakdown = (ticketBreakdown as any).breakdown;
        if (Array.isArray(breakdown)) {
          totalProductAreas = breakdown.length;
          breakdown.forEach((item: any) => {
            if (item.severityCounts) {
              totalTickets += Object.values(item.severityCounts).reduce((a: any, b: any) => a + b, 0);
              criticalTickets += item.severityCounts.CRITICAL || 0;
            }
          });
        }
      }
      
      // Extract data from technical debt analysis
      if (technicalDebt && Array.isArray(technicalDebt)) {
        const scores = technicalDebt.map((item: any) => item.debtScore || 0);
        averageTechnicalDebtScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        highRiskAreas = technicalDebt.filter((item: any) => 
          item.category === 'High Risk' || item.category === 'Critical'
        ).length;
      }
      
      // Use executive summary if available
      if (executiveSummary && typeof executiveSummary === 'object') {
        const summary = executiveSummary as any;
        totalProductAreas = summary.totalProductAreas || totalProductAreas;
        totalTickets = summary.totalTickets || totalTickets;
        criticalTickets = summary.criticalIssues || criticalTickets;
        averageTechnicalDebtScore = summary.technicalDebtScore || averageTechnicalDebtScore;
      }
      
      const result = {
        totalProductAreas,
        totalTickets,
        criticalTickets,
        averageTechnicalDebtScore,
        highRiskAreas
      };
      
      console.log('✅ Dashboard summary calculated:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch dashboard summary:', error);
      throw error;
    }
  }

  async getExecutiveSummary(organization: string) {
    console.log('🔄 Fetching executive summary for organization:', organization);
    try {
      const result = await this.get(`/analytics/executive-summary`, { organization });
      console.log('✅ Executive summary data:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching executive summary:', error);
      throw error;
    }
  }

  async getTicketBreakdown(organization: string, startDate?: Date, endDate?: Date) {
    console.log('🔄 Fetching ticket breakdown for organization:', organization);
    try {
      const params: any = { organization };
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const result = await this.get(`/analytics/tickets/breakdown`, params);
      console.log('✅ Ticket breakdown data:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching ticket breakdown:', error);
      throw error;
    }
  }

  async getTechnicalDebtAnalysis(organization: string, productArea?: string) {
    console.log('🔄 Fetching technical debt analysis for organization:', organization);
    try {
      const params: any = { organization };
      if (productArea) params.productArea = productArea;

      const result = await this.get(`/analytics/technical-debt`, params);
      console.log('✅ Technical debt data:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching technical debt analysis:', error);
      throw error;
    }
  }

  async getUsageCorrelation(organization: string) {
    console.log('🔄 Fetching usage correlation for organization:', organization);
    try {
      const result = await this.get(`/analytics/usage-correlation/${encodeURIComponent(organization)}`);
      console.log('✅ Usage correlation data:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching usage correlation:', error);
      throw error;
    }
  }

  async getTrendAnalysis(organization: string, months: number = 6) {
    console.log('🔄 Fetching trend analysis for organization:', organization);
    try {
      const result = await this.get(`/analytics/trends/${encodeURIComponent(organization)}`, { months });
      console.log('✅ Trend analysis data:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching trend analysis:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService

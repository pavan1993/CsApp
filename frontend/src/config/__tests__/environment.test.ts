import { describe, it, expect, vi, beforeEach } from 'vitest'
import config, { validateEnvironment } from '../environment'

describe('Environment Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides default configuration values', () => {
    expect(config.apiUrl).toBe('http://localhost:5000')
    expect(config.apiTimeout).toBe(10000)
    expect(config.appName).toBe('Customer Success Analytics')
    expect(config.defaultOrganization).toBe('')
  })

  it('has feature flags', () => {
    expect(config.features.enableAnalytics).toBe(true)
    expect(config.features.enableTechnicalDebt).toBe(true)
    expect(config.features.enableUsageCorrelation).toBe(true)
  })

  it('validates environment variables', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Mock missing environment variable
    vi.stubGlobal('import.meta', {
      env: {}
    })
    
    validateEnvironment()
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing environment variables: VITE_API_URL')
    )
    
    consoleSpy.mockRestore()
  })

  it('handles development and production flags', () => {
    expect(typeof config.isDevelopment).toBe('boolean')
    expect(typeof config.isProduction).toBe('boolean')
  })
})

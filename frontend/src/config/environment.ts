// Environment configuration for the frontend application
export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Customer Success Analytics',
  defaultOrganization: import.meta.env.VITE_DEFAULT_ORGANIZATION || '',
  
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Feature flags (can be expanded later)
  features: {
    enableAnalytics: true,
    enableTechnicalDebt: true,
    enableUsageCorrelation: true,
  },
} as const

// Validation function to ensure required environment variables are set
export function validateEnvironment(): void {
  const requiredVars = [
    'VITE_API_URL',
  ]
  
  const missingVars = requiredVars.filter(
    varName => !import.meta.env[varName]
  )
  
  if (missingVars.length > 0) {
    console.warn(
      `Missing environment variables: ${missingVars.join(', ')}\n` +
      'Using default values. Consider creating a .env file.'
    )
  }
}

// Call validation on import
validateEnvironment()

// Log the configuration for debugging
console.log('Frontend API Configuration:', {
  apiUrl: config.apiUrl,
  apiTimeout: config.apiTimeout,
  isDevelopment: config.isDevelopment,
  isProduction: config.isProduction
})

export default config

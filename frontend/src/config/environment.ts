// Environment configuration for the frontend application
export const config = {
  // API Configuration
  apiUrl: (() => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && !envUrl.includes(':5000')) {
      // If VITE_API_URL is set and not pointing to port 5000, use it
      return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
    }
    // Always use port 3001 as default or if env points to wrong port
    return 'http://localhost:3001/api';
  })(),
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
  isProduction: config.isProduction,
  currentOrigin: window.location.origin,
  expectedBackendPort: 3001,
  actualConfiguredUrl: config.apiUrl,
  env: import.meta.env
})

// Warn if configuration seems wrong
if (config.apiUrl.includes(':5000')) {
  console.warn('⚠️ WARNING: Frontend is configured to connect to port 5000, but backend runs on port 3001!')
  console.warn('⚠️ Please check your .env file or environment variables')
  console.warn('⚠️ To fix this, either:')
  console.warn('⚠️   1. Remove VITE_API_URL from your environment')
  console.warn('⚠️   2. Set VITE_API_URL=http://localhost:3001/api')
}

// Log final configuration
console.log('✅ Frontend will connect to:', config.apiUrl)

export default config

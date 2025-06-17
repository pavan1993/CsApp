// Environment configuration for the frontend application
export const config = {
  // API Configuration
  apiUrl: (() => {
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl) {
      // If VITE_API_URL is set, use it but warn if it's port 3001
      const finalUrl = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
      if (finalUrl.includes(':3001')) {
        console.warn('⚠️ WARNING: VITE_API_URL is set to port 3001, but backend runs on port 5000!');
        console.warn('⚠️ This will likely cause connection errors.');
        console.warn('⚠️ Please update your .env file to use: VITE_API_URL=http://localhost:5000');
      }
      return finalUrl;
    }
    // Use port 5000 as default to match backend
    return 'http://localhost:5000/api';
  })(),
  apiTimeout: parseInt((import.meta as any).env?.VITE_API_TIMEOUT || '10000'),
  
  // App Configuration
  appName: (import.meta as any).env?.VITE_APP_NAME || 'Customer Success Analytics',
  defaultOrganization: (import.meta as any).env?.VITE_DEFAULT_ORGANIZATION || '',
  
  // Environment
  isDevelopment: (import.meta as any).env?.DEV || false,
  isProduction: (import.meta as any).env?.PROD || false,
  
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
    varName => !(import.meta as any).env?.[varName]
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
  expectedBackendPort: 5000,
  actualConfiguredUrl: config.apiUrl,
  env: (import.meta as any).env || {}
})

// Warn if configuration seems wrong
if (config.apiUrl.includes(':3001')) {
  console.warn('⚠️ WARNING: Frontend is configured to connect to port 3001, but backend runs on port 5000!')
  console.warn('⚠️ Please check your .env file or environment variables')
  console.warn('⚠️ To fix this, either:')
  console.warn('⚠️   1. Remove VITE_API_URL from your environment')
  console.warn('⚠️   2. Set VITE_API_URL=http://localhost:5000/api')
}

// Log final configuration
console.log('✅ Frontend will connect to:', config.apiUrl)

export default config

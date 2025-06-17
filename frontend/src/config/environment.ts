// Environment configuration for the frontend application
export const config = {
  // API Configuration
  apiUrl: (() => {
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl) {
      // If VITE_API_URL is set, use it
      const finalUrl = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
      return finalUrl;
    }
    
    // Check if we're running in a browser and can detect the current host
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      // For localhost development, use direct backend port
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
      }
      
      // For public IP or domain, use the proxy path (assumes reverse proxy setup)
      // If no reverse proxy, backend should be accessible on same host:5000
      return `${protocol}//${hostname}:5000/api`;
    }
    
    // Fallback for server-side rendering or build time
    return '/api';
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
  hostname: window.location.hostname,
  isLocalhost: window.location.hostname === 'localhost',
  env: (import.meta as any).env || {}
})

// Log final configuration
console.log('✅ Frontend will connect to:', config.apiUrl)

export default config

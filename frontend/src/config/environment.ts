// Environment configuration for the frontend application
export const config = {
  // API Configuration
  apiUrl: (() => {
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl) {
      // If VITE_API_URL is set, use it
      const finalUrl = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
      console.log('🔧 Using VITE_API_URL:', finalUrl);
      return finalUrl;
    }
    
    // Check if we're running in a browser and can detect the current host
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port;
      
      console.log('🌐 Detected hostname:', hostname, 'protocol:', protocol, 'port:', port);
      
      // For localhost development, use direct backend port
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const apiUrl = 'http://localhost:5000/api';
        console.log('🏠 Using localhost backend:', apiUrl);
        return apiUrl;
      }
      
      // For public IP or domain, connect directly to backend port 5000
      // This assumes the backend is running on the same host on port 5000
      const apiUrl = `${protocol}//${hostname}:5000/api`;
      console.log('🌍 Using public IP backend:', apiUrl);
      return apiUrl;
    }
    
    // Fallback for server-side rendering or build time
    console.log('⚠️ Using fallback API URL: /api');
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

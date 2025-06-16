import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple validation without zod for now
const validateEnv = () => {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
  
  // Validate JWT secret length
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  if (jwtSecret.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters for security');
  }
};

// Validate on import
validateEnv();

export const config = {
  // Node environment
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Server configuration
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || 'localhost',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your-secret-key',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFormat: process.env.LOG_FORMAT || 'combined',
  
  // File upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  
  // Health check
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
  
  // Database connection pool
  dbPoolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
  dbPoolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
  dbPoolIdleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
  dbPoolAcquireTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000', 10),
  
  // Redis (optional)
  redisUrl: process.env.REDIS_URL,
  redisPassword: process.env.REDIS_PASSWORD,
  
  // Monitoring (optional)
  sentryDsn: process.env.SENTRY_DSN,
  newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
  
  // SSL/TLS (optional)
  sslCertPath: process.env.SSL_CERT_PATH,
  sslKeyPath: process.env.SSL_KEY_PATH,
} as const;

// Derived configuration
export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';

// Database URL with connection pooling for production
export const databaseUrl = isProduction
  ? `${config.databaseUrl}?connection_limit=${config.dbPoolMax}&pool_timeout=${Math.floor(config.dbPoolAcquireTimeout / 1000)}&socket_timeout=60`
  : config.databaseUrl;

// CORS origins array
export const corsOrigins = config.corsOrigin.split(',').map(origin => origin.trim());

// Log configuration
export const logConfig = {
  level: config.logLevel,
  format: config.logFormat,
  silent: isTest,
};

// Security configuration
export const securityConfig = {
  bcryptRounds: config.bcryptRounds,
  jwtSecret: config.jwtSecret,
  jwtExpiresIn: config.jwtExpiresIn,
  sessionSecret: config.sessionSecret,
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: config.rateLimitWindowMs,
  maxRequests: config.rateLimitMax,
};

// File upload configuration
export const uploadConfig = {
  maxFileSize: config.maxFileSize,
  uploadPath: config.uploadPath,
  allowedMimeTypes: [
    'text/csv',
    'application/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

// Health check configuration
export const healthConfig = {
  interval: config.healthCheckInterval,
  timeout: 5000,
  retries: 3,
};

// Redis configuration
export const redisConfig = config.redisUrl
  ? {
      url: config.redisUrl,
      password: config.redisPassword,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    }
  : null;

// SSL configuration
export const sslConfig = config.sslCertPath && config.sslKeyPath
  ? {
      cert: config.sslCertPath,
      key: config.sslKeyPath,
    }
  : null;

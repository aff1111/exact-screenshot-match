/**
 * Environment Configuration
 * Central place for all environment-based configuration
 */

interface EnvConfig {
  // API
  supabaseUrl: string;
  supabaseAnonKey: string;

  // Environment
  isDevelopment: boolean;
  isProduction: boolean;
  isTesting: boolean;

  // Features
  enableDebug: boolean;
  enableAnalytics: boolean;
  enableSwagger: boolean;

  // Limits
  maxUploadSize: number;
}

const getEnvConfig = (): EnvConfig => {
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;

  return {
    // API
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',

    // Environment
    isDevelopment: isDev,
    isProduction: isProd,
    isTesting: import.meta.env.VITEST === 'true',

    // Features
    enableDebug: isDev,
    enableAnalytics: isProd,
    enableSwagger: isDev,

    // Limits
    maxUploadSize: 10 * 1024 * 1024, // 10MB
  };
};

export const config = getEnvConfig();

/**
 * Validate required environment variables
 */
export const validateEnv = (): boolean => {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    return false;
  }

  return true;
};

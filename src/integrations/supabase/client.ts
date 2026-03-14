/**
 * Supabase Client Configuration
 * Configured with environment variables from .env.local
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { Logger } from '@/lib/errors';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL) {
  Logger.error('Missing VITE_SUPABASE_URL in environment variables');
  throw new Error('VITE_SUPABASE_URL is not defined');
}

if (!SUPABASE_ANON_KEY) {
  Logger.error('Missing VITE_SUPABASE_ANON_KEY in environment variables');
  throw new Error('VITE_SUPABASE_ANON_KEY is not defined');
}

/**
 * Initialize Supabase client with optimal configuration
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'maktoob@1.0.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Log successful connection in development
if (import.meta.env.DEV) {
  Logger.info('✅ Supabase client initialized', {
    url: SUPABASE_URL,
    apiKey: SUPABASE_ANON_KEY.substring(0, 20) + '...',
  });
}

// Export for easy import
// Usage: import { supabase } from "@/integrations/supabase/client";
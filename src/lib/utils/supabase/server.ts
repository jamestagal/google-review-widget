import { createServerClient as createClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';
import type { CookieOptions } from '@sveltejs/kit';

// Import environment variables with fallbacks for build process
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'https://umhukfsrqqmxvpohxgyb.supabase.co';
const SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtaHVrZnNycXFteHZwb2h4Z3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI5NjA1MDQsImV4cCI6MjAyODUzNjUwNH0.npXIGDvOWYLKneNMGpAl93WvQFVfLMTjIEOjALk9vZA';

// Log during build to help debug
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key:', SUPABASE_ANON_KEY ? 'Defined' : 'Undefined');

/**
 * Creates a Supabase client for server-side use with proper cookie management
 * @param cookies - Cookies object from the request event
 * @returns Supabase client instance
 */
export function createServerClient(cookies: Cookies) {
  console.log('Supabase client initialized');
  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key: string) => cookies.get(key),
        set: (key: string, value: string, options: CookieOptions) => {
          cookies.set(key, value, { ...options, path: '/' });
        },
        remove: (key: string, options: CookieOptions) => {
          cookies.delete(key, { ...options, path: '/' });
        },
      },
    }
  );
}

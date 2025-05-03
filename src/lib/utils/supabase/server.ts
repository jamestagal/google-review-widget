import { createServerClient as createClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';
import type { CookieOptions } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Log during build to help debug
console.log('Supabase URL from env:', PUBLIC_SUPABASE_URL);
console.log('Supabase Key exists:', !!PUBLIC_SUPABASE_ANON_KEY);

/**
 * Creates a Supabase client for server-side use with proper cookie management
 * @param cookies - Cookies object from the request event
 * @returns Supabase client instance
 */
export function createServerClient(cookies: Cookies) {
  console.log('Supabase client initialized');
  return createClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
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

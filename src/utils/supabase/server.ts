import { createServerClient as createClient } from '@supabase/ssr';
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';
import type { Cookies } from '@sveltejs/kit';
import type { CookieOptions } from '@sveltejs/kit';

/**
 * Creates a Supabase client for server-side use with proper cookie management
 * @param cookies - Cookies object from the request event
 * @returns Supabase client instance
 */
export function createServerClient(cookies: Cookies) {
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

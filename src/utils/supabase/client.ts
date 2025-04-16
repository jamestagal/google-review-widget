import { createBrowserClient as createClient } from '@supabase/ssr';
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';

/**
 * Creates a Supabase client for client-side (browser) use
 * This should be used in client components where server-side authentication isn't available
 * @returns Supabase client instance for the browser
 */
export function createBrowserClient() {
  return createClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY
  );
}

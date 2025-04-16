// Supabase client for server-side usage
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE } from '$env/static/private';

// Log environment variables for debugging
console.log('Supabase URL:', PUBLIC_SUPABASE_URL ? 'Defined' : 'Undefined');
console.log('Supabase Key:', PRIVATE_SUPABASE_SERVICE_ROLE ? 'Defined' : 'Undefined');

// Create a Supabase client with the service role key for server operations
export const supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PRIVATE_SUPABASE_SERVICE_ROLE,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Export a function to get a supabase service role client
// This follows the recommended pattern for server operations
export function getSupabaseAdmin() {
    return supabase;
}

console.log('Supabase client initialized');
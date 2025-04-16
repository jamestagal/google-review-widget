import type { PageLoad } from './$types';
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const load: PageLoad = async ({ parent, depends }) => {
    // Get parent data which might include user info and other data
    const parentData = await parent();
    
    // Create a supabase browser client
    const supabase = createBrowserClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Mark this data as dependent on auth changes
    depends('supabase:auth');
    
    return {
        ...parentData,
        supabase
    };
};

// Disable server-side rendering for this page
export const ssr = false;
export const csr = true;
import { redirect } from '@sveltejs/kit';
import { createServerClient } from '$lib/utils/supabase/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
    // Create server client
    const supabase = createServerClient(cookies);
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // Redirect if not authenticated
    if (!user) {
        throw redirect(303, '/login');
    }
    
    // Get API keys if available
    const { data: apiKeys } = await supabase
        .from('widget_api_keys')
        .select('api_key')
        .limit(1);
    
    return {
        user: {
            id: user.id,
            email: user.email
        },
        apiKey: apiKeys && apiKeys.length > 0 ? apiKeys[0].api_key : null
    };
};

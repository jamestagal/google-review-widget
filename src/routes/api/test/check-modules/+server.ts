import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PRIVATE_SUPABASE_SERVICE_ROLE } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public'; // Fixed import path for public variable

export const GET: RequestHandler = async () => {
    console.log('Checking environment variables:', {
        PUBLIC_SUPABASE_URL: typeof PUBLIC_SUPABASE_URL === 'string' ? PUBLIC_SUPABASE_URL.slice(0, 10) + '...' : undefined,
        PRIVATE_SUPABASE_SERVICE_ROLE: typeof PRIVATE_SUPABASE_SERVICE_ROLE === 'string' ? 'defined (length: ' + PRIVATE_SUPABASE_SERVICE_ROLE.length + ')' : undefined
    });
    
    const modules = {
        'Environment Variables': { 
            success: !!(PUBLIC_SUPABASE_URL && PRIVATE_SUPABASE_SERVICE_ROLE), 
            error: null,
            details: {
                PUBLIC_SUPABASE_URL: !!PUBLIC_SUPABASE_URL,
                PRIVATE_SUPABASE_SERVICE_ROLE: !!PRIVATE_SUPABASE_SERVICE_ROLE
            }
        }
    };
    
    // Test loading widget-creation module
    try {
        const widgetCreation = await import('$lib/services/widget-creation');
        modules['widget-creation'] = { 
            success: true, 
            error: null,
            exports: Object.keys(widgetCreation)
        };
    } catch (error) {
        modules['widget-creation'] = { 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
    
    // Test loading database-admin module
    try {
        const databaseAdmin = await import('$lib/server/database-admin');
        modules['database-admin'] = { 
            success: true, 
            error: null,
            exports: Object.keys(databaseAdmin)
        };
    } catch (error) {
        modules['database-admin'] = { 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
    
    return json({
        success: Object.values(modules).every(m => m.success),
        modules
    });
};
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PRIVATE_SUPABASE_SERVICE_ROLE } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const GET: RequestHandler = async ({ locals }) => {
    // Use ServiceRole client to bypass RLS
    // @ts-expect-error - Supabase typing complexity - runtime validated
    const supabase = locals.supabaseServiceRole;
    
    if (!supabase) {
        return json({
            success: false,
            error: 'Service role client not available'
        }, { status: 500 });
    }
    
    // Extended environment variable debugging
    console.log('Environment variable check:');
    console.log('PUBLIC_SUPABASE_URL:', typeof PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_URL ? PUBLIC_SUPABASE_URL.substring(0, 10) + '...' : 'undefined');
    console.log('PRIVATE_SUPABASE_SERVICE_ROLE:', typeof PRIVATE_SUPABASE_SERVICE_ROLE, PRIVATE_SUPABASE_SERVICE_ROLE ? PRIVATE_SUPABASE_SERVICE_ROLE.substring(0, 10) + '...' : 'undefined');
    console.log('Service Role Client:', locals.supabaseServiceRole ? 'Defined' : 'Undefined');
    
    // Check environment variables for response
    const envVars = {
        PUBLIC_SUPABASE_URL: PUBLIC_SUPABASE_URL ? 'defined' : undefined,
        PRIVATE_SUPABASE_SERVICE_ROLE: PRIVATE_SUPABASE_SERVICE_ROLE ? 
            'defined (length: ' + PRIVATE_SUPABASE_SERVICE_ROLE.length + ')' : undefined
    };
    
    try {
        // Type-safe approach to check table existence
        // We avoid direct table access with dynamic names to prevent type errors
        // Instead use a dedicated method for each table
        const checkBusinessProfiles = async () => {
            try {
                // @ts-expect-error - This is a test endpoint and typing can't match all tables
                const result = await supabase.from('business_profiles').select('id').limit(0);
                return { exists: !result.error, error: result.error };
            } catch (err) {
                return { exists: false, error: err };
            }
        };
        
        const checkWidgetProjects = async () => {
            try {
                // @ts-expect-error - This is a test endpoint and typing can't match all tables
                const result = await supabase.from('widget_projects').select('id').limit(0);
                return { exists: !result.error, error: result.error };
            } catch (err) {
                return { exists: false, error: err };
            }
        };
        
        const checkWidgetApiKeys = async () => {
            try {
                // @ts-expect-error - This is a test endpoint and typing can't match all tables
                const result = await supabase.from('widget_api_keys').select('api_key').limit(0);
                return { exists: !result.error, error: result.error };
            } catch (err) {
                return { exists: false, error: err };
            }
        };
        
        // Check each table using our type-safe functions
        const businessProfilesCheck = await checkBusinessProfiles();
        const widgetProjectsCheck = await checkWidgetProjects();
        const widgetApiKeysCheck = await checkWidgetApiKeys();
        
        // Get schema details as sample for each table that exists
        let widgetProjectDetails = null;
        let apiKeyDetails = null;
        let businessProfileDetails = null;
        
        if (widgetProjectsCheck.exists) {
            try {
                // Use type assertion to handle the custom tables
                const { data: sampleProject } = await supabase
                    .from('widget_projects' as any)
                    .select('*')
                    .limit(1)
                    .maybeSingle();
                widgetProjectDetails = sampleProject;
            } catch (err) {
                console.error('Error getting widget project sample:', err);
            }
        }
        
        if (widgetApiKeysCheck.exists) {
            try {
                // Use type assertion to handle the custom tables
                const { data: sampleApiKey } = await supabase
                    .from('widget_api_keys' as any)
                    .select('*')
                    .limit(1)
                    .maybeSingle();
                apiKeyDetails = sampleApiKey;
            } catch (err) {
                console.error('Error getting API key sample:', err);
            }
        }
        
        if (businessProfilesCheck.exists) {
            try {
                // Use type assertion to handle the custom tables
                const { data: sampleProfile } = await supabase
                    .from('business_profiles' as any)
                    .select('*')
                    .limit(1)
                    .maybeSingle();
                businessProfileDetails = sampleProfile;
            } catch (err) {
                console.error('Error getting business profile sample:', err);
            }
        }
        
        // Authentication check
        const authCheck = await checkAuth(locals);
        
        // Return the simple schema check response
        return json({
            success: true,
            method: 'direct_table_check',
            schema_check: {
                has_business_profiles: businessProfilesCheck.exists,
                has_widget_projects: widgetProjectsCheck.exists,
                has_widget_api_keys: widgetApiKeysCheck.exists,
            },
            tables_status: {
                business_profiles: { exists: businessProfilesCheck.exists, error: businessProfilesCheck.error },
                widget_projects: { exists: widgetProjectsCheck.exists, error: widgetProjectsCheck.error },
                widget_api_keys: { exists: widgetApiKeysCheck.exists, error: widgetApiKeysCheck.error },
            },
            samples: {
                widget_project: widgetProjectDetails,
                api_key: apiKeyDetails,
                business_profile: businessProfileDetails
            },
            auth: authCheck,
            env_variables: envVars
        });
    } catch (error) {
        console.error('Error checking database schema:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error checking database schema'
        }, { status: 500 });
    }
};

// Helper function to check authentication state
async function checkAuth(locals: any) {
    try {
        // Use the safe authentication method if available
        if (locals.safeGetSession) {
            // This is the secure method that uses getUser() internally
            const { session, user } = await locals.safeGetSession();
            return {
                hasSession: !!session,
                hasUser: !!user,
                userInfo: user ? { id: user.id, email: user.email } : null
            };
        }
        
        // Fall back to direct user check
        return {
            hasSession: false,
            hasUser: !!locals.user,
            userInfo: locals.user ? { id: locals.user.id, email: locals.user.email } : null
        };
    } catch (err) {
        console.error('Auth check error:', err);
        return {
            hasSession: false,
            hasUser: false,
            error: err instanceof Error ? err.message : String(err)
        };
    }
}

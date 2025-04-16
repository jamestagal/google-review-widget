import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/database';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE } from '$env/static/private';

// Check database tables and RLS policies
export const GET: RequestHandler = async ({ locals, cookies }) => {
    console.log('Database check - Auth info:', {
        // Use locals.user which is verified via getUser() instead of locals.session
        hasUser: !!locals.user,
        userId: locals.user?.id,
        cookies: Object.fromEntries(cookies.getAll().map(c => [c.name, 'present']))
    });
    
    try {
        // Instead of querying information_schema directly (which fails), 
        // we'll check each table individually by attempting to query it
        
        // First define helper function to check table existence
        const checkTableExists = async (tableName) => {
            try {
                // We just need to check if we can query the table - limit 0 means no data returned
                // @ts-expect-error - This is a test endpoint, typing is secondary
                const { error } = await supabase.from(tableName).select('id').limit(0);
                return !error; // If no error, table exists
            } catch {
                return false;
            }
        };
        
        // Check each table for existence
        const tableStatus = {
            business_profiles: await checkTableExists('business_profiles'),
            widget_api_keys: await checkTableExists('widget_api_keys'),
            widget_projects: await checkTableExists('widget_projects'),
        };
        
        // Check for data in tables
        const tablesWithData = {};
        
        for (const tableName of Object.keys(tableStatus)) {
            if (tableStatus[tableName]) {
                const { data: records, error } = await supabase
                    .from(tableName)
                    .select('id')
                    .limit(1);
                
                if (!error) {
                    tablesWithData[tableName] = records.length > 0;
                } else {
                    tablesWithData[tableName] = 'Error checking';
                }
            } else {
                tablesWithData[tableName] = false;
            }
        }
        
        return json({
            success: true,
            tables: tableStatus,
            tablesWithData,
            environment: {
                supabaseUrl: PUBLIC_SUPABASE_URL ? 'defined' : 'undefined',
                serviceRole: PRIVATE_SUPABASE_SERVICE_ROLE ? 'defined' : 'undefined'
            },
            message: 'Database check completed'
        });
    } catch (error) {
        console.error('Database check error:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown database error'
        }, { status: 500 });
    }
};
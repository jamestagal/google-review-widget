import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/database';

// Helper to get the current user ID securely
const getUserId = async (locals: App.Locals): Promise<string> => {
    try {
        // Always use getUser() for security rather than session.user
        // This ensures the JWT is verified with the Supabase Auth server
        const { data: { user } } = await locals.supabase.auth.getUser();
        
        if (!user) {
            throw new Error('Not authenticated');
        }
        
        return user.id;
    } catch (error) {
        console.error('Authentication error:', error);
        throw new Error('Authentication failed');
    }
};

// Generic error handler
const handleSupabaseError = (error: any) => {
    console.error('Supabase error:', error);
    // Extract the PostgreSQL error message if available
    let errorMessage = 'Database operation failed';
    
    if (error.message) {
        errorMessage = error.message;
    }
    
    if (error.details) {
        errorMessage += `: ${error.details}`;
    }
    
    if (error.hint) {
        errorMessage += ` (Hint: ${error.hint})`;
    }
    
    return errorMessage;
};

// Simple health check endpoint
export const GET: RequestHandler = async ({ locals }) => {
    try {
        const userId = await getUserId(locals);
        
        // Test database connection
        const { data, error: dbError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('id', userId)
            .single();
            
        if (dbError) {
            throw dbError;
        }
        
        return json({
            success: true,
            message: 'API endpoints are working',
            user: {
                id: userId,
                email: data?.email || 'unknown'
            }
        });
    } catch (error) {
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};
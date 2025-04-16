import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/database';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const body = await request.json();
        
        // Get user ID from request body or session
        // Use the verified user object from locals (populated via getUser() in hooks.server.ts)
        const userId = body.userId || locals.user?.id;
        
        if (!userId) {
            return json({
                success: false,
                error: 'Not authenticated - No user ID provided'
            }, { status: 401 });
        }
        
        console.log('Creating business profile for user:', userId);
        
        // Use Supabase client directly instead of fetch
        const { data, error } = await supabase
            .from('business_profiles')
            .insert({
                user_id: userId,
                google_place_id: body.googlePlaceId,
                business_name: body.businessName,
                business_address: body.businessAddress || null
            })
            .select('id')
            .single();
            
        if (error) {
            // Format error message for better debugging
            let errorMessage = error.message;
            if (error.code === '42501') {
                errorMessage = 'PERMISSION DENIED: RLS policy not configured correctly';
            } else if (error.code === '23505') {
                errorMessage = 'DUPLICATE: This business profile already exists';
            } else if (error.code === '42P01') {
                errorMessage = 'TABLE DOES NOT EXIST: business_profiles table is missing';
            }
            
            throw new Error(errorMessage);
        }
        
        return json({
            success: true,
            businessProfileId: data.id,
            message: 'Business profile created successfully'
        });
    } catch (error) {
        console.error('Business profile insertion error:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error during business profile creation'
        }, { status: 500 });
    }
};
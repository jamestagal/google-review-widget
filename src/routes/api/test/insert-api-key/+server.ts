import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/database';
import { generateApiKey } from '$lib/services/widget-creation';

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
        
        console.log('Creating API key for user:', userId);
        
        // Generate a unique API key 
        const tier = body.subscriptionTier || 'FREE';
        const apiKey = generateApiKey(tier);
        
        // Determine rate limits and cache duration based on tier
        let rateLimit = 10;
        let cacheDuration = 86400; // 24 hours in seconds
        let maxReviews = 3;
        
        switch (tier) {
            case 'BASIC':
                rateLimit = 30;
                cacheDuration = 43200; // 12 hours
                maxReviews = 5;
                break;
            case 'PRO':
                rateLimit = 60;
                cacheDuration = 21600; // 6 hours
                maxReviews = 7;
                break;
            case 'PREMIUM':
                rateLimit = 100;
                cacheDuration = 10800; // 3 hours
                maxReviews = 10;
                break;
        }
        
        // Use Supabase client directly
        const { data, error } = await supabase
            .from('widget_api_keys')
            .insert({
                user_id: userId,
                api_key: apiKey,
                subscription_tier: tier,
                rate_limit: rateLimit,
                cache_duration: cacheDuration,
                max_reviews: maxReviews,
                allowed_domains: body.allowedDomains || ['*'],
                custom_settings: body.customSettings || {}
            })
            .select('id, api_key')
            .single();
            
        if (error) {
            // Format error message for better debugging
            let errorMessage = error.message;
            if (error.code === '42501') {
                errorMessage = 'PERMISSION DENIED: RLS policy not configured correctly';
            } else if (error.code === '23505') {
                errorMessage = 'DUPLICATE: This API key already exists';
            } else if (error.code === '42P01') {
                errorMessage = 'TABLE DOES NOT EXIST: widget_api_keys table is missing';
            }
            
            throw new Error(errorMessage);
        }
        
        return json({
            success: true,
            apiKeyId: data.id,
            apiKey: data.api_key,
            message: 'API key created successfully'
        });
    } catch (error) {
        console.error('API key insertion error:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error during API key creation'
        }, { status: 500 });
    }
};
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/database';
import { generateApiKey } from '$lib/services/widget-creation';
import type { WidgetCreationInput } from '$lib/services/widget-creation';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const input: WidgetCreationInput = await request.json();
        
        console.log('Starting transaction test with input:', input);
        
        // Check for user ID
        // Use the verified user object from locals (populated via getUser() in hooks.server.ts)
        const userId = input.businessProfile.user_id || locals.user?.id;
        
        if (!userId) {
            return json({
                success: false,
                error: 'Not authenticated - No user ID provided'
            }, { status: 401 });
        }
        
        // Ensure all parts have the same user ID
        input.businessProfile.user_id = userId;
        input.widgetProject.user_id = userId;
        if (input.widgetApiKey) {
            input.widgetApiKey.user_id = userId;
        }
        
        // Step 1: Create business profile
        const { data: businessProfile, error: profileError } = await supabase
            .from('business_profiles')
            .insert(input.businessProfile)
            .select('*')
            .single();
        
        if (profileError) {
            console.error('Business profile creation failed:', profileError);
            throw new Error(`Failed to create business profile: ${profileError.message}`);
        }
        
        if (!businessProfile || !businessProfile.id) {
            throw new Error('Business profile creation returned no data');
        }
        
        // Step 2: Create API key
        const tier = input.widgetApiKey?.subscription_tier || 'FREE';
        const apiKey = generateApiKey(tier);
        
        // Create widget_api_keys record
        const apiKeyInput = {
            api_key: apiKey,
            user_id: userId,
            subscription_tier: tier,
            // Set appropriate values based on tier
            rate_limit: tier === 'PREMIUM' ? 100 : (tier === 'PRO' ? 60 : (tier === 'BASIC' ? 30 : 10)),
            cache_duration: tier === 'PREMIUM' ? 10800 : (tier === 'PRO' ? 21600 : (tier === 'BASIC' ? 43200 : 86400)),
            max_reviews: tier === 'PREMIUM' ? 10 : (tier === 'PRO' ? 7 : (tier === 'BASIC' ? 5 : 3)),
            allowed_domains: input.widgetApiKey?.allowed_domains || ['*'],
            custom_settings: input.widgetApiKey?.custom_settings || {}
        };
        
        const { data: apiKeyData, error: apiKeyError } = await supabase
            .from('widget_api_keys')
            .insert(apiKeyInput)
            .select('*')
            .single();
        
        if (apiKeyError) {
            console.error('Widget API key creation failed:', apiKeyError);
            
            // Delete the business profile we just created
            await supabase
                .from('business_profiles')
                .delete()
                .eq('id', businessProfile.id);
                
            throw new Error(`Failed to create widget API key: ${apiKeyError.message}`);
        }
        
        // Step 3: Create widget project
        const widgetData = {
            ...input.widgetProject,
            user_id: userId,
            business_profile_id: businessProfile.id,
            api_key: apiKey
        };
        
        const { data: widgetProject, error: widgetError } = await supabase
            .from('widget_projects')
            .insert(widgetData)
            .select('*')
            .single();
        
        if (widgetError) {
            console.error('Widget project creation failed:', widgetError);
            
            // Delete the API key and business profile we just created
            await supabase
                .from('widget_api_keys')
                .delete()
                .eq('api_key', apiKey);
                
            await supabase
                .from('business_profiles')
                .delete()
                .eq('id', businessProfile.id);
                
            throw new Error(`Failed to create widget project: ${widgetError.message}`);
        }
        
        console.log('Transaction test completed successfully');
        
        return json({
            success: true,
            businessProfile,
            widgetProject,
            apiKey,
            message: 'Transaction test completed successfully'
        });
    } catch (error) {
        console.error('Transaction test error:', error);
        
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
};
/**
 * Server-only database admin service
 * 
 * This file contains server-side-only database operations using the service role
 * IMPORTANT: This file should ONLY be imported in server-side code (e.g., +page.server.ts)
 */
import { supabase } from './database';
import type { 
    WidgetCreationInput, 
    WidgetCreationResult
} from '$lib/services/widget-creation';
import { generateApiKey } from '$lib/services/widget-creation';

/**
 * Create a widget with all related resources in a single transaction-like operation
 * This must be called from server-side code only
 */
export async function createWidgetWithTransaction(
    input: WidgetCreationInput
): Promise<WidgetCreationResult> {
    try {
        // Log transaction start for debugging
        console.log('Starting widget creation process (server-side)');
        console.log('Input:', JSON.stringify(input, null, 2));
        
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
        
        console.log('Business profile created:', businessProfile);
        
        // Step 2: Create API key
        const tier = input.widgetApiKey?.subscription_tier || 'FREE';
        const apiKey = generateApiKey(tier);
        
        // Create widget_api_keys record
        const apiKeyInput = {
            api_key: apiKey,
            user_id: input.businessProfile.user_id,
            subscription_tier: tier,
            // Set appropriate values based on tier
            rate_limit: tier === 'PREMIUM' ? 100 : (tier === 'PRO' ? 60 : (tier === 'BASIC' ? 30 : 10)),
            cache_duration: tier === 'PREMIUM' ? 10800 : (tier === 'PRO' ? 21600 : (tier === 'BASIC' ? 43200 : 86400)),
            max_reviews: tier === 'PREMIUM' ? 10 : (tier === 'PRO' ? 7 : (tier === 'BASIC' ? 5 : 3)),
            allowed_domains: input.widgetApiKey?.allowed_domains || ['*'],
            custom_settings: input.widgetApiKey?.custom_settings || {}
        };
        
        // Log the API key input for debugging without revealing sensitive data
        console.log('Inserting widget API key with user_id:', apiKeyInput.user_id);
        
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
        
        const createdApiKey = apiKeyData;
        console.log('API key created:', createdApiKey);
        
        // Step 3: Create widget project
        const widgetData = {
            ...input.widgetProject,
            business_profile_id: businessProfile.id,
            api_key: apiKey // Set the API key we just created
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
        
        console.log('Widget project created:', widgetProject);
        
        // Return the created resources
        return {
            businessProfile,
            widgetProject,
            apiKey
        };
    } catch (error) {
        // Handle unexpected errors
        console.error('Unexpected error during widget creation:', error);
        throw error;
    }
}
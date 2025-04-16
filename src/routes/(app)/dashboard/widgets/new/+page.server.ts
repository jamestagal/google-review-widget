import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createWidgetWithTransaction } from '$lib/server/database-admin';
import type { 
    BusinessProfileInput, 
    WidgetProjectInput, 
    WidgetCreationInput, 
    WidgetApiKeyInput
} from '$lib/services/widget-creation';

export const actions: Actions = {
    createWidget: async ({ request, locals }) => {
        try {
            const formData = await request.formData();
            const data = Object.fromEntries(formData);
            
            console.log('Form data received:', data);
            
            // Ensure user is authenticated using secure method
            let userId = data.userId as string;
            
            // If we don't have a user ID from form data, get it from the verified user object
            if (!userId && locals.user) {
                userId = locals.user.id;
            }
            
            if (!userId) {
                console.error('User not authenticated');
                return fail(401, { error: 'You must be logged in to create a widget' });
            }
            
            // Parse the form data
            const businessProfile: BusinessProfileInput = {
                user_id: userId,
                google_place_id: data.placeId as string,
                business_name: data.businessName as string,
                business_address: data.businessAddress as string || null
            };
            
            // Parse allowed domains
            let allowedDomains: string[] = ['*'];
            if (data.allowedDomains && typeof data.allowedDomains === 'string') {
                allowedDomains = data.allowedDomains
                    .split(',')
                    .map(domain => domain.trim())
                    .filter(Boolean);
                
                if (allowedDomains.length === 0) {
                    allowedDomains = ['*']; // Default to all domains if none specified
                }
            }
            
            // Parse subscription tier (if present)
            const subscriptionTier = data.subscriptionTier as string || 'FREE';
            
            // Create the widget input
            const widgetInput: WidgetCreationInput = {
                businessProfile,
                widgetProject: {
                    user_id: userId,
                    name: data.widgetName as string || `${businessProfile.business_name} Reviews`,
                    display_type: data.displayType as string || 'carousel',
                    theme: data.theme as string || 'light',
                },
                widgetApiKey: {
                    user_id: userId,
                    subscription_tier: subscriptionTier,
                    allowed_domains: allowedDomains,
                    custom_settings: {
                        theme: data.theme as string || 'light',
                        maxReviews: parseInt(data.maxReviews as string) || 3,
                        minRating: parseInt(data.minRating as string) || 1
                    }
                }
            };
            
            console.log('Calling createWidgetWithTransaction with input:', widgetInput);
            
            // Call the server-side transaction function
            const result = await createWidgetWithTransaction(widgetInput);
            
            console.log('Widget created successfully:', result);
            
            return {
                success: true,
                widget: result.widgetProject,
                apiKey: result.apiKey
            };
        } catch (error) {
            console.error('Error creating widget:', error);
            
            return fail(500, { 
                error: error instanceof Error ? error.message : 'An unknown error occurred',
                success: false
            });
        }
    }
};
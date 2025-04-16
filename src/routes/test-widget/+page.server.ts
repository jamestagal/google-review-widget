import { json } from '@sveltejs/kit';
import type { Actions } from './$types';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE } from '$env/static/private';

// Import needed to debug service role key issues
import { createClient } from '@supabase/supabase-js';

// Create a direct admin client for testing/logging only
const supabaseServiceClient = createClient(
    PUBLIC_SUPABASE_URL,
    PRIVATE_SUPABASE_SERVICE_ROLE,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Server actions for testing database operations directly with admin permissions
export const actions: Actions = {
    // Test insertion into business_profiles table
    testBusinessProfile: async ({ request }) => {
        try {
            const formData = await request.formData();
            const userId = formData.get('user_id') as string;
            
            if (!userId) {
                return json({
                    success: false,
                    error: 'User ID is required'
                }, { status: 400 });
            }
            
            // Log the service role key (partial, for debugging)
            console.log('Service role key available:', !!PRIVATE_SUPABASE_SERVICE_ROLE);
            if (PRIVATE_SUPABASE_SERVICE_ROLE) {
                const keyStart = PRIVATE_SUPABASE_SERVICE_ROLE.substring(0, 4);
                const keyEnd = PRIVATE_SUPABASE_SERVICE_ROLE.substring(PRIVATE_SUPABASE_SERVICE_ROLE.length - 4);
                console.log(`Key format: ${keyStart}...${keyEnd}`);
            }
            
            // Create test data 
            const testData = {
                user_id: userId,
                google_place_id: 'TEST_ADMIN_' + Date.now(),
                business_name: 'Test Business (Admin) ' + Date.now(),
                business_address: 'Test Address'
            };
            
            console.log('Attempting direct insert with test data:', JSON.stringify(testData));
            
            // Try first with the Supabase client directly for logging purposes
            console.log('Attempting insert using Supabase client with service role');
            const { data: _clientData, error: clientError } = await supabaseServiceClient
                .from('business_profiles')
                .insert(testData)
                .select()
                .single();
                
            if (clientError) {
                console.error('Supabase client insert failed:', clientError);
            } else {
                console.log('Supabase client insert succeeded!');
            }
            
            // Direct REST API call to bypass RLS with additional headers
            console.log('Attempting direct REST API call to bypass RLS');
            const response = await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/business_profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': PRIVATE_SUPABASE_SERVICE_ROLE,
                    'Authorization': `Bearer ${PRIVATE_SUPABASE_SERVICE_ROLE}`,
                    'X-Client-Info': 'supabase-js/2.0',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(testData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Business profile test insert failed:', errorText);
                console.error('Response status:', response.status);
                console.error('Response headers:', Object.fromEntries(response.headers.entries()));
                
                // Try with PostgreSQL JSON RPC method as a last resort
                console.log('Attempting final method with PostgreSQL RPC');
                try {
                    const rpcResponse = await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/rpc/insert_business_profile`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': PRIVATE_SUPABASE_SERVICE_ROLE,
                            'Authorization': `Bearer ${PRIVATE_SUPABASE_SERVICE_ROLE}`,
                        },
                        body: JSON.stringify(testData)
                    });
                    
                    if (rpcResponse.ok) {
                        const profile = await rpcResponse.json();
                        console.log('RPC method succeeded:', profile);
                        return json({
                            success: true,
                            message: 'Test business profile created with RPC method',
                            data: profile
                        });
                    } else {
                        console.error('RPC method also failed:', await rpcResponse.text());
                    }
                } catch (rpcError) {
                    console.error('RPC error:', rpcError);
                }
                
                return json({
                    success: false,
                    error: `Failed to create test business profile: ${errorText}`
                }, { status: 500 });
            }
            
            // Parse the response data
            const data = await response.json();
            const profile = data[0];
            
            // Clean up the test data
            await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/business_profiles?id=eq.${profile.id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': PRIVATE_SUPABASE_SERVICE_ROLE,
                    'Authorization': `Bearer ${PRIVATE_SUPABASE_SERVICE_ROLE}`
                }
            });
            
            return json({
                success: true,
                message: 'Test business profile created and deleted successfully'
            });
        } catch (error) {
            console.error('Error in business profile test:', error);
            return json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 });
        }
    },
    
    // Test insertion into widget_api_keys table
    testApiKey: async ({ request }) => {
        try {
            const formData = await request.formData();
            const userId = formData.get('user_id') as string;
            
            if (!userId) {
                return json({
                    success: false,
                    error: 'User ID is required'
                }, { status: 400 });
            }
            
            // Create test data
            const testData = {
                user_id: userId,
                api_key: 'test_admin_' + Date.now(),
                subscription_tier: 'FREE',
                rate_limit: 10,
                cache_duration: 86400,
                max_reviews: 3,
                allowed_domains: ['*'],
                custom_settings: {}
            };
            
            // Direct REST API call to bypass RLS
            const response = await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/widget_api_keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': PRIVATE_SUPABASE_SERVICE_ROLE,
                    'Authorization': `Bearer ${PRIVATE_SUPABASE_SERVICE_ROLE}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(testData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API key test insert failed:', errorText);
                return json({
                    success: false,
                    error: `Failed to create test API key: ${errorText}`
                }, { status: 500 });
            }
            
            // Parse the response data
            const data = await response.json();
            const apiKey = data[0];
            
            // Clean up the test data
            await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/widget_api_keys?id=eq.${apiKey.id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': PRIVATE_SUPABASE_SERVICE_ROLE,
                    'Authorization': `Bearer ${PRIVATE_SUPABASE_SERVICE_ROLE}`
                }
            });
            
            return json({
                success: true,
                message: 'Test API key created and deleted successfully'
            });
        } catch (error) {
            console.error('Error in API key test:', error);
            return json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 });
        }
    }
};

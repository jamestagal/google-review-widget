import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
    // IMPORTANT: Use ServiceRole client to bypass RLS policies for testing
    // @ts-expect-error - Supabase typing complexity - runtime validated
    const supabase = locals.supabaseServiceRole;
    if (!supabase) {
        return json({
            success: false,
            error: 'Service role client not available'
        }, { status: 500 });
    }
    
    console.log('=== TEST WIDGET INSERTION ENDPOINT ===');
    console.log('This endpoint is for TESTING ONLY.');
    
    try {
        // Clone the request to avoid consumption issues
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        
        // Debug: Log the complete request body to see all fields
        console.log('Incoming request body:', JSON.stringify(body, null, 2));
        
        // FOR TESTING ONLY: Generate a fake user ID if needed
        // In a production app, we would NEVER do this
        let testUserId: string;
        
        console.log('Creating test user with ServiceRole permissions');
        
        // Try to get any existing user first
        const { data: existingUsers, error: _userError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
        
        // Note: We're prefixing unused variables with _ to satisfy linting rules
            
        if (existingUsers && existingUsers.length > 0) {
            // Use existing user if available
            testUserId = existingUsers[0].id;
            console.log('Found existing user:', testUserId);
        } else {
            // Create a new test user directly in the auth.users table
            console.log('No existing users found. Creating a new test user with ServiceRole...');
            
            // Generate a UUID for the test user
            const testUuid = crypto.randomUUID();
            console.log('Generated UUID for test user:', testUuid);
            
            // Insert directly into auth.users table - ONLY FOR TESTING
            const { error: authError } = await supabase.rpc('create_test_user', {
                user_id: testUuid,
                user_email: `test.${testUuid.substring(0, 8)}@example.com`,
                user_name: 'Test User'
            });
            
            if (authError) {
                console.error('Failed to create test user with RPC:', authError);
                
                // Fallback: Use a mock user ID as last resort for testing
                testUserId = testUuid;
                console.log('Using mock user ID as fallback:', testUserId);
            } else {
                console.log('Successfully created test user with ID:', testUuid);
                testUserId = testUuid;
            }
        }
        
        // Generate a unique ID for test data
        const testId = Math.floor(Math.random() * 1000000);
        
        // SIMPLIFY: For testing - create a business profile with minimal fields
        console.log('Creating test business profile...');
        
        // Create a temporary table if it doesn't exist (to avoid schema issues)
        await supabase.rpc('execute_sql', {
            sql_query: `
                CREATE TABLE IF NOT EXISTS public.business_profiles (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID,
                    google_place_id TEXT NOT NULL,
                    business_name TEXT NOT NULL,
                    business_address TEXT,
                    logo_url TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
            `
        });
        
        // Create a minimal business profile
        const businessProfileData = {
            user_id: testUserId,
            google_place_id: body.googlePlaceId || `TEST_${testId}`,
            business_name: body.businessName || `Test Business ${testId}`,
            business_address: body.businessAddress || 'Test Address'
        };
        
        console.log('Business profile data:', JSON.stringify(businessProfileData, null, 2));
        
        const { data: businessProfile, error: businessProfileError } = await supabase
            .from('business_profiles')
            .insert(businessProfileData)
            .select('id')
            .single();
        
        if (businessProfileError) {
            console.error('Failed to create business profile:', businessProfileError);
            return json({
                success: false,
                error: `Failed to create business profile: ${businessProfileError.message}`
            }, { status: 500 });
        }
        
        const businessProfileId = businessProfile.id;
        console.log('✓ Created business profile with ID:', businessProfileId);
        
        // IMPORTANT: Create API key FIRST before widget project to satisfy foreign key constraint
        console.log('Creating API key first...');
        
        // Generate unique API key
        const apiKeyValue = `wk_test_${Math.random().toString(36).substring(2, 15)}`;
        
        // Create a minimal API key entry
        const apiKeyData = {
            api_key: apiKeyValue,
            user_id: testUserId,
            subscription_tier: body.subscriptionTier || 'FREE'
        };
        
        console.log('API key data:', JSON.stringify(apiKeyData, null, 2));
        
        const { data: _apiKey, error: apiKeyError } = await supabase
            .from('widget_api_keys')
            .insert(apiKeyData)
            .select()
            .single();
        
        if (apiKeyError) {
            console.error('API key creation error:', apiKeyError);
            return json({
                success: false,
                error: `API key creation error: ${apiKeyError.message}`
            }, { status: 500 });
        }
        
        console.log('✓ Created API key:', apiKeyValue);
        
        // Now create the widget project with reference to the API key
        console.log('Creating widget project (with API key reference)...');
        
        // Create a minimal widget project WITH api_key reference
        const widgetProjectData = {
            user_id: testUserId,
            business_profile_id: businessProfileId,
            name: body.name || `Test Widget ${testId}`,
            display_type: body.displayType || 'carousel',
            theme: body.theme || 'light',
            subscription_tier: body.subscriptionTier || 'FREE',
            api_key: apiKeyValue  // Important: Include reference to the API key we created first
        };
        
        console.log('Widget project data:', JSON.stringify(widgetProjectData, null, 2));
        
        const { data: widgetProject, error: widgetError } = await supabase
            .from('widget_projects')
            .insert(widgetProjectData)
            .select('id')
            .single();
        
        if (widgetError) {
            console.error('Widget project creation error:', widgetError);
            return json({
                success: false,
                error: `Widget creation error: ${widgetError.message}`
            }, { status: 500 });
        }
        
        console.log('✓ Created widget project with ID:', widgetProject.id);
        
        // Create SQL function for creating test users if it doesn't exist
        await supabase.rpc('execute_sql', {
            sql_query: `
                CREATE OR REPLACE FUNCTION create_test_user(user_id uuid, user_email text, user_name text)
                RETURNS void
                LANGUAGE plpgsql
                SECURITY DEFINER
                AS $$
                BEGIN
                    -- Insert into auth.users with minimal required fields
                    INSERT INTO auth.users(
                        id, 
                        email,
                        raw_user_meta_data,
                        email_confirmed_at,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        user_id,
                        user_email,
                        jsonb_build_object('name', user_name),
                        now(),
                        now(),
                        now()
                    )
                    ON CONFLICT (id) DO NOTHING;
                END;
                $$;
            `
        });
        
        return json({
            success: true,
            widgetId: widgetProject.id,
            apiKey: apiKeyValue,
            businessProfileId: businessProfileId,
            userId: testUserId,
            message: 'Widget project created successfully'
        });
    } catch (error) {
        console.error('TEST ENDPOINT ERROR:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error in test widget creation endpoint',
            details: 'This endpoint is for testing only and may need admin permissions to function correctly.'
        }, { status: 500 });
    }
};
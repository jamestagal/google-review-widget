<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import * as Card from '$lib/components/ui/card';
    import * as Button from '$lib/components/ui/button';
    import * as Separator from '$lib/components/ui/separator';
    import { supabase } from '$lib/services/database';
    
    // Get the user session from the page data
    let user;
    // Use verified user data from getUser() instead of session
    $: user = $page.data.user;
    
    let connectionStatus = 'Testing connection...';
    let rls = 'Not tested yet';
    let errors = [];
    let businessProfileTestResult = 'Not tested';
    let apiKeyTestResult = 'Not tested';
    
    // Test basic connection to Supabase
    async function testConnection() {
        try {
            connectionStatus = 'Testing connection...';
            errors = errors.filter(e => !e.startsWith('Connection'));
            
            // Simple query to check connectivity
            const { error } = await supabase.from('business_profiles').select('count').limit(1);
            
            if (error) {
                connectionStatus = '❌ Connection failed';
                errors.push(`Connection error: ${error.message}`);
                return false;
            } else {
                connectionStatus = '✅ Connection successful';
                return true;
            }
        } catch (err) {
            connectionStatus = '❌ Connection error';
            errors.push(`Connection exception: ${err.message}`);
            return false;
        }
    }
    
    // Test RLS permissions for insertion
    async function testRLS() {
        if (!user) {
            rls = '⚠️ Not logged in, can\'t test RLS';
            return;
        }
        
        try {
            rls = 'Testing RLS policies...';
            
            // Try to access business_profiles table (should work with RLS)
            const { error: profileError } = await supabase
                .from('business_profiles')
                .select('*')
                .eq('user_id', user.id)
                .limit(1);
                
            if (profileError) {
                if (profileError.code === '42501' || profileError.message?.includes('permission')) {
                    rls = '❌ RLS policy missing or not working for business_profiles';
                    errors.push(`RLS error on business_profiles: ${profileError.message}`);
                } else {
                    rls = '❌ Error accessing business_profiles: ' + profileError.code;
                    errors.push(`Error on business_profiles: ${profileError.message}`);
                }
            } else {
                rls = '✅ RLS policies are working correctly';
            }
        } catch (err) {
            rls = '❌ RLS test error';
            errors.push(`RLS test exception: ${err.message}`);
        }
    }
    
    // Test direct insertion to business_profiles
    async function testBusinessProfileInsert() {
        if (!user) {
            businessProfileTestResult = '⚠️ Not logged in';
            return;
        }
        
        try {
            businessProfileTestResult = 'Testing...';
            
            // Create a test profile with a temporary name
            const testData = {
                user_id: user.id,
                google_place_id: 'TEST_' + Date.now(),
                business_name: 'Test Business ' + Date.now(),
                business_address: 'Test Address'
            };
            
            const { data, error } = await supabase
                .from('business_profiles')
                .insert(testData)
                .select()
                .single();
                
            if (error) {
                businessProfileTestResult = '❌ Insert failed';
                errors.push(`business_profiles insert error: ${error.message}`);
                
                // Check for common issues
                if (error.code === '42501') {
                    errors.push('PERMISSION DENIED: RLS policy not configured correctly');
                } else if (error.code === '23505') {
                    errors.push('UNIQUE VIOLATION: A record with this data already exists');
                }
            } else if (data) {
                businessProfileTestResult = '✅ Insert successful';
                
                // Clean up test data
                await supabase
                    .from('business_profiles')
                    .delete()
                    .eq('id', data.id);
            }
        } catch (err) {
            businessProfileTestResult = '❌ Test error';
            errors.push(`business_profiles test exception: ${err.message}`);
        }
    }
    
    // Test direct insertion to widget_api_keys
    async function testApiKeyInsert() {
        if (!user) {
            apiKeyTestResult = '⚠️ Not logged in';
            return;
        }
        
        try {
            apiKeyTestResult = 'Testing...';
            
            // Create a test API key with a temporary value
            const testData = {
                user_id: user.id,
                api_key: 'test_' + Date.now(),
                subscription_tier: 'FREE',
                rate_limit: 10,
                cache_duration: 86400,
                max_reviews: 3,
                allowed_domains: ['*'],
                custom_settings: {}
            };
            
            const { data, error } = await supabase
                .from('widget_api_keys')
                .insert(testData)
                .select()
                .single();
                
            if (error) {
                apiKeyTestResult = '❌ Insert failed';
                errors.push(`widget_api_keys insert error: ${error.message}`);
                
                // Check for common issues
                if (error.code === '42501') {
                    errors.push('PERMISSION DENIED: RLS policy not configured correctly');
                } else if (error.code === '23505') {
                    errors.push('UNIQUE VIOLATION: A record with this data already exists');
                }
            } else if (data) {
                apiKeyTestResult = '✅ Insert successful';
                
                // Clean up test data
                await supabase
                    .from('widget_api_keys')
                    .delete()
                    .eq('id', data.id);
            }
        } catch (err) {
            apiKeyTestResult = '❌ Test error';
            errors.push(`widget_api_keys test exception: ${err.message}`);
        }
    }
    
    // Run database tests on mount
    onMount(async () => {
        const connectionOk = await testConnection();
        if (connectionOk && user) {
            testRLS();
        }
    });
</script>

<svelte:head>
    <title>Widget System Diagnostic</title>
</svelte:head>

<div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-6">500 Error Diagnostic Tool</h1>
    
    <div class="grid gap-8 md:grid-cols-2">
        <Card.Root>
            <Card.Header>
                <Card.Title>Connection Status</Card.Title>
                <Card.Description>
                    Testing basic connectivity to Supabase
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="text-lg mb-4">{connectionStatus}</div>
                <Button.Root on:click={testConnection}>Test Again</Button.Root>
            </Card.Content>
        </Card.Root>
        
        <Card.Root>
            <Card.Header>
                <Card.Title>User Information</Card.Title>
                <Card.Description>
                    Current authenticated user
                </Card.Description>
            </Card.Header>
            <Card.Content>
                {#if user}
                    <div class="grid grid-cols-2 gap-2">
                        <div class="font-semibold">User ID:</div>
                        <div class="font-mono text-sm overflow-hidden text-ellipsis">{user.id}</div>
                        
                        <div class="font-semibold">Email:</div>
                        <div>{user.email || 'Not available'}</div>
                    </div>
                {:else}
                    <p class="text-amber-600">Not logged in - Please log in to run tests</p>
                {/if}
            </Card.Content>
        </Card.Root>
        
        <Card.Root>
            <Card.Header>
                <Card.Title>RLS Policies</Card.Title>
                <Card.Description>
                    Testing if Row Level Security is working
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="text-lg mb-4">{rls}</div>
                <Button.Root on:click={testRLS} disabled={!user}>Test RLS Policies</Button.Root>
            </Card.Content>
        </Card.Root>
        
        <Card.Root>
            <Card.Header>
                <Card.Title>Direct Table Tests</Card.Title>
                <Card.Description>
                    Testing direct insertion to key tables
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="grid grid-cols-2 gap-y-4">
                    <div class="font-semibold">Business Profiles:</div>
                    <div>{businessProfileTestResult}</div>
                    
                    <div class="font-semibold">Widget API Keys:</div>
                    <div>{apiKeyTestResult}</div>
                </div>
                
                <div class="space-y-4 mt-4">
                    <div>
                        <h3 class="text-sm font-semibold mb-2">Client-Side Tests (RLS Required)</h3>
                        <div class="flex gap-4">
                            <Button.Root on:click={testBusinessProfileInsert} disabled={!user} variant="outline" size="sm">
                                Test Business Profile
                            </Button.Root>
                            <Button.Root on:click={testApiKeyInsert} disabled={!user} variant="outline" size="sm">
                                Test API Key
                            </Button.Root>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-sm font-semibold mb-2">Server-Side Tests (Bypasses RLS)</h3>
                        <div class="flex gap-4">
                            <!-- Server-side business profile test -->
                            <form action="?/testBusinessProfile" method="POST" class="inline">
                                {#if user}
                                    <input type="hidden" name="user_id" value={user.id} />
                                {/if}
                                <Button.Root type="submit" disabled={!user} variant="outline" size="sm">
                                    Server Test Profile
                                </Button.Root>
                            </form>
                            
                            <!-- Server-side API key test -->
                            <form action="?/testApiKey" method="POST" class="inline">
                                {#if user}
                                    <input type="hidden" name="user_id" value={user.id} />
                                {/if}
                                <Button.Root type="submit" disabled={!user} variant="outline" size="sm">
                                    Server Test API Key
                                </Button.Root>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 pt-4 border-t text-xs text-gray-600">
                    <p>Server-side tests use direct API calls with service role to bypass RLS policies.</p>
                </div>
            </Card.Content>
        </Card.Root>
    </div>
    
    {#if errors.length > 0}
        <div class="mt-8">
            <h2 class="text-xl font-bold mb-4 text-red-600">Errors Found</h2>
            <div class="bg-red-50 border border-red-200 rounded p-4">
                <ul class="list-disc pl-5 space-y-2">
                    {#each errors as error}
                        <li class="text-red-600">{error}</li>
                    {/each}
                </ul>
            </div>
        </div>
    {/if}
    
    <Separator.Root class="my-8" />
    
    <div class="p-6 bg-gray-50 border rounded">
        <h2 class="text-xl font-bold mb-4">Troubleshooting 500 Internal Server Error</h2>
        
        <p class="mb-4">Based on your previous experience with 500 errors in this app:</p>
        
        <ol class="list-decimal pl-5 space-y-3 mb-4">
            <li>
                <strong>Check RLS Policies</strong> - The 500 error is likely due to missing Row Level Security policies, which was similar to your previous Settings page issue. 
                Apply the SQL migration script on your Supabase instance's SQL Editor.
            </li>
            <li>
                <strong>Check for Default Values or Fallbacks</strong> - Remember your previous fix for the 500 error on the Settings page involved modifying the <code>handle_new_user()</code> trigger function to provide fallbacks for missing name values. Similar issues might be happening with widget creation.
            </li>
            <li>
                <strong>Verify User Profile Creation</strong> - The widget creation might fail if the user profile wasn't created properly. Check if there's a record in the <code>profiles</code> table for your user.
            </li>
            <li>
                <strong>Environment Variables</strong> - Ensure your <code>PUBLIC_SUPABASE_URL</code>, <code>PUBLIC_SUPABASE_ANON_KEY</code>, and <code>PRIVATE_SUPABASE_SERVICE_ROLE</code> keys are correctly configured.
            </li>
        </ol>
        
        <div class="p-4 border-l-4 border-blue-500 bg-blue-50 mb-4">
            <h3 class="font-bold mb-2">Previous Fix Reference</h3>
            <p class="mb-2">Your successful fix for the Settings page 500 error was to modify the trigger function to handle missing name values:</p>
            <pre class="bg-gray-800 text-white p-3 rounded overflow-x-auto text-sm">
  CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.profiles (id, "name")
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
    );
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
            </pre>
        </div>
        
        <p class="font-semibold">Next Step: Apply the SQL migration script to your Supabase database's SQL Editor.</p>
    </div>
</div>
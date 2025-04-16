<script lang="ts">
    import { page } from '$app/stores';
    import DashboardShell from '../../../components/dashboard-shell.svelte';
    import * as Button from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import * as Input from '$lib/components/ui/input';
    import * as Label from '$lib/components/ui/label';
    
    // Get the verified user from the page data
    let user = $page.data.user; // Using verified user data instead of session
    
    // Storage for test results
    let testResults = {
        userAuthenticated: false,
        userInfo: null,
        widgetConfigForm: false,
        directInsert: {
            business: false,
            businessError: '',
            apiKey: false,
            apiKeyError: '',
            widget: false,
            widgetError: ''
        }
    };
    
    // Perform user authentication test
    $: if (user) {
        testResults.userAuthenticated = true;
        testResults.userInfo = user;
    }
    
    // Simple business profile data for testing
    let testBusinessProfile = {
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4', // Sydney Opera House
        businessName: 'Test Business',
        businessAddress: '123 Test Street, Test City'
    };
    
    // Testing functions
    async function testDirectInsert() {
        try {
            // Reset error states
            testResults.directInsert.businessError = '';
            testResults.directInsert.apiKeyError = '';
            testResults.directInsert.widgetError = '';
            
            // Test direct insert to business_profiles table
            const businessResponse = await fetch('/api/test/insert-business', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    googlePlaceId: testBusinessProfile.googlePlaceId,
                    businessName: testBusinessProfile.businessName,
                    businessAddress: testBusinessProfile.businessAddress,
                    userId: user?.id // Pass user ID directly
                })
            });
            
            const businessResult = await businessResponse.json();
            testResults.directInsert.business = businessResult.success;
            if (!businessResult.success) {
                testResults.directInsert.businessError = businessResult.error;
                return;
            }
            
            // Test direct insert to widget_api_keys table
            const apiKeyResponse = await fetch('/api/test/insert-api-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscriptionTier: 'FREE',
                    allowedDomains: ['*'],
                    userId: user?.id // Pass user ID directly
                })
            });
            
            const apiKeyResult = await apiKeyResponse.json();
            testResults.directInsert.apiKey = apiKeyResult.success;
            if (!apiKeyResult.success) {
                testResults.directInsert.apiKeyError = apiKeyResult.error;
                return;
            }
            
            // Test direct insert to widget_projects table 
            const widgetResponse = await fetch('/api/test/insert-widget', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    businessProfileId: businessResult.businessProfileId,
                    name: 'Test Widget',
                    displayType: 'carousel',
                    theme: 'light',
                    userId: user?.id // Pass user ID directly
                })
            });
            
            const widgetResult = await widgetResponse.json();
            testResults.directInsert.widget = widgetResult.success;
            if (!widgetResult.success) {
                testResults.directInsert.widgetError = widgetResult.error;
            }
        } catch (error) {
            console.error('Test error:', error);
        }
    }
    
    async function testTransactionAPI() {
        try {
            const response = await fetch('/api/test/transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    businessProfile: {
                        user_id: user?.id, // Use actual user ID
                        google_place_id: testBusinessProfile.googlePlaceId,
                        business_name: testBusinessProfile.businessName,
                        business_address: testBusinessProfile.businessAddress
                    },
                    widgetProject: {
                        user_id: user?.id, // Use actual user ID
                        name: 'Test Transaction Widget',
                        display_type: 'carousel',
                        theme: 'light'
                    },
                    widgetApiKey: {
                        user_id: user?.id, // Use actual user ID
                        subscription_tier: 'FREE',
                        allowed_domains: ['*'],
                        custom_settings: {
                            theme: 'light',
                            maxReviews: 3,
                            minRating: 0
                        }
                    }
                })
            });
            
            const result = await response.json();
            alert(`Transaction test result: ${result.success ? 'Success' : 'Failed'}\n${result.error || ''}`);
        } catch (error) {
            console.error('Transaction test error:', error);
            alert(`Transaction test error: ${error.message || 'Unknown error'}`);
        }
    }
    
    async function testSimpleFormSubmit() {
        try {
            // Check if we have a user
            if (!user || !user.id) {
                alert('You must be logged in to create a widget');
                return;
            }
            
            const formData = new FormData();
            
            // Add minimum required fields
            formData.append('placeId', testBusinessProfile.googlePlaceId);
            formData.append('businessName', testBusinessProfile.businessName);
            formData.append('businessAddress', testBusinessProfile.businessAddress);
            formData.append('widgetName', 'Test Form Widget');
            formData.append('displayType', 'carousel');
            formData.append('theme', 'light');
            formData.append('subscriptionTier', 'FREE');
            formData.append('maxReviews', '3');
            formData.append('minRating', '0');
            formData.append('allowedDomains', '*');
            formData.append('userId', user.id); // Add user ID explicitly
            
            console.log('Submitting form with data:', Object.fromEntries(formData.entries()));
            
            const response = await fetch('?/createWidget', {
                method: 'POST',
                body: formData
            });
            
            // Log the full response for debugging
            console.log('Form submission response status:', response.status);
            
            // Get the raw text first to help with debugging
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            let result;
            try {
                // Try to parse the response as JSON
                result = JSON.parse(responseText);
            } catch (parseError) {
                // If parsing fails, show the raw response
                alert(`Form submission failed: Response is not valid JSON.\n\nRaw response:\n${responseText}`);
                return;
            }
            
            // Detailed error display
            if (result.success) {
                alert(`Form submission successful! Widget created.\nWidget ID: ${result.widget?.id || 'unknown'}\nAPI Key: ${result.apiKey?.api_key || 'unknown'}`);
            } else {
                let errorMessage = `Form submission failed: ${result.error || 'Unknown error'}`;
                
                // Add detailed error info if available
                if (result.details) {
                    errorMessage += `\n\nDetails: ${JSON.stringify(result.details, null, 2)}`;
                }
                
                if (result.step) {
                    errorMessage += `\n\nFailed at step: ${result.step}`;
                }
                
                console.error('Form submission error details:', result);
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Form test error:', error);
            alert(`Form test error: ${error.message || 'Unknown error'}`);
        }
    }
    
    async function testCheckDatabase() {
        try {
            const response = await fetch('/api/test/check-database');
            const result = await response.json();
            
            alert(`Database check result: ${JSON.stringify(result, null, 2)}`);
        } catch (error) {
            console.error('Database check error:', error);
            alert(`Database check error: ${error.message || 'Unknown error'}`);
        }
    }
</script>

<svelte:head>
    <title>Widget Diagnostics - Google Reviews Widget</title>
</svelte:head>

<DashboardShell>
    <div class="flex items-center mb-4">
        <h2 class="text-3xl font-bold tracking-tight">Widget Creation Diagnostics</h2>
    </div>
    
    <div class="space-y-6">
        <!-- Authentication Test -->
        <Card.Root>
            <Card.Header>
                <Card.Title>Authentication Check</Card.Title>
                <Card.Description>
                    Verifies if user authentication is working correctly.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                {#if testResults.userAuthenticated}
                    <div class="bg-green-100 p-4 rounded-md border border-green-200">
                        <h3 class="font-semibold text-green-800">Authentication Working</h3>
                        <p>User ID: {testResults.userInfo.id}</p>
                        <p>Email: {testResults.userInfo.email}</p>
                    </div>
                {:else}
                    <div class="bg-red-100 p-4 rounded-md border border-red-200">
                        <h3 class="font-semibold text-red-800">Authentication Issue</h3>
                        <p>User session not detected. You must be logged in for widget creation to work.</p>
                    </div>
                {/if}
            </Card.Content>
        </Card.Root>
        
        <!-- Database Connection Test -->
        <Card.Root>
            <Card.Header>
                <Card.Title>Database Connection Test</Card.Title>
                <Card.Description>
                    Tests the connection to Supabase database and RLS policies.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="space-y-4">
                    <p>This will check if the database is accessible and if the tables necessary for widget creation exist.</p>
                    <Button.Root on:click={testCheckDatabase}>
                        Check Database
                    </Button.Root>
                </div>
            </Card.Content>
        </Card.Root>
        
        <!-- Direct Insert Test -->
        <Card.Root>
            <Card.Header>
                <Card.Title>Direct Table Insert Tests</Card.Title>
                <Card.Description>
                    Tests inserting directly into individual tables to identify RLS issues.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="space-y-4">
                    <div class="flex items-start space-x-4">
                        <div class="flex-1 space-y-2">
                            <Label.Root for="place-id">Google Place ID</Label.Root>
                            <Input.Root 
                                id="place-id"
                                bind:value={testBusinessProfile.googlePlaceId}
                                placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                            />
                        </div>
                        <div class="flex-1 space-y-2">
                            <Label.Root for="business-name">Business Name</Label.Root>
                            <Input.Root 
                                id="business-name"
                                bind:value={testBusinessProfile.businessName}
                                placeholder="Test Business"
                            />
                        </div>
                    </div>
                    <Button.Root on:click={testDirectInsert}>
                        Test Direct Inserts
                    </Button.Root>
                    
                    <div class="grid grid-cols-3 gap-4 mt-4">
                        <div class={`p-4 rounded-md border ${testResults.directInsert.business ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                            <h3 class="font-semibold">Business Profile</h3>
                            <p>{testResults.directInsert.business ? '✅ Success' : '⏱️ Not tested'}</p>
                            {#if testResults.directInsert.businessError}
                                <p class="text-red-600 text-sm mt-2">{testResults.directInsert.businessError}</p>
                            {/if}
                        </div>
                        <div class={`p-4 rounded-md border ${testResults.directInsert.apiKey ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                            <h3 class="font-semibold">Widget API Key</h3>
                            <p>{testResults.directInsert.apiKey ? '✅ Success' : '⏱️ Not tested'}</p>
                            {#if testResults.directInsert.apiKeyError}
                                <p class="text-red-600 text-sm mt-2">{testResults.directInsert.apiKeyError}</p>
                            {/if}
                        </div>
                        <div class={`p-4 rounded-md border ${testResults.directInsert.widget ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                            <h3 class="font-semibold">Widget Project</h3>
                            <p>{testResults.directInsert.widget ? '✅ Success' : '⏱️ Not tested'}</p>
                            {#if testResults.directInsert.widgetError}
                                <p class="text-red-600 text-sm mt-2">{testResults.directInsert.widgetError}</p>
                            {/if}
                        </div>
                    </div>
                </div>
            </Card.Content>
        </Card.Root>
        
        <!-- Transaction Test -->
        <Card.Root>
            <Card.Header>
                <Card.Title>Transaction Test</Card.Title>
                <Card.Description>
                    Tests the full widget creation transaction to identify where failures occur.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="space-y-4">
                    <p>This will attempt to create a widget using a transaction similar to what's used in the real form submission.</p>
                    <Button.Root on:click={testTransactionAPI}>
                        Test Transaction API
                    </Button.Root>
                </div>
            </Card.Content>
        </Card.Root>
        
        <!-- Simple Form Test -->
        <Card.Root>
            <Card.Header>
                <Card.Title>Simple Form Submission Test</Card.Title>
                <Card.Description>
                    Tests the form action with minimal data to identify any form handling issues.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="space-y-4">
                    <p>This will submit a simplified version of the widget creation form.</p>
                    <Button.Root on:click={testSimpleFormSubmit}>
                        Test Simple Form Submit
                    </Button.Root>
                </div>
            </Card.Content>
        </Card.Root>
        
        <!-- Module Import Test -->
        <Card.Root>
            <Card.Header>
                <Card.Title>Module Import Check</Card.Title>
                <Card.Description>
                    Tests if the key modules are properly importable.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="space-y-4">
                    <p>This will check if all required modules can be imported correctly.</p>
                    <Button.Root on:click={async () => {
                        try {
                            const response = await fetch('/api/test/check-modules');
                            const result = await response.json();
                            
                            // Create a detailed message
                            let message = `Module import test results:\n\n`;
                            for (const [modulePath, moduleResult] of Object.entries(result.modules)) {
                                message += `${modulePath}: ${moduleResult.success ? '✅ Success' : '❌ Failed'}\n`;
                                if (!moduleResult.success && moduleResult.error) {
                                    message += `Error: ${moduleResult.error}\n`;
                                }
                            }
                            
                            alert(message);
                        } catch (error) {
                            console.error('Module check error:', error);
                            alert(`Module check error: ${error.message || 'Unknown error'}`);
                        }
                    }}>
                        Check Module Imports
                    </Button.Root>
                </div>
            </Card.Content>
        </Card.Root>
        
        <!-- Navigation Buttons -->
        <div class="flex space-x-4">
            <Button.Root variant="outline" href="/dashboard/widgets">
                Back to Widgets
            </Button.Root>
            <Button.Root variant="outline" href="/dashboard/widgets/new">
                Go to Widget Creation
            </Button.Root>
        </div>
    </div>
</DashboardShell>
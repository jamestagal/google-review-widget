<script lang="ts">
    // Get data from the parent load function
    export let data: { user: { id: string, email: string }, apiKey: string | null };
    
    // For testing, use a special test key that works in development mode
    // API Test states
    let apiKey = data.apiKey || 'grw_free_test';
    let placeId = 'ChIJN1t_tDeuEmsRUsoyG83frY4'; // Sydney Opera House as default
    let minRating = 0;
    let maxResults = 5;
    let sortBy = 'recent';
    let forceFresh = false;
    
    // Response states
    let apiResponse: any = null;
    let responseStatus = '';
    let responseTime = 0;
    let isTesting = false;
    
    // Test the reviews API
    async function testReviewsApi() {
        if (!placeId) return;
        
        isTesting = true;
        responseStatus = 'Loading...';
        apiResponse = null;
        
        const startTime = performance.now();
        
        try {
            // Build query parameters
            const params = new URLSearchParams({
                apiKey: apiKey || 'test_key',
                minRating: minRating.toString(),
                maxResults: maxResults.toString(),
                sortBy,
                forceFresh: forceFresh.toString()
            });
            
            // Make the request
            const response = await fetch(`/api/reviews/${placeId}?${params}`);
            const data = await response.json();
            
            // Calculate response time
            const endTime = performance.now();
            responseTime = Math.round(endTime - startTime);
            
            // Update state
            apiResponse = data;
            responseStatus = response.ok ? 'Success' : 'Error';
        } catch (err) {
            console.error('Error testing API:', err);
            responseStatus = 'Error';
            apiResponse = { error: err instanceof Error ? err.message : String(err) };
        } finally {
            isTesting = false;
        }
    }
</script>

<svelte:head>
    <title>Google Places API Testing</title>
</svelte:head>

<div class="container" style="max-width: 1200px; margin: 0 auto; padding: 1rem;">
    <h1>API Testing Dashboard</h1>
    <p>Test your Google Places API integration with real place IDs and review caching.</p>

    <div class="test-controls" style="margin: 2rem 0; padding: 1rem; border: 1px solid #ccc; border-radius: 0.5rem;">
        <h2>Manual API Testing</h2>
        
        <div style="margin-bottom: 1rem;">
            <label for="api-key">API Key</label>
            <input id="api-key" bind:value={apiKey} placeholder="grw_basic_1234567890" style="display: block; width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
            <small>Your widget API key for authentication</small>
        </div>
        
        <div style="margin-bottom: 1rem;">
            <label for="place-id">Google Place ID</label>
            <input id="place-id" bind:value={placeId} placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4" style="display: block; width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
            <small>Default: Sydney Opera House (ChIJN1t_tDeuEmsRUsoyG83frY4)</small>
        </div>
        
        <div style="margin-bottom: 1rem;">
            <label for="min-rating">Minimum Rating (0-5)</label>
            <input id="min-rating" type="number" min="0" max="5" bind:value={minRating} style="display: block; width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
        </div>
        
        <div style="margin-bottom: 1rem;">
            <label for="max-results">Maximum Results</label>
            <input id="max-results" type="number" min="1" max="10" bind:value={maxResults} style="display: block; width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
        </div>
        
        <div style="margin-bottom: 1rem;">
            <label for="sort-by">Sort By</label>
            <select id="sort-by" bind:value={sortBy} style="display: block; width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
            </select>
        </div>
        
        <div style="margin-bottom: 1rem;">
            <label>
                <input type="checkbox" bind:checked={forceFresh}>
                Force Fresh Data (bypass cache)
            </label>
        </div>
        
        <button 
            on:click={testReviewsApi} 
            disabled={isTesting}
            style="background-color: #0047AB; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;"
        >
            {isTesting ? 'Testing...' : 'Test API'}
        </button>
    </div>
    
    {#if responseStatus}
        <div style="padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; background-color: {responseStatus === 'Success' ? '#d1fae5' : responseStatus === 'Loading...' ? '#dbeafe' : '#fee2e2'};">
            <h3>Response Status: {responseStatus}</h3>
            {#if responseTime > 0}
                <p>Response time: {responseTime}ms</p>
            {/if}
        </div>
    {/if}
    
    {#if apiResponse}
        <div style="margin-top: 1rem;">
            <h3>API Response</h3>
            <pre style="background-color: #f1f5f9; padding: 1rem; border-radius: 0.5rem; overflow: auto; max-height: 400px;">{JSON.stringify(apiResponse, null, 2)}</pre>
        </div>
    {/if}
</div>
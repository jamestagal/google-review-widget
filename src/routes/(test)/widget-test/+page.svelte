<script>
    import { onMount } from 'svelte';
    import { PUBLIC_SUPABASE_URL } from '$env/static/public';
    import { Toaster, toast } from '$lib/components/ui/sonner';

    // Get configuration from page data provided by the server
    export let data;
    
    let apiKey = data.apiKey;
    let displayMode = data.displayMode;
    let theme = data.theme;
    let placeId = data.placeId;
    let maxReviews = data.maxReviews;
    let minRating = data.minRating;

    // Track widget loading state for UI display
    let widgetStatus = {
        loaded: false,
        hasError: false,
        errorMessage: ''
    };

    // Initialize widget on mount
    onMount(() => {
        // Create script element for widget
        const script = document.createElement('script');
        script.src = '/widget/widget.min.js';
        script.onload = () => {
            console.log('Widget script loaded successfully');
            widgetStatus.loaded = true;
            toast.success('Widget script loaded');
            
            // Manually initialize the widget after script loads with specific target
            setTimeout(() => {
                if (window.GoogleReviews) {
                    console.log('Initializing GoogleReviews widget');
                    // Initialize with specific target element
                    window.GoogleReviews.init({
                        target: '#google-reviews-widget'
                    });
                } else {
                    console.error('GoogleReviews global object not found');
                }
            }, 250); // Longer delay to ensure DOM is ready
        };
        script.onerror = (e) => {
            console.error('Failed to load widget script:', e);
            widgetStatus.hasError = true;
            widgetStatus.errorMessage = 'Failed to load widget script';
            toast.error('Failed to load widget script');
        };
        document.head.appendChild(script);
    });

    function updateWidgetConfig() {
        // Update URL parameters for history/bookmarking without page reload
        const url = new URL(window.location);
        url.searchParams.set('apiKey', apiKey);
        url.searchParams.set('displayMode', displayMode);
        url.searchParams.set('theme', theme);
        url.searchParams.set('placeId', placeId);
        url.searchParams.set('maxReviews', maxReviews.toString());
        url.searchParams.set('minRating', minRating.toString());
        window.history.pushState({}, '', url);
        
        // Clear the existing widget container
        const container = document.querySelector('.gr-widget');
        if (container) {
            container.innerHTML = '';
            
            // Update data attributes with new configuration
            container.setAttribute('data-gr-place-id', placeId);
            container.setAttribute('data-gr-api-key', apiKey);
            container.setAttribute('data-gr-display-mode', displayMode);
            container.setAttribute('data-gr-theme', theme);
            container.setAttribute('data-gr-max-reviews', maxReviews);
            container.setAttribute('data-gr-min-rating', minRating);
            
            // Reinitialize the widget with new configuration
            if (window.GoogleReviews) {
                console.log('Reinitializing widget with updated configuration');
                window.GoogleReviews.init({
                    target: '#google-reviews-widget'
                });
                toast.success('Widget configuration updated');
            } else {
                toast.error('Widget not available - try refreshing the page');
            }
        } else {
            toast.error('Widget container not found');
        }
    }
</script>

<svelte:head>
    <title>Widget Test Page</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-6xl">
    <Toaster />
    
    <div class="flex flex-col md:flex-row gap-6">
        <!-- Configuration Panel -->
        <div class="md:w-1/3 p-4 border rounded-lg shadow-md bg-card">
            <h2 class="text-xl font-bold mb-4">Widget Configuration</h2>
            
            <div class="space-y-4">
                <div>
                    <label for="apiKey" class="block text-sm font-medium mb-1">API Key</label>
                    <input id="apiKey" bind:value={apiKey} class="w-full p-2 border rounded" />
                </div>
                
                <div>
                    <label for="placeId" class="block text-sm font-medium mb-1">Place ID</label>
                    <input id="placeId" bind:value={placeId} class="w-full p-2 border rounded" />
                </div>
                
                <div>
                    <label for="displayMode" class="block text-sm font-medium mb-1">Display Mode</label>
                    <select id="displayMode" bind:value={displayMode} class="w-full p-2 border rounded">
                        <option value="grid">Grid</option>
                        <option value="carousel">Carousel</option>
                        <option value="list">List</option>
                    </select>
                </div>
                
                <div>
                    <label for="theme" class="block text-sm font-medium mb-1">Theme</label>
                    <select id="theme" bind:value={theme} class="w-full p-2 border rounded">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>
                
                <div>
                    <label for="maxReviews" class="block text-sm font-medium mb-1">Max Reviews</label>
                    <input id="maxReviews" type="number" bind:value={maxReviews} min="1" max="10" class="w-full p-2 border rounded" />
                </div>
                
                <div>
                    <label for="minRating" class="block text-sm font-medium mb-1">Min Rating</label>
                    <input id="minRating" type="number" bind:value={minRating} min="1" max="5" class="w-full p-2 border rounded" />
                </div>
                
                <button on:click={updateWidgetConfig} class="w-full p-2 bg-primary text-primary-foreground rounded">
                    Update Widget
                </button>
            </div>
        </div>
        
        <!-- Widget Display Area -->
        <div class="md:w-2/3">
            <h2 class="text-xl font-bold mb-4">Widget Preview</h2>
            
            {#if widgetStatus.hasError}
                <div class="p-4 bg-destructive text-destructive-foreground rounded">
                    <h3 class="font-bold">Error Loading Widget</h3>
                    <p>{widgetStatus.errorMessage}</p>
                </div>
            {:else if !widgetStatus.loaded}
                <div class="p-4 bg-muted text-muted-foreground rounded">
                    <h3 class="font-bold">Loading Widget...</h3>
                    <p>Please wait while the widget script is being loaded.</p>
                </div>
            {:else}
                <div class="border rounded-lg p-4 bg-card min-h-[400px]">
                    <!-- Debug info -->
                    <div class="mb-4 p-2 bg-muted text-xs">
                        <p class="font-bold">Debug Info:</p>
                        <p>API Key: {apiKey}</p>
                        <p>Place ID: {placeId}</p>
                        <p id="widget-debug-status">Widget status: waiting for initialization...</p>
                    </div>
                    
                    <style>
                        /* Enhanced styling for the widget container */
                        .gr-widget-container {
                            height: 350px;
                            overflow: auto;
                            border-radius: 0.375rem;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                            font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
                        }
                        /* Ensure widget takes full height */
                        .gr-widget {
                            height: 100%;
                        }
                    </style>
                    
                    <!-- Widget container with improved wrapper -->
                    <div class="gr-widget-container">
                        <div
                            id="google-reviews-widget"
                            class="gr-widget"
                            data-gr-place-id={placeId}
                            data-gr-api-key={apiKey}
                            data-gr-display-mode={displayMode}
                            data-gr-theme={theme}
                            data-gr-max-reviews={maxReviews}
                            data-gr-min-rating={minRating}
                        ></div>
                    </div>
                </div>
                
                <!-- Widget embedding code -->
                <div class="mt-6 p-4 border rounded-lg bg-muted">
                    <h3 class="font-bold mb-2">Embedding Code</h3>
                    <pre class="bg-card p-4 rounded overflow-x-auto"><code>&lt;div
  class="gr-widget"
  data-gr-place-id="{placeId}"
  data-gr-api-key="{apiKey}"
  data-gr-display-mode="{displayMode}"
  data-gr-theme="{theme}"
  data-gr-max-reviews="{maxReviews}"
  data-gr-min-rating="{minRating}"
&gt;&lt;/div&gt;
&lt;script src="{PUBLIC_SUPABASE_URL}/static/widget/widget.min.js" async&gt;&lt;/script&gt;</code></pre>
                </div>
            {/if}
        </div>
    </div>
</div>

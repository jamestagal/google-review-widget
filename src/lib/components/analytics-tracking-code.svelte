<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { CopyIcon, CheckIcon } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { PUBLIC_SUPABASE_URL } from "$env/static/public";

  export let widgetId: string;
  export let apiKey: string;
  
  let copied = false;
  
  // Base URL for tracking endpoints
  const baseUrl = PUBLIC_SUPABASE_URL ? PUBLIC_SUPABASE_URL.replace('supabase', 'widget') : 'https://widget.example.com';
  const trackingEndpoint = `${baseUrl}/api/track`;
  const pixelEndpoint = `${baseUrl}/api/track/pixel`;
  const trackingScriptUrl = `${baseUrl}/tracking.js`;
  
  // Generate the tracking code
  function getTrackingCode() {
    const trackingConfig = {
      widgetId,
      apiKey,
      trackingEndpoint,
      pixelEndpoint
    };
    
    return `<!-- Analytics Tracking for Google Reviews Widget -->
<script>
  window.googleReviewsWidgetTracking = ${JSON.stringify(trackingConfig, null, 2)};
</script>
<script src="${trackingScriptUrl}"></script>`;
  }
  
  const trackingCode = getTrackingCode();
  
  function copyToClipboard() {
    navigator.clipboard.writeText(trackingCode).then(() => {
      copied = true;
      toast.success("Copied to clipboard!");
      setTimeout(() => {
        copied = false;
      }, 2000);
    });
  }
</script>

<div class="p-4 bg-white rounded-lg shadow">
  <div class="mb-4">
    <h3 class="text-lg font-semibold mb-2">Analytics Tracking Code</h3>
    <p class="text-sm text-gray-600 mb-4">
      Copy and paste this code into your website to enable analytics tracking for your Google Reviews widget.
    </p>
  </div>
  
  <div class="relative">
    <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto min-h-[150px]"><code>{trackingCode}</code></pre>
    <Button 
      class="absolute top-2 right-2" 
      size="sm" 
      variant="outline"
      on:click={copyToClipboard}
    >
      {#if copied}
        <CheckIcon class="h-4 w-4 text-green-500" />
      {:else}
        <CopyIcon class="h-4 w-4" />
      {/if}
    </Button>
  </div>
  
  <div class="mt-4 text-sm text-gray-600">
    <p>
      This tracking code will help you monitor how your widget is performing. Add it to your website
      right after the widget embed code.
    </p>
  </div>
</div>

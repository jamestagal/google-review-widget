<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import { Button } from '$lib/components/ui/button';
  import { Copy } from 'lucide-svelte';
  import type { WidgetStore } from '$lib/stores/widget-editor-store';
  
  export let widgetStore: WidgetStore;
  
  // Initialize empty strings for display
  let scriptTagForDisplay = '';
  let divTagForDisplay = '';
  
  // Track loading state
  let isLoading = true;
  
  // Track if this component is visible
  let isVisible = false;
  let mountedOnce = false;
  
  // Generate the embed code when needed
  function generateEmbedCode(widgetId: string | undefined) {
    if (!browser || !widgetId) return;
    
    // Generate raw code without escaping
    const origin = window.location.origin;
    // Using string concatenation to avoid nested template literal issues with <script> tags
    const scriptTag = '<script src="' + origin + '/widget/' + widgetId + '.js" async defer><\/script>';
    const divTag = '<div id="google-reviews-widget-' + widgetId + '" class="google-reviews-widget"></div>';
    
    // Store the escaped HTML for display
    scriptTagForDisplay = scriptTag
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    divTagForDisplay = divTag
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  
  function copyScriptTag() {
    const widgetId = $widgetStore.id;
    if (!browser || !widgetId) return;
    
    // Using string concatenation to avoid template literal issues
    const scriptText = '<script src="' + window.location.origin + '/widget/' + widgetId + '.js" async defer><\/script>';
    navigator.clipboard.writeText(scriptText);
  }
  
  function copyDivTag() {
    const widgetId = $widgetStore.id;
    if (!browser || !widgetId) return;
    
    const divText = '<div id="google-reviews-widget-' + widgetId + '" class="google-reviews-widget"></div>';
    navigator.clipboard.writeText(divText);
  }
  
  // Handle initial load and delayed code generation
  onMount(() => {
    mountedOnce = true;
    
    // Simulate a short delay before generating the code
    // This ensures component mounting doesn't block the main thread
    const timerId = setTimeout(() => {
      generateEmbedCode($widgetStore.id);
      isLoading = false;
    }, 100);
    
    return () => {
      clearTimeout(timerId);
    };
  });
  
  // This function will be called by the TabsContent component when this tab becomes visible
  export function onTabShow() {
    isVisible = true;
    if (mountedOnce && !scriptTagForDisplay && $widgetStore.id) {
      // Generate code if it hasn't been generated yet
      generateEmbedCode($widgetStore.id);
    }
  }
  
  // Watch for widget ID changes, but only regenerate code if the tab is visible
  $: if (browser && isVisible && $widgetStore.id && mountedOnce) {
    generateEmbedCode($widgetStore.id);
  }
</script>

<div class="space-y-6">
  <div>
    <h3 class="text-lg font-medium mb-2">Embed Instructions</h3>
    <p class="text-sm text-muted-foreground">
      Copy and paste these code snippets into your website to display your Google Reviews widget.
    </p>
  </div>
  
  <Separator />
  
  {#if isLoading}
    <div class="py-8 flex justify-center">
      <div class="flex flex-col items-center space-y-4">
        <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        <p class="text-sm text-muted-foreground">Generating embed code...</p>
      </div>
    </div>
  {:else}
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <Label for="script-code">1. Add this script to your &lt;head&gt; or before &lt;/body&gt;</Label>
        <Button 
          variant="ghost" 
          size="sm" 
          class="h-8 px-2" 
          on:click={copyScriptTag}
          disabled={!$widgetStore.id}
        >
          <Copy class="h-4 w-4 mr-1" />
          Copy
        </Button>
      </div>
      <pre class="bg-muted p-3 rounded-md relative font-mono text-sm overflow-x-auto">{scriptTagForDisplay}</pre>
    </div>
    
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <Label for="div-code">2. Add this div where you want the widget to appear</Label>
        <Button 
          variant="ghost" 
          size="sm" 
          class="h-8 px-2" 
          on:click={copyDivTag}
          disabled={!$widgetStore.id}
        >
          <Copy class="h-4 w-4 mr-1" />
          Copy
        </Button>
      </div>
      <pre class="bg-muted p-3 rounded-md relative font-mono text-sm overflow-x-auto">{divTagForDisplay}</pre>
    </div>
    
    <Separator />
    
    <div class="space-y-2">
      <h4 class="font-medium">Domain Information</h4>
      <p class="text-sm text-muted-foreground">
        This widget can be embedded on any domain. For domain restrictions, please contact support.
      </p>
    </div>
  {/if}
</div>
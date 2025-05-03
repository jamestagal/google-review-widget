<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Switch } from "$lib/components/ui/switch";
  import { CopyIcon, CheckIcon } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { onMount } from "svelte";
  import { PUBLIC_SUPABASE_URL } from "$env/static/public";
  import { 
    generateHtmlEmbed, 
    generateWordPressEmbed, 
    generateReactEmbed, 
    generateVueEmbed,
    generateShopifyEmbed,
    generateWixEmbed,
    generateSquarespaceEmbed,
    type WidgetConfig,
    type EmbedOptions
  } from "$lib/embed-code";

  // Props
  export let widgetId: string;
  export let apiKey: string;
  export let widgetConfig: WidgetConfig = {};
  
  // State
  let activeTab = "standard";
  let selectedPlatform = "html";
  let selectedFramework = "react";
  let isResponsive = true;
  let customWidth = "100%";
  let customHeight = "600px";
  let hostUrl = "";
  
  let copied = {
    standard: false,
    platform: false,
    framework: false
  };

  // Base URL for widget and tracking endpoints
  const baseUrl = PUBLIC_SUPABASE_URL ? PUBLIC_SUPABASE_URL.replace('supabase', 'widget') : 'https://widget.example.com';
  const trackingEndpoint = `${baseUrl}/api/track`;
  const pixelEndpoint = `${baseUrl}/api/track/pixel`;

  // Get the host URL
  onMount(() => {
    hostUrl = window.location.origin;
  });

  // Embed options
  $: embedOptions = {
    widgetId,
    apiKey,
    widgetConfig,
    baseUrl,
    trackingEndpoint,
    pixelEndpoint,
    isResponsive,
    width: customWidth,
    height: customHeight
  };

  // Generate embed codes
  $: standardEmbedCode = generateHtmlEmbed(embedOptions);
  
  // Generate platform-specific code
  $: platformCode = (() => {
    switch (selectedPlatform) {
      case "wordpress":
        return generateWordPressEmbed(embedOptions);
      case "shopify":
        return generateShopifyEmbed(embedOptions);
      case "wix":
        return generateWixEmbed(embedOptions);
      case "squarespace":
        return generateSquarespaceEmbed(embedOptions);
      default:
        return generateHtmlEmbed(embedOptions);
    }
  })();
  
  // Generate framework-specific code
  $: frameworkCode = (() => {
    switch (selectedFramework) {
      case "react":
        return generateReactEmbed(embedOptions);
      case "vue":
        return generateVueEmbed(embedOptions);
      default:
        return generateHtmlEmbed(embedOptions);
    }
  })();

  function copyToClipboard(type: 'standard' | 'platform' | 'framework') {
    const codeMap = {
      standard: standardEmbedCode,
      platform: platformCode,
      framework: frameworkCode
    };

    navigator.clipboard.writeText(codeMap[type]).then(() => {
      copied[type] = true;
      toast.success("Copied to clipboard!");
      setTimeout(() => {
        copied[type] = false;
      }, 2000);
    });
  }
</script>

<div class="p-4 bg-white rounded-lg shadow">
  <div class="mb-4">
    <h3 class="text-lg font-semibold mb-2">Embed Code</h3>
    <p class="text-sm text-gray-600 mb-4">
      Copy and paste this code into your website to display your Google Reviews widget.
    </p>
  </div>
  
  <Tabs value={activeTab} onValueChange={(value) => activeTab = value} class="w-full">
    <TabsList class="grid grid-cols-3 mb-4">
      <TabsTrigger value="standard">Standard HTML</TabsTrigger>
      <TabsTrigger value="platform">CMS Platforms</TabsTrigger>
      <TabsTrigger value="framework">Frameworks</TabsTrigger>
    </TabsList>
    
    <!-- Standard HTML Embed Code -->
    <TabsContent value="standard" class="relative">
      <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto min-h-[250px]"><code>{standardEmbedCode}</code></pre>
      <Button 
        class="absolute top-2 right-2" 
        size="sm" 
        variant="outline"
        on:click={() => copyToClipboard('standard')}
      >
        {#if copied.standard}
          <CheckIcon class="h-4 w-4 text-green-500" />
        {:else}
          <CopyIcon class="h-4 w-4" />
        {/if}
      </Button>
    </TabsContent>
    
    <!-- Platform-specific Embed Code -->
    <TabsContent value="platform" class="space-y-4">
      <div class="grid grid-cols-1 gap-4">
        <div class="space-y-2">
          <Label for="platform">Select Platform</Label>
          <Select value={selectedPlatform} onValueChange={(value) => selectedPlatform = value}>
            <SelectTrigger>
              <SelectValue placeholder="Select a platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="wordpress">WordPress</SelectItem>
              <SelectItem value="shopify">Shopify</SelectItem>
              <SelectItem value="wix">Wix</SelectItem>
              <SelectItem value="squarespace">Squarespace</SelectItem>
            </SelectContent>
          </Select>
          
          <div class="flex items-center gap-2 mt-2">
            <Label for="platform-responsive" class="text-sm">Responsive</Label>
            <Switch id="platform-responsive" checked={isResponsive} on:change={() => isResponsive = !isResponsive} />
          </div>
          
          {#if !isResponsive}
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="platform-width">Width</Label>
                <Input id="platform-width" bind:value={customWidth} placeholder="e.g., 100%, 500px" />
              </div>
              <div class="space-y-2">
                <Label for="platform-height">Height</Label>
                <Input id="platform-height" bind:value={customHeight} placeholder="e.g., 600px" />
              </div>
            </div>
          {/if}
        </div>
        
        <div class="relative">
          <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto min-h-[250px]"><code>{platformCode}</code></pre>
          <Button 
            class="absolute top-2 right-2" 
            size="sm" 
            variant="outline"
            on:click={() => copyToClipboard('platform')}
          >
            {#if copied.platform}
              <CheckIcon class="h-4 w-4 text-green-500" />
            {:else}
              <CopyIcon class="h-4 w-4" />
            {/if}
          </Button>
        </div>
      </div>
    </TabsContent>
    
    <!-- Framework-specific Embed Code -->
    <TabsContent value="framework" class="space-y-4">
      <div class="grid grid-cols-1 gap-4">
        <div class="space-y-2">
          <Label for="framework">Select Framework</Label>
          <Select value={selectedFramework} onValueChange={(value) => selectedFramework = value}>
            <SelectTrigger>
              <SelectValue placeholder="Select a framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="vue">Vue</SelectItem>
            </SelectContent>
          </Select>
          
          <div class="flex items-center gap-2 mt-2">
            <Label for="framework-responsive" class="text-sm">Responsive</Label>
            <Switch id="framework-responsive" checked={isResponsive} on:change={() => isResponsive = !isResponsive} />
          </div>
          
          {#if !isResponsive}
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="framework-width">Width</Label>
                <Input id="framework-width" bind:value={customWidth} placeholder="e.g., 100%, 500px" />
              </div>
              <div class="space-y-2">
                <Label for="framework-height">Height</Label>
                <Input id="framework-height" bind:value={customHeight} placeholder="e.g., 600px" />
              </div>
            </div>
          {/if}
        </div>
        
        <div class="relative">
          <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto min-h-[250px]"><code>{frameworkCode}</code></pre>
          <Button 
            class="absolute top-2 right-2" 
            size="sm" 
            variant="outline"
            on:click={() => copyToClipboard('framework')}
          >
            {#if copied.framework}
              <CheckIcon class="h-4 w-4 text-green-500" />
            {:else}
              <CopyIcon class="h-4 w-4" />
            {/if}
          </Button>
        </div>
      </div>
    </TabsContent>
  </Tabs>
  
  <div class="mt-4 text-sm text-gray-600">
    <p>
      This embed code will display your Google Reviews widget on your website. Make sure to include it in a visible area of your page.
    </p>
    <p class="mt-2">
      For analytics tracking, use the Analytics Tracking Code generator to get a separate tracking snippet.
    </p>
  </div>
</div>

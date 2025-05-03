<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
    import { Switch } from '$lib/components/ui/switch';
    import { Check, Code, Monitor, Smartphone, Globe, Copy } from 'lucide-svelte';
    import { toast } from 'svelte-sonner';
    import { onMount } from 'svelte';
    
    // Props
    export let widgetId: string;
    export let widgetName: string = 'Widget';
    
    // State
    let copied = false;
    let selectedTab = 'standard';
    let selectedPlatform = 'html';
    let isAsync = true;
    let isResponsive = true;
    let customWidth = '100%';
    let customHeight = '600px';
    let hostUrl = '';
    
    // Get the host URL
    onMount(() => {
        hostUrl = window.location.origin;
    });
    
    // Generate embed codes based on options
    $: standardEmbedCode = generateStandardEmbedCode(widgetId, hostUrl, isAsync, isResponsive, customWidth, customHeight);
    $: javascriptEmbedCode = generateJavaScriptEmbedCode(widgetId, hostUrl, isAsync, isResponsive, customWidth, customHeight);
    $: platformSpecificCode = generatePlatformSpecificCode(selectedPlatform, widgetId, hostUrl, isAsync, isResponsive, customWidth, customHeight);
    $: frameworkCode = generateFrameworkCode(selectedPlatform, widgetId, hostUrl, isAsync, isResponsive, customWidth, customHeight);
    
    // Helper function to generate standard embed code
    function generateStandardEmbedCode(widgetId: string, hostUrl: string, isAsync: boolean, isResponsive: boolean, width: string, height: string) {
        const asyncAttr = isAsync ? ' async' : '';
        const styleAttr = isResponsive 
            ? ' style="width: 100%; max-width: 100%; height: auto; min-height: 400px;"' 
            : ` style="width: ${width}; height: ${height};"`;
        
        return `<script src="${hostUrl}/embed/${widgetId}.js"${asyncAttr}><\/script>
<div id="google-review-widget-${widgetId}"${styleAttr}></div>`;
    }
    
    // Helper function to generate JavaScript embed code
    function generateJavaScriptEmbedCode(widgetId: string, hostUrl: string, isAsync: boolean, isResponsive: boolean, width: string, height: string) {
        const styleAttr = isResponsive 
            ? 'width: 100%; max-width: 100%; height: auto; min-height: 400px;' 
            : `width: ${width}; height: ${height};`;
        
        return `// Add this code to your JavaScript file
(function() {
    // Create script element
    var script = document.createElement('script');
    script.src = "${hostUrl}/embed/${widgetId}.js";
    script.${isAsync ? 'async = true' : 'defer = true'};
    
    // Create container element
    var container = document.createElement('div');
    container.id = "google-review-widget-${widgetId}";
    container.style = "${styleAttr}";
    
    // Append elements to the document
    document.head.appendChild(script);
    document.getElementById('widget-container').appendChild(container);
})();`;
    }
    
    // Helper function to generate platform-specific code
    function generatePlatformSpecificCode(platform: string, widgetId: string, hostUrl: string, isAsync: boolean, isResponsive: boolean, width: string, height: string) {
        const asyncAttr = isAsync ? ' async' : '';
        const styleAttr = isResponsive 
            ? 'width: 100%; max-width: 100%; height: auto; min-height: 400px;' 
            : `width: ${width}; height: ${height};`;
        
        switch (platform) {
            case 'wordpress':
                return `// Add this shortcode to your WordPress page or post
[google_review_widget id="${widgetId}" responsive="${isResponsive ? 'true' : 'false'}" width="${width}" height="${height}"]

// Or add this code to your WordPress theme's functions.php file
function google_review_widget_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => '${widgetId}',
        'responsive' => '${isResponsive ? 'true' : 'false'}',
        'width' => '${width}',
        'height' => '${height}'
    ), $atts);
    
    $style = $atts['responsive'] === 'true' 
        ? 'width: 100%; max-width: 100%; height: auto; min-height: 400px;' 
        : "width: {$atts['width']}; height: {$atts['height']};";
    
    return '<script src="${hostUrl}/embed/' . $atts['id'] . '.js"${asyncAttr}><\/script>
<div id="google-review-widget-' . $atts['id'] . '" style="' . $style . '"></div>';
}
add_shortcode('google_review_widget', 'google_review_widget_shortcode');`;
                
            case 'shopify':
                return `<!-- Add this code to your Shopify theme -->
<div class="google-review-widget-container">
  {% raw %}
  <script src="${hostUrl}/embed/${widgetId}.js"${asyncAttr}><\/script>
  <div id="google-review-widget-${widgetId}" style="${styleAttr}"></div>
  {% endraw %}
</div>

<!-- Add this to your theme.scss.liquid file for responsive styling -->
.google-review-widget-container {
  margin: 20px 0;
  width: 100%;
}`;
                
            case 'wix':
                return `<!-- Add this HTML code to your Wix site using the HTML Code element -->
<div>
  <script src="${hostUrl}/embed/${widgetId}.js"${asyncAttr}><\/script>
  <div id="google-review-widget-${widgetId}" style="${styleAttr}"></div>
</div>`;
                
            case 'squarespace':
                return `<!-- Add this code block to your Squarespace site -->
<div class="sqs-block code-block">
  <div class="sqs-block-content">
    <script src="${hostUrl}/embed/${widgetId}.js"${asyncAttr}><\/script>
    <div id="google-review-widget-${widgetId}" style="${styleAttr}"></div>
  </div>
</div>`;
                
            default:
                return standardEmbedCode;
        }
    }
    
    // Helper function to generate framework-specific code
    function generateFrameworkCode(framework: string, widgetId: string, hostUrl: string, isAsync: boolean, isResponsive: boolean, width: string, height: string) {
        const styleAttr = isResponsive 
            ? 'width: 100%; max-width: 100%; height: auto; min-height: 400px;' 
            : `width: ${width}; height: ${height};`;
        
        switch (framework) {
            case 'react':
                return `// React Component
import React, { useEffect, useRef } from 'react';

const GoogleReviewWidget = () => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Create and load the script
    const script = document.createElement('script');
    script.src = "${hostUrl}/embed/${widgetId}.js";
    script.${isAsync ? 'async = true' : 'defer = true'};
    document.head.appendChild(script);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(script);
    };
  }, []);
  
  return (
    <div 
      id="google-review-widget-${widgetId}" 
      ref={containerRef}
      style={{ ${styleAttr} }}
    />
  );
};

export default GoogleReviewWidget;`;
                
            case 'vue':
                return `<!-- Vue Component -->
<template>
  <div :id="widgetContainerId" :style="containerStyle"></div>
</template>

<script>
export default {
  name: 'GoogleReviewWidget',
  data() {
    return {
      widgetId: '${widgetId}',
      widgetContainerId: 'google-review-widget-${widgetId}',
      isResponsive: ${isResponsive},
      customWidth: '${width}',
      customHeight: '${height}'
    };
  },
  computed: {
    containerStyle() {
      return this.isResponsive
        ? 'width: 100%; max-width: 100%; height: auto; min-height: 400px;'
        : \`width: \${this.customWidth}; height: \${this.customHeight};\`;
    }
  },
  mounted() {
    const script = document.createElement('script');
    script.src = "${hostUrl}/embed/${widgetId}.js";
    script.${isAsync ? 'async = true' : 'defer = true'};
    document.head.appendChild(script);
  },
  beforeDestroy() {
    // Find and remove the script when component is destroyed
    const scripts = document.head.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src.includes('${widgetId}.js')) {
        document.head.removeChild(scripts[i]);
        break;
      }
    }
  }
}
<\/script>`;
                
            case 'angular':
                return `// Angular Component
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-google-review-widget',
  template: \`
    <div 
      id="google-review-widget-${widgetId}" 
      [style]="containerStyle">
    </div>
  \`
})
export class GoogleReviewWidgetComponent implements OnInit, OnDestroy {
  private widgetId = '${widgetId}';
  private scriptElement: HTMLScriptElement;
  private isResponsive = ${isResponsive};
  private customWidth = '${width}';
  private customHeight = '${height}';
  
  get containerStyle(): string {
    return this.isResponsive
      ? 'width: 100%; max-width: 100%; height: auto; min-height: 400px;'
      : \`width: \${this.customWidth}; height: \${this.customHeight};\`;
  }
  
  ngOnInit() {
    this.scriptElement = document.createElement('script');
    this.scriptElement.src = "${hostUrl}/embed/${widgetId}.js";
    this.scriptElement.${isAsync ? 'async = true' : 'defer = true'};
    document.head.appendChild(this.scriptElement);
  }
  
  ngOnDestroy() {
    if (this.scriptElement) {
      document.head.removeChild(this.scriptElement);
    }
  }
}`;
                
            case 'svelte':
                return `<!-- Svelte Component -->
<script>
  import { onMount, onDestroy } from 'svelte';
  
  let scriptElement;
  const widgetId = '${widgetId}';
  const isResponsive = ${isResponsive};
  const customWidth = '${width}';
  const customHeight = '${height}';
  
  $: containerStyle = isResponsive
    ? 'width: 100%; max-width: 100%; height: auto; min-height: 400px;'
    : \`width: \${customWidth}; height: \${customHeight};\`;
  
  onMount(() => {
    scriptElement = document.createElement('script');
    scriptElement.src = "${hostUrl}/embed/${widgetId}.js";
    scriptElement.${isAsync ? 'async = true' : 'defer = true'};
    document.head.appendChild(scriptElement);
  });
  
  onDestroy(() => {
    if (scriptElement && document.head.contains(scriptElement)) {
      document.head.removeChild(scriptElement);
    }
  });
<\/script>

<div id="google-review-widget-{widgetId}" style={containerStyle}></div>`;
                
            default:
                return standardEmbedCode;
        }
    }
    
    // Copy code to clipboard
    function copyToClipboard(code) {
        navigator.clipboard.writeText(code)
            .then(() => {
                copied = true;
                toast.success('Code copied to clipboard!');
                setTimeout(() => {
                    copied = false;
                }, 2000);
            })
            .catch(() => {
                toast.error('Failed to copy code');
            });
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">Embed Code for {widgetName}</h3>
        <div class="flex items-center gap-2">
            <Label for="async" class="text-sm">Async Loading</Label>
            <Switch id="async" checked={isAsync} on:change={() => isAsync = !isAsync} />
        </div>
    </div>
    
    <Tabs value={selectedTab} onValueChange={(value) => selectedTab = value}>
        <TabsList class="grid grid-cols-4">
            <TabsTrigger value="standard" class="flex items-center gap-2">
                <Code class="h-4 w-4" />
                <span>Standard</span>
            </TabsTrigger>
            <TabsTrigger value="javascript" class="flex items-center gap-2">
                <Globe class="h-4 w-4" />
                <span>JavaScript</span>
            </TabsTrigger>
            <TabsTrigger value="platforms" class="flex items-center gap-2">
                <Monitor class="h-4 w-4" />
                <span>Platforms</span>
            </TabsTrigger>
            <TabsTrigger value="frameworks" class="flex items-center gap-2">
                <Smartphone class="h-4 w-4" />
                <span>Frameworks</span>
            </TabsTrigger>
        </TabsList>
        
        <!-- Standard Embed Code -->
        <TabsContent value="standard" class="space-y-4">
            <div class="grid grid-cols-1 gap-4">
                <div class="space-y-2">
                    <div class="flex items-center gap-2">
                        <Label for="responsive" class="text-sm">Responsive</Label>
                        <Switch id="responsive" checked={isResponsive} on:change={() => isResponsive = !isResponsive} />
                    </div>
                    
                    {#if !isResponsive}
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label for="width">Width</Label>
                                <Input id="width" bind:value={customWidth} placeholder="e.g., 100%, 500px" />
                            </div>
                            <div class="space-y-2">
                                <Label for="height">Height</Label>
                                <Input id="height" bind:value={customHeight} placeholder="e.g., 600px" />
                            </div>
                        </div>
                    {/if}
                </div>
                
                <div class="relative">
                    <pre class="bg-muted p-4 rounded-md overflow-x-auto min-h-[150px]"><code>{standardEmbedCode}</code></pre>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        class="absolute top-2 right-2"
                        on:click={() => copyToClipboard(standardEmbedCode)}
                    >
                        {#if copied}
                            <Check class="h-4 w-4" />
                        {:else}
                            <Copy class="h-4 w-4" />
                        {/if}
                    </Button>
                </div>
            </div>
        </TabsContent>
        
        <!-- JavaScript Embed Code -->
        <TabsContent value="javascript" class="space-y-4">
            <div class="grid grid-cols-1 gap-4">
                <div class="space-y-2">
                    <div class="flex items-center gap-2">
                        <Label for="js-responsive" class="text-sm">Responsive</Label>
                        <Switch id="js-responsive" checked={isResponsive} on:change={() => isResponsive = !isResponsive} />
                    </div>
                    
                    {#if !isResponsive}
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label for="js-width">Width</Label>
                                <Input id="js-width" bind:value={customWidth} placeholder="e.g., 100%, 500px" />
                            </div>
                            <div class="space-y-2">
                                <Label for="js-height">Height</Label>
                                <Input id="js-height" bind:value={customHeight} placeholder="e.g., 600px" />
                            </div>
                        </div>
                    {/if}
                </div>
                
                <div class="relative">
                    <pre class="bg-muted p-4 rounded-md overflow-x-auto min-h-[150px]"><code>{javascriptEmbedCode}</code></pre>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        class="absolute top-2 right-2"
                        on:click={() => copyToClipboard(javascriptEmbedCode)}
                    >
                        {#if copied}
                            <Check class="h-4 w-4" />
                        {:else}
                            <Copy class="h-4 w-4" />
                        {/if}
                    </Button>
                </div>
            </div>
        </TabsContent>
        
        <!-- Platform-specific Embed Code -->
        <TabsContent value="platforms" class="space-y-4">
            <div class="grid grid-cols-1 gap-4">
                <div class="space-y-2">
                    <Label for="platform">Select Platform</Label>
                    <Select value={selectedPlatform} onValueChange={(value) => selectedPlatform = value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                        <SelectContent>
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
                    <pre class="bg-muted p-4 rounded-md overflow-x-auto min-h-[150px]"><code>{platformSpecificCode}</code></pre>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        class="absolute top-2 right-2"
                        on:click={() => copyToClipboard(platformSpecificCode)}
                    >
                        {#if copied}
                            <Check class="h-4 w-4" />
                        {:else}
                            <Copy class="h-4 w-4" />
                        {/if}
                    </Button>
                </div>
            </div>
        </TabsContent>
        
        <!-- Framework-specific Embed Code -->
        <TabsContent value="frameworks" class="space-y-4">
            <div class="grid grid-cols-1 gap-4">
                <div class="space-y-2">
                    <Label for="framework">Select Framework</Label>
                    <Select value={selectedPlatform} onValueChange={(value) => selectedPlatform = value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a framework" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="react">React</SelectItem>
                            <SelectItem value="vue">Vue</SelectItem>
                            <SelectItem value="angular">Angular</SelectItem>
                            <SelectItem value="svelte">Svelte</SelectItem>
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
                    <pre class="bg-muted p-4 rounded-md overflow-x-auto min-h-[150px]"><code>{frameworkCode}</code></pre>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        class="absolute top-2 right-2"
                        on:click={() => copyToClipboard(frameworkCode)}
                    >
                        {#if copied}
                            <Check class="h-4 w-4" />
                        {:else}
                            <Copy class="h-4 w-4" />
                        {/if}
                    </Button>
                </div>
            </div>
        </TabsContent>
    </Tabs>
</div>

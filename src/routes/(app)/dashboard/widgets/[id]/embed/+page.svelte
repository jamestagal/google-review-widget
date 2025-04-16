<!-- src/routes/dashboard/widgets/[id]/embed/+page.svelte -->
<script lang="ts">
    import { page } from '$app/stores';
    import DashboardShell from '../../../../components/dashboard-shell.svelte';
    import * as Card from '$lib/components/ui/card';
    import * as Tabs from '$lib/components/ui/tabs';
    import CopyButton from '$lib/components/ui/copy-button.svelte';
    import WidgetPreview from '$lib/components/widget/preview.svelte';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    
    export let data;
    
    const { widget, placeDetails, reviews } = data;
    
    // Initialize with default values for SSR
    let snippetCode = '';
    let attributeCode = '';
    let iframeCode = '';
    
    // Domain for API URL (dynamically determined)
    let apiDomain = 'https://example.com'; // Default for SSR
    
    onMount(() => {
      // Get the current domain for the API URL - only runs in browser
      if (browser) {
        apiDomain = window.location.origin;
        updateEmbedCodes();
      }
    });
    
    function updateEmbedCodes() {
      // JavaScript snippet approach - use template strings that don't reference window directly in the code
      snippetCode = `<${'script'}>
    // Initialize the global object
    var __gr = __gr || {};
    __gr.apiKey = "${widget.api_key}";
    __gr.displayMode = "${widget.display_type}";
    __gr.theme = "${widget.theme}";
    __gr.minRating = ${widget.filters?.minRating || 0};
    (function(w,d,s,o){
      var j=d.createElement(s);j.async=true;j.src='${apiDomain}/widget/widget.min.js';
      d.head.appendChild(j);
      if(!w.__gr.asyncInit) j.onload = function(){ w.GoogleReviews.init() };
    })(window,document,'script');
  </${'script'}>
  <div id="google-reviews"></div>`;
      
      // HTML attribute approach
      attributeCode = `<div 
    data-googlereviews="${widget.api_key}"
    data-display="${widget.display_type}" 
    data-theme="${widget.theme}"
    data-min-rating="${widget.filters?.minRating || 0}"
  ></div>
  <${'script'} src="${apiDomain}/widget/widget.min.js"></${'script'}>`;
  
      // iframe approach
      iframeCode = `<iframe 
    src="${apiDomain}/embed/${widget.api_key}" 
    style="border:0; width:100%; height:400px;" 
    title="Google Reviews"
  ></iframe>`;
    }
    
    // Initialize embed codes with default domain for SSR
    updateEmbedCodes();
  </script>
  
  <DashboardShell>
    <div class="container max-w-6xl mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Embed {widget.name}</h1>
        <a href="/dashboard/widgets/{$page.params.id}" class="text-primary hover:underline">
          ← Back to Widget
        </a>
      </div>
      
      <div class="grid md:grid-cols-2 gap-8">
        <!-- Preview Section -->
        <div>
          <Card.Root>
            <Card.Header>
              <Card.Title>Widget Preview</Card.Title>
              <Card.Description>Here's how your widget will appear on your website</Card.Description>
            </Card.Header>
            <Card.Content>
              <WidgetPreview 
                placeData={placeDetails} 
                reviews={reviews} 
                settings={{
                  displayMode: widget.display_type,
                  theme: widget.theme,
                  maxReviews: widget.display?.reviewLimit || 5,
                  minRating: widget.filters?.minRating || 0
                }}
              />
            </Card.Content>
          </Card.Root>
        </div>
        
        <!-- Embed Code Section -->
        <div>
          <Card.Root>
            <Card.Header>
              <Card.Title>Embed Your Widget</Card.Title>
              <Card.Description>
                Choose how you want to embed this widget on your website
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <Tabs.Root>
                <Tabs.List class="grid grid-cols-3">
                  <Tabs.Trigger value="javascript">JavaScript</Tabs.Trigger>
                  <Tabs.Trigger value="html">HTML</Tabs.Trigger>
                  <Tabs.Trigger value="iframe">iFrame</Tabs.Trigger>
                </Tabs.List>
                
                <Tabs.Content value="javascript" class="pt-4">
                  <h3 class="text-sm font-medium mb-2">JavaScript Snippet (Recommended)</h3>
                  <p class="text-sm text-muted-foreground mb-3">
                    This method provides the best performance and flexibility.
                  </p>
                  <div class="relative">
                    <pre class="p-4 bg-slate-100 rounded-md text-xs overflow-x-auto">{snippetCode}</pre>
                    <div class="absolute top-2 right-2">
                      <CopyButton text={snippetCode} />
                    </div>
                  </div>
                </Tabs.Content>
                
                <Tabs.Content value="html" class="pt-4">
                  <h3 class="text-sm font-medium mb-2">HTML Attributes</h3>
                  <p class="text-sm text-muted-foreground mb-3">
                    Simple implementation with HTML data attributes.
                  </p>
                  <div class="relative">
                    <pre class="p-4 bg-slate-100 rounded-md text-xs overflow-x-auto">{attributeCode}</pre>
                    <div class="absolute top-2 right-2">
                      <CopyButton text={attributeCode} />
                    </div>
                  </div>
                </Tabs.Content>
                
                <Tabs.Content value="iframe" class="pt-4">
                  <h3 class="text-sm font-medium mb-2">iFrame Embed</h3>
                  <p class="text-sm text-muted-foreground mb-3">
                    Use this if you can't add JavaScript to your site.
                  </p>
                  <div class="relative">
                    <pre class="p-4 bg-slate-100 rounded-md text-xs overflow-x-auto">{iframeCode}</pre>
                    <div class="absolute top-2 right-2">
                      <CopyButton text={iframeCode} />
                    </div>
                  </div>
                </Tabs.Content>
              </Tabs.Root>
            </Card.Content>
            <Card.Footer>
              <div class="bg-amber-50 border-l-4 border-amber-500 p-4 text-sm text-amber-700">
                <p><strong>Important:</strong> The widget will only work on domains you've authorized in your widget settings.</p>
              </div>
            </Card.Footer>
          </Card.Root>
        </div>
      </div>
      
      <!-- Additional Instructions -->
      <Card.Root class="mt-8">
        <Card.Header>
          <Card.Title>Implementation Tips</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="grid md:grid-cols-3 gap-6">
            <div>
              <h3 class="text-lg font-medium mb-2">Website Placement</h3>
              <p class="text-sm text-muted-foreground">
                For best results, place your widget on high-traffic pages like your homepage or testimonials page. You can add it to multiple pages using the same embed code.
              </p>
            </div>
            
            <div>
              <h3 class="text-lg font-medium mb-2">Customization</h3>
              <p class="text-sm text-muted-foreground">
                You can customize your widget's appearance by changing the display mode, theme, and filters in your widget settings. All changes will be reflected in the embed code automatically.
              </p>
            </div>
            
            <div>
              <h3 class="text-lg font-medium mb-2">Troubleshooting</h3>
              <p class="text-sm text-muted-foreground">
                If your widget isn't appearing, check that the domain you're embedding on is in your allowed domains list. You can update this in your widget settings.
              </p>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </DashboardShell>
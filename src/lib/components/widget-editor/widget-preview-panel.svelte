<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { WidgetStore } from '$lib/stores/widget-editor-store';
  
  // Accept the widget store as a prop
  export let widgetStore: WidgetStore;
  
  let isLoading = true;
  let showPreview = false;
  let error: string | null = null;
  
  // Default values for preview config in case store data is incomplete
  const defaultPreviewConfig = {
    placeId: '',
    displayMode: 'grid',
    theme: 'light',
    maxReviews: 5,
    minRating: 0,
    showRatings: true,
    showDates: true,
    showPhotos: true,
    colors: {
      background: '#ffffff',
      text: '#333333',
      stars: '#FFD700',
      links: '#0070f3',
      buttons: '#0070f3',
      border: '#e5e7eb',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    fonts: {
      family: 'system-ui, -apple-system, sans-serif',
      titleSize: '18px',
      textSize: '14px',
      weight: 'normal'
    },
    layout: {
      padding: '16px',
      borderRadius: '8px',
      spacing: '16px',
      maxHeight: '600px',
      width: '100%'
    },
    sortBy: 'newest',
    maxReviewAge: 365
  };
  
  // Local references to avoid undefined errors
  let previewConfig = { ...defaultPreviewConfig };
  let businessName = 'Your Business';
  
  // Initialize from store data
  onMount(() => {
    if (browser) {
      try {
        // Log for debugging
        console.log("Widget store in preview panel:", $widgetStore);
        
        // Set a short timeout to ensure the store is ready
        setTimeout(() => {
          try {
            // Get preview config from store or use defaults
            previewConfig = $widgetStore?.previewConfig 
              ? { ...defaultPreviewConfig, ...$widgetStore.previewConfig }
              : { ...defaultPreviewConfig };
              
            // Get business name from store or use default
            businessName = $widgetStore?.business_profiles?.business_name || 'Your Business';
            
            // Make sure all nested objects exist
            previewConfig.colors = previewConfig.colors || defaultPreviewConfig.colors;
            previewConfig.fonts = previewConfig.fonts || defaultPreviewConfig.fonts;
            previewConfig.layout = previewConfig.layout || defaultPreviewConfig.layout;
            
            // Log the preview configuration for debugging
            console.log("Preview configuration:", previewConfig);
            
            // Successfully initialized, show preview
            isLoading = false;
            showPreview = true;
            error = null;
          } catch (e) {
            console.error("Error initializing preview:", e);
            isLoading = false;
            error = e instanceof Error ? e.message : "Failed to initialize preview";
          }
        }, 300);
      } catch (e) {
        console.error("Error in onMount:", e);
        isLoading = false;
        error = "Error setting up preview";
      }
    }
  });
  
  // Safe reactive update when store changes
  $: if (browser && !isLoading && $widgetStore) {
    try {
      // Update previewConfig from store if available
      if ($widgetStore.previewConfig) {
        previewConfig = {
          ...defaultPreviewConfig,
          ...$widgetStore.previewConfig,
          // Ensure nested objects exist
          colors: {
            ...defaultPreviewConfig.colors,
            ...$widgetStore.previewConfig.colors
          },
          fonts: {
            ...defaultPreviewConfig.fonts,
            ...$widgetStore.previewConfig.fonts
          },
          layout: {
            ...defaultPreviewConfig.layout,
            ...$widgetStore.previewConfig.layout
          }
        };
      }
      
      // Update business name if available
      businessName = $widgetStore.business_profiles?.business_name || 'Your Business';
    } catch (e) {
      console.error("Error updating from store:", e);
      error = "Error updating preview";
    }
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Widget Preview</CardTitle>
    <CardDescription>
      This is how your widget will appear on your website
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div class="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
      {#if isLoading}
        <div class="flex items-center justify-center h-[400px]">
          <div class="flex flex-col items-center space-y-4">
            <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p class="text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      {:else if error}
        <div class="flex items-center justify-center h-[400px]">
          <div class="flex flex-col items-center space-y-4 text-center px-4">
            <p class="text-destructive font-medium">Error loading preview</p>
            <p class="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      {:else if showPreview}
        <!-- Simplified preview with mock data -->
        <div class="widget-preview-container">
          <div class="preview-mock" style="background-color: {previewConfig.colors?.background || '#ffffff'}; color: {previewConfig.colors?.text || '#333333'}; padding: {previewConfig.layout?.padding || '16px'}; border-radius: {previewConfig.layout?.borderRadius || '8px'};">
            <div class="preview-header" style="margin-bottom: 16px;">
              <h3 style="margin: 0 0 8px 0; font-size: {previewConfig.fonts?.titleSize || '18px'}; font-weight: {previewConfig.fonts?.weight || 'normal'};">{businessName}</h3>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="stars" style="color: {previewConfig.colors?.stars || '#FFD700'};">★★★★★</div>
                <span style="font-size: 0.875rem;">4.7 out of 5 (27 reviews)</span>
              </div>
            </div>
            
            <div class="preview-reviews" style="margin: 16px 0; display: {previewConfig.displayMode === 'grid' ? 'grid' : 'flex'}; gap: {previewConfig.layout?.spacing || '16px'}; flex-direction: {previewConfig.displayMode === 'list' ? 'column' : 'row'};">
              <!-- Mock review 1 -->
              <div class="review-card" style="background-color: rgba(0,0,0,0.03); padding: 16px; border-radius: 8px;">
                <div style="display: flex; align-items: flex-start; margin-bottom: 12px; gap: 12px;">
                  <img src="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%234285F4'/%3E%3Ctext x='50%25' y='50%25' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='white'%3EJS%3C/text%3E%3C/svg%3E" alt="John Smith" style="width: 40px; height: 40px; border-radius: 50%;" />
                  <div>
                    <h4 style="margin: 0 0 4px 0; font-size: {previewConfig.fonts?.titleSize || '18px'}; font-weight: {previewConfig.fonts?.weight || 'normal'};">John Smith</h4>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="color: {previewConfig.colors?.stars || '#FFD700'};">★★★★★</span>
                      <span style="font-size: 0.75rem; color: #666;">2 days ago</span>
                    </div>
                  </div>
                </div>
                <p style="margin: 0; font-size: {previewConfig.fonts?.textSize || '14px'}; line-height: 1.5;">Great service! I highly recommend this business to anyone looking for quality work.</p>
              </div>
              
              <!-- Mock review 2 (only show if grid or list mode) -->
              {#if previewConfig.displayMode !== 'carousel'}
                <div class="review-card" style="background-color: rgba(0,0,0,0.03); padding: 16px; border-radius: 8px;">
                  <div style="display: flex; align-items: flex-start; margin-bottom: 12px; gap: 12px;">
                    <img src="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23EA4335'/%3E%3Ctext x='50%25' y='50%25' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='white'%3ESJ%3C/text%3E%3C/svg%3E" alt="Sarah Johnson" style="width: 40px; height: 40px; border-radius: 50%;" />
                    <div>
                      <h4 style="margin: 0 0 4px 0; font-size: {previewConfig.fonts?.titleSize || '18px'}; font-weight: {previewConfig.fonts?.weight || 'normal'};">Sarah Johnson</h4>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: {previewConfig.colors?.stars || '#FFD700'};">★★★★☆</span>
                        <span style="font-size: 0.75rem; color: #666;">1 week ago</span>
                      </div>
                    </div>
                  </div>
                  <p style="margin: 0; font-size: {previewConfig.fonts?.textSize || '14px'}; line-height: 1.5;">Very professional and responsive. Would use their services again.</p>
                </div>
              {/if}
            </div>
            
            <div style="margin-top: 16px; text-align: center; font-size: 0.875rem;">
              <button 
                type="button" 
                class="link-button" 
                style="color: {previewConfig.colors?.links || '#0070f3'}; text-decoration: none; background: none; border: none; padding: 0; font: inherit; cursor: pointer;"
              >
                View all reviews on Google
              </button>
            </div>
          </div>
        </div>
      {:else}
        <div class="flex items-center justify-center h-[400px]">
          <p class="text-muted-foreground">Preview not available</p>
        </div>
      {/if}
    </div>
  </CardContent>
</Card>

<style>
  .widget-preview-container {
    width: 100%;
    height: 100%;
    min-height: 400px;
    overflow: auto;
  }
  
  .preview-mock {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  .stars {
    display: inline-flex;
    align-items: center;
  }
  
  /* Make the preview responsive */
  .preview-reviews {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  
  /* Fix accessibility contrast issues */
  .text-muted-foreground {
    color: #666;
  }
</style>

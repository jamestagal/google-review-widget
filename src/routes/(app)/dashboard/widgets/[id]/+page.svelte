<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import DashboardShell from '../../../components/dashboard-shell.svelte';
  import { Toaster, toast } from 'svelte-sonner';
  import { createBrowserClient } from '@supabase/ssr';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
  import { ArrowLeft, Save, Copy, Trash2 } from 'lucide-svelte';
  import * as Button from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Input from '$lib/components/ui/input';
  import * as Label from '$lib/components/ui/label';
  import * as Textarea from '$lib/components/ui/textarea';
  import * as Separator from '$lib/components/ui/separator';
  import * as Tabs from '$lib/components/ui/tabs';
  import * as Switch from '$lib/components/ui/switch';
  import { createWidgetStore } from '$lib/stores/widget-editor-store';
  import WidgetPreview from '../components/widget-preview.svelte';
  
  // Get data from server load function
  export let data;
  
  // Create Supabase client for client-side operations
  const supabase = createBrowserClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY
  );
  
  // Get widget ID from URL parameter
  const widgetId = $page.params.id;
  
  // Initialize widget store
  const widgetStore = createWidgetStore(data?.widget || null);
  
  // UI state
  let isLoading = false;
  let isSaving = false;
  let error = null;
  let showDeleteConfirm = false;
  
  // Widget configuration from store - for reactive binding
  $: widgetData = $widgetStore;
  
  // Extract data for form binding
  $: displayType = widgetData.display_type || 'grid';
  $: theme = widgetData.theme || 'light';
  $: businessName = widgetData.business_profiles?.business_name || '';
  $: placeId = widgetData.business_profiles?.google_place_id || '';
  $: colors = widgetData.colors || {
    background: '#ffffff',
    text: '#333333',
    stars: '#FFD700',
    links: '#0070f3',
    buttons: '#0070f3',
    border: '#e5e7eb',
    shadow: 'rgba(0, 0, 0, 0.1)'
  };
  $: fonts = widgetData.fonts || {
    family: 'inherit',
    titleSize: '1.25rem',
    bodySize: '1rem',
    weight: 'normal'
  };
  $: display = widgetData.display || {
    showHeader: true,
    showRating: true,
    showPhotos: true,
    reviewLimit: 10,
    width: '100%',
    height: 'auto',
    padding: '16px',
    borderRadius: '8px',
    spacing: '16px',
    maxHeight: '600px'
  };
  $: filters = widgetData.filters || {
    minRating: 1,
    maxAge: 365,
    sortBy: 'newest'
  };
  $: allowedDomains = Array.isArray(widgetData.allowed_domains) 
    ? widgetData.allowed_domains.join(',') 
    : widgetData.allowed_domains || '*';
  
  // Create widget preview config from form data
  $: widgetPreviewConfig = {
    placeId: placeId || 'ChIJN1t_tDeuEmsRUsoyG83frY4', // Default sample place ID if none available
    displayMode: displayType,
    theme: theme,
    maxReviews: display.reviewLimit,
    minRating: filters.minRating,
    showRatings: display.showRating,
    showDates: true,
    showPhotos: display.showPhotos,
    autoplaySpeed: 5000, // Default value
    colors: colors,
    fonts: {
      family: fonts.family,
      titleSize: fonts.titleSize,
      textSize: fonts.bodySize || '1rem',
      weight: fonts.weight
    },
    layout: {
      padding: display.padding || '16px',
      borderRadius: display.borderRadius || '8px',
      spacing: display.spacing || '16px',
      maxHeight: display.maxHeight || '600px',
      width: display.width || '100%'
    },
    sortBy: filters.sortBy,
    maxReviewAge: filters.maxAge
  };
  
  // Generate embed code for the widget
  function generateEmbedCode(): string {
    return `<div class="gr-widget" 
  data-gr-place-id="${placeId}" 
  data-gr-api-key="${widgetData.api_key}" 
  data-gr-display-mode="${displayType}" 
  data-gr-theme="${theme}"
  data-gr-max-reviews="${display.reviewLimit}"
  data-gr-min-rating="${filters.minRating}"
  data-gr-show-ratings="${display.showRating}"
  data-gr-show-dates="true"
  data-gr-show-photos="${display.showPhotos}"
  data-gr-sort-by="${filters.sortBy}"
  data-gr-max-review-age="${filters.maxAge}"
></div>
<${'script'} src="${window.location.origin}/widget/${widgetId}.js" async defer></${'script'}>`;
  }
  
  // Copy embed code to clipboard
  function copyEmbedCode(): void {
    navigator.clipboard.writeText(generateEmbedCode())
      .then(() => {
        toast.success('Embed code copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy embed code:', err);
        toast.error('Failed to copy embed code');
      });
  }
  
  // Update display type
  function updateDisplayType(value: string): void {
    widgetStore.updateDisplay({ type: value });
  }
  
  // Update theme
  function updateTheme(value: string): void {
    widgetStore.updateAppearance({ theme: value });
  }
  
  // Update colors
  function updateColor(key: string, value: string): void {
    widgetStore.updateAppearance({ 
      colors: { [key]: value } 
    });
  }
  
  // Update fonts
  function updateFont(key: string, value: string): void {
    widgetStore.updateAppearance({ 
      fonts: { [key]: value } 
    });
  }
  
  // Update display settings
  function updateDisplaySetting(key: string, value: any): void {
    widgetStore.updateDisplay({ 
      settings: { [key]: value } 
    });
  }
  
  // Update filter settings
  function updateFilter(key: string, value: any): void {
    widgetStore.updateFilters({ 
      [key]: value 
    });
  }
  
  // Handle form submission
  async function saveWidget() {
    if (isSaving) return;
    
    isSaving = true;
    widgetStore.isSaving.set(true);
    
    try {
      // Convert allowed domains string to array for database
      const allowedDomainsArray = allowedDomains === '*' ? 
        ['*'] : 
        allowedDomains.split(',').map(domain => domain.trim());
      
      if (allowedDomainsArray.length === 0) {
        allowedDomainsArray.push('*');
      }
      
      // Update the widget in the database
      const { error: updateError } = await supabase
        .from('widget_projects')
        .update({
          name: widgetData.name,
          display_type: displayType,
          theme: theme,
          colors: colors,
          fonts: fonts,
          filters: filters,
          display: display,
          allowed_domains: allowedDomainsArray
        })
        .eq('id', widgetId);
        
      if (updateError) throw updateError;
      
      toast.success('Widget updated successfully');
      
      setTimeout(() => {
        if (browser) {
          window.location.href = '/dashboard/widgets';
        }
      }, 1500);
      
    } catch (err) {
      console.error('Error updating widget:', err);
      toast.error('Failed to update widget');
      widgetStore.error.set(err.message || 'Failed to update widget');
    } finally {
      isSaving = false;
      widgetStore.isSaving.set(false);
    }
  }
  
  // Delete the widget
  async function deleteWidget() {
    try {
      const { error } = await supabase
        .from('widget_projects')
        .delete()
        .eq('id', widgetId);
        
      if (error) throw error;
      
      toast.success('Widget deleted successfully');
      
      setTimeout(() => {
        if (browser) {
          window.location.href = '/dashboard/widgets';
        }
      }, 1500);
    } catch (err) {
      console.error('Error deleting widget:', err);
      toast.error('Failed to delete widget');
    }
  }
  
  // Navigate back to widgets list
  function goBack() {
    if (browser) {
      window.history.back();
    }
  }
</script>

<DashboardShell>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center space-x-2">
      <Button.Root variant="ghost" on:click={goBack} size="icon">
        <ArrowLeft class="h-5 w-5" />
      </Button.Root>
      <h1 class="text-2xl font-bold">Edit Widget</h1>
    </div>
    <div class="flex items-center space-x-2">
      <Button.Root 
        variant="outline" 
        on:click={() => showDeleteConfirm = true} 
        class="text-red-600 hover:text-red-700"
      >
        <Trash2 class="mr-2 h-4 w-4" />
        Delete
      </Button.Root>
      <Button.Root 
        variant="default" 
        on:click={saveWidget} 
        disabled={isSaving}
      >
        {#if isSaving}
          <div class="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
          Saving...
        {:else}
          <Save class="mr-2 h-4 w-4" />
          Save Changes
        {/if}
      </Button.Root>
    </div>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="space-y-6">
      <Card.Root>
        <Card.Header>
          <Card.Title>Widget Settings</Card.Title>
          <Card.Description>Customize how your widget appears and behaves</Card.Description>
        </Card.Header>
        <Card.Content>
          <Tabs.Root value="general" class="w-full">
            <Tabs.List>
              <Tabs.Trigger value="general">General</Tabs.Trigger>
              <Tabs.Trigger value="display">Display</Tabs.Trigger>
              <Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
              <Tabs.Trigger value="content">Content</Tabs.Trigger>
              <Tabs.Trigger value="embed">Embed Code</Tabs.Trigger>
            </Tabs.List>
            
            <!-- General Settings Tab -->
            <Tabs.Content value="general">
              <div class="space-y-4 pt-4">
                <div class="space-y-2">
                  <Label.Root for="widget-name">Widget Name</Label.Root>
                  <Input.Root 
                    id="widget-name" 
                    bind:value={widgetData.name} 
                    placeholder="My Google Reviews Widget" 
                  />
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="widget-active">Widget Status</Label.Root>
                  <div class="flex items-center space-x-2">
                    <Switch.Root 
                      id="widget-active" 
                      checked={widgetData.is_active || false} 
                      onCheckedChange={(checked) => widgetStore.updateBasicInfo({ name: widgetData.name, is_active: checked })} 
                    />
                    <Label.Root for="widget-active" class="cursor-pointer">
                      {widgetData.is_active ? 'Active' : 'Inactive'}
                    </Label.Root>
                  </div>
                  <p class="text-sm text-muted-foreground">
                    When inactive, the widget will not display on your website.
                  </p>
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="business-name">Business Name</Label.Root>
                  <Input.Root 
                    id="business-name" 
                    value={businessName} 
                    disabled 
                  />
                  <p class="text-sm text-muted-foreground">
                    Business information cannot be changed after widget creation.
                  </p>
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="place-id">Google Place ID</Label.Root>
                  <Input.Root 
                    id="place-id" 
                    value={placeId} 
                    disabled 
                  />
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="allowed-domains">Domain Restrictions</Label.Root>
                  <Textarea.Root 
                    id="allowed-domains" 
                    bind:value={allowedDomains} 
                    placeholder="example.com, sub.example.com"
                    rows="3"
                  />
                  <p class="text-sm text-muted-foreground">
                    Enter domains where this widget can be embedded, one per line or comma-separated.
                    Use * to allow all domains, or *.example.com to allow all subdomains of example.com.
                    Leave empty to restrict to your own domain only.
                  </p>
                </div>
              </div>
            </Tabs.Content>
            
            <!-- Display Settings Tab -->
            <Tabs.Content value="display">
              <div class="space-y-4 pt-4">
                <div class="space-y-2">
                  <Label.Root for="display-type">Display Type</Label.Root>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <label class="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="display-type" 
                        value="carousel" 
                        checked={displayType === 'carousel'} 
                        on:change={() => updateDisplayType('carousel')} 
                      />
                      <span>Carousel</span>
                    </label>
                    <label class="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="display-type" 
                        value="grid" 
                        checked={displayType === 'grid'} 
                        on:change={() => updateDisplayType('grid')} 
                      />
                      <span>Grid</span>
                    </label>
                    <label class="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="display-type" 
                        value="list" 
                        checked={displayType === 'list'} 
                        on:change={() => updateDisplayType('list')} 
                      />
                      <span>List</span>
                    </label>
                    <label class="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="display-type" 
                        value="badge" 
                        checked={displayType === 'badge'} 
                        on:change={() => updateDisplayType('badge')} 
                      />
                      <span>Badge</span>
                    </label>
                    <label class="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="display-type" 
                        value="slider" 
                        checked={displayType === 'slider'} 
                        on:change={() => updateDisplayType('slider')} 
                      />
                      <span>Slider</span>
                    </label>
                    <label class="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="display-type" 
                        value="floating-badge" 
                        checked={displayType === 'floating-badge'} 
                        on:change={() => updateDisplayType('floating-badge')} 
                      />
                      <span>Floating Badge</span>
                    </label>
                    <label class="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="display-type" 
                        value="review-wall" 
                        checked={displayType === 'review-wall'} 
                        on:change={() => updateDisplayType('review-wall')} 
                      />
                      <span>Review Wall</span>
                    </label>
                  </div>
                  <p class="text-sm text-muted-foreground">
                    {#if displayType === 'carousel'}
                      Scrolling horizontal layout of reviews
                    {:else if displayType === 'grid'}
                      Responsive grid layout of review cards
                    {:else if displayType === 'list'}
                      Vertical list of reviews
                    {:else if displayType === 'badge'}
                      Compact badge showing average rating
                    {:else if displayType === 'slider'}
                      Full-width slider showing one review at a time
                    {:else if displayType === 'floating-badge'}
                      Fixed-position badge that follows scrolling
                    {:else if displayType === 'review-wall'}
                      Masonry-style layout for varied review lengths
                    {/if}
                  </p>
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="theme">Theme</Label.Root>
                  <div class="flex gap-4">
                    <label class="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="theme" 
                        value="light" 
                        checked={theme === 'light'} 
                        on:change={() => updateTheme('light')} 
                      />
                      <span>Light</span>
                    </label>
                    <label class="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="theme" 
                        value="dark" 
                        checked={theme === 'dark'} 
                        on:change={() => updateTheme('dark')} 
                      />
                      <span>Dark</span>
                    </label>
                    <label class="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="theme" 
                        value="auto" 
                        checked={theme === 'auto'} 
                        on:change={() => updateTheme('auto')} 
                      />
                      <span>Auto</span>
                    </label>
                  </div>
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="layout-width">Widget Width</Label.Root>
                  <Input.Root 
                    id="layout-width" 
                    value={display.width} 
                    on:input={(e) => updateDisplaySetting('width', e.currentTarget.value)} 
                    placeholder="100%" 
                  />
                  <p class="text-sm text-muted-foreground">
                    Use percentage (e.g., 100%) or pixels (e.g., 500px)
                  </p>
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="layout-max-height">Maximum Height</Label.Root>
                  <Input.Root 
                    id="layout-max-height" 
                    value={display.maxHeight} 
                    on:input={(e) => updateDisplaySetting('maxHeight', e.currentTarget.value)} 
                    placeholder="600px" 
                  />
                  <p class="text-sm text-muted-foreground">
                    Maximum height for the widget (use 'auto' or pixels)
                  </p>
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="layout-padding">Padding</Label.Root>
                  <Input.Root 
                    id="layout-padding" 
                    value={display.padding} 
                    on:input={(e) => updateDisplaySetting('padding', e.currentTarget.value)} 
                    placeholder="16px" 
                  />
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="layout-border-radius">Border Radius</Label.Root>
                  <Input.Root 
                    id="layout-border-radius" 
                    value={display.borderRadius} 
                    on:input={(e) => updateDisplaySetting('borderRadius', e.currentTarget.value)} 
                    placeholder="8px" 
                  />
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="layout-spacing">Item Spacing</Label.Root>
                  <Input.Root 
                    id="layout-spacing" 
                    value={display.spacing} 
                    on:input={(e) => updateDisplaySetting('spacing', e.currentTarget.value)} 
                    placeholder="16px" 
                  />
                </div>
                
                <div class="space-y-2">
                  <div class="flex items-center space-x-2">
                    <Switch.Root 
                      id="show-header" 
                      checked={display.showHeader} 
                      onCheckedChange={(checked) => updateDisplaySetting('showHeader', checked)} 
                    />
                    <Label.Root for="show-header" class="cursor-pointer">
                      Show Business Header
                    </Label.Root>
                  </div>
                </div>
                
                <div class="space-y-2">
                  <div class="flex items-center space-x-2">
                    <Switch.Root 
                      id="show-rating" 
                      checked={display.showRating} 
                      onCheckedChange={(checked) => updateDisplaySetting('showRating', checked)} 
                    />
                    <Label.Root for="show-rating" class="cursor-pointer">
                      Show Star Ratings
                    </Label.Root>
                  </div>
                </div>
                
                <div class="space-y-2">
                  <div class="flex items-center space-x-2">
                    <Switch.Root 
                      id="show-photos" 
                      checked={display.showPhotos} 
                      onCheckedChange={(checked) => updateDisplaySetting('showPhotos', checked)} 
                    />
                    <Label.Root for="show-photos" class="cursor-pointer">
                      Show User Photos
                    </Label.Root>
                  </div>
                </div>
              </div>
            </Tabs.Content>
            
            <!-- Appearance Settings Tab -->
            <Tabs.Content value="appearance">
              <div class="space-y-4 pt-4">
                <div class="space-y-2">
                  <Label.Root>Colors</Label.Root>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <Label.Root for="color-background" class="text-sm">Background</Label.Root>
                      <div class="flex items-center gap-2">
                        <input 
                          type="color" 
                          id="color-background" 
                          value={colors.background} 
                          on:input={(e) => updateColor('background', e.currentTarget.value)} 
                          class="w-8 h-8 rounded-md border"
                        />
                        <Input.Root 
                          value={colors.background} 
                          on:input={(e) => updateColor('background', e.currentTarget.value)}
                          class="w-24"
                        />
                      </div>
                    </div>
                    <div>
                      <Label.Root for="color-text" class="text-sm">Text</Label.Root>
                      <div class="flex items-center gap-2">
                        <input 
                          type="color" 
                          id="color-text" 
                          value={colors.text} 
                          on:input={(e) => updateColor('text', e.currentTarget.value)} 
                          class="w-8 h-8 rounded-md border"
                        />
                        <Input.Root 
                          value={colors.text} 
                          on:input={(e) => updateColor('text', e.currentTarget.value)}
                          class="w-24"
                        />
                      </div>
                    </div>
                    <div>
                      <Label.Root for="color-stars" class="text-sm">Stars</Label.Root>
                      <div class="flex items-center gap-2">
                        <input 
                          type="color" 
                          id="color-stars" 
                          value={colors.stars} 
                          on:input={(e) => updateColor('stars', e.currentTarget.value)} 
                          class="w-8 h-8 rounded-md border"
                        />
                        <Input.Root 
                          value={colors.stars} 
                          on:input={(e) => updateColor('stars', e.currentTarget.value)}
                          class="w-24"
                        />
                      </div>
                    </div>
                    <div>
                      <Label.Root for="color-links" class="text-sm">Links</Label.Root>
                      <div class="flex items-center gap-2">
                        <input 
                          type="color" 
                          id="color-links" 
                          value={colors.links} 
                          on:input={(e) => updateColor('links', e.currentTarget.value)} 
                          class="w-8 h-8 rounded-md border"
                        />
                        <Input.Root 
                          value={colors.links} 
                          on:input={(e) => updateColor('links', e.currentTarget.value)}
                          class="w-24"
                        />
                      </div>
                    </div>
                    <div>
                      <Label.Root for="color-buttons" class="text-sm">Buttons</Label.Root>
                      <div class="flex items-center gap-2">
                        <input 
                          type="color" 
                          id="color-buttons" 
                          value={colors.buttons} 
                          on:input={(e) => updateColor('buttons', e.currentTarget.value)} 
                          class="w-8 h-8 rounded-md border"
                        />
                        <Input.Root 
                          value={colors.buttons} 
                          on:input={(e) => updateColor('buttons', e.currentTarget.value)}
                          class="w-24"
                        />
                      </div>
                    </div>
                    <div>
                      <Label.Root for="color-border" class="text-sm">Border</Label.Root>
                      <div class="flex items-center gap-2">
                        <input 
                          type="color" 
                          id="color-border" 
                          value={colors.border || '#e5e7eb'} 
                          on:input={(e) => updateColor('border', e.currentTarget.value)} 
                          class="w-8 h-8 rounded-md border"
                        />
                        <Input.Root 
                          value={colors.border || '#e5e7eb'} 
                          on:input={(e) => updateColor('border', e.currentTarget.value)}
                          class="w-24"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="space-y-2">
                  <Label.Root>Typography</Label.Root>
                  <div class="space-y-3">
                    <div>
                      <Label.Root for="font-family" class="text-sm">Font Family</Label.Root>
                      <select 
                        id="font-family" 
                        bind:value={fonts.family} 
                        on:change={(e) => updateFont('family', e.currentTarget.value)}
                        class="w-full p-2 border rounded-md"
                      >
                        <option value="system-ui, -apple-system, sans-serif">System Default</option>
                        <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica</option>
                        <option value="'Georgia', serif">Georgia</option>
                        <option value="'Roboto', sans-serif">Roboto</option>
                        <option value="'Open Sans', sans-serif">Open Sans</option>
                        <option value="'Lato', sans-serif">Lato</option>
                      </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <Label.Root for="font-title-size" class="text-sm">Title Size</Label.Root>
                        <Input.Root 
                          id="font-title-size" 
                          value={fonts.titleSize} 
                          on:input={(e) => updateFont('titleSize', e.currentTarget.value)}
                          placeholder="1.25rem" 
                        />
                      </div>
                      <div>
                        <Label.Root for="font-body-size" class="text-sm">Body Size</Label.Root>
                        <Input.Root 
                          id="font-body-size" 
                          value={fonts.bodySize || '1rem'} 
                          on:input={(e) => updateFont('bodySize', e.currentTarget.value)}
                          placeholder="1rem" 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label.Root for="font-weight" class="text-sm">Font Weight</Label.Root>
                      <select 
                        id="font-weight" 
                        bind:value={fonts.weight} 
                        on:change={(e) => updateFont('weight', e.currentTarget.value)}
                        class="w-full p-2 border rounded-md"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="300">Light (300)</option>
                        <option value="400">Regular (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">Semi-Bold (600)</option>
                        <option value="700">Bold (700)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Tabs.Content>
            
            <!-- Content Settings Tab -->
            <Tabs.Content value="content">
              <div class="space-y-4 pt-4">
                <div class="space-y-2">
                  <Label.Root for="review-limit">Maximum Reviews ({display.reviewLimit})</Label.Root>
                  <div class="flex items-center gap-2">
                    <input 
                      type="range" 
                      id="review-limit" 
                      bind:value={display.reviewLimit} 
                      on:input={(e) => updateDisplaySetting('reviewLimit', parseInt(e.currentTarget.value))}
                      min="1" 
                      max="10" 
                      class="w-full"
                    />
                    <span class="text-sm font-medium">{display.reviewLimit}</span>
                  </div>
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="min-rating">Minimum Rating ({filters.minRating} stars)</Label.Root>
                  <div class="flex items-center gap-2">
                    <input 
                      type="range" 
                      id="min-rating" 
                      bind:value={filters.minRating} 
                      on:input={(e) => updateFilter('minRating', parseInt(e.currentTarget.value))}
                      min="0" 
                      max="5" 
                      step="1" 
                      class="w-full"
                    />
                    <span class="text-sm font-medium">{filters.minRating} stars</span>
                  </div>
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="sort-by">Sort Reviews By</Label.Root>
                  <select 
                    id="sort-by" 
                    bind:value={filters.sortBy} 
                    on:change={(e) => updateFilter('sortBy', e.currentTarget.value)}
                    class="w-full p-2 border rounded-md"
                  >
                    <option value="newest">Newest First</option>
                    <option value="highest">Highest Rating First</option>
                    <option value="lowest">Lowest Rating First</option>
                    <option value="relevant">Most Relevant</option>
                  </select>
                </div>
                
                <div class="space-y-2">
                  <Label.Root for="max-review-age">Maximum Review Age (days)</Label.Root>
                  <div class="flex items-center gap-2">
                    <input 
                      type="range" 
                      id="max-review-age" 
                      bind:value={filters.maxAge} 
                      on:input={(e) => updateFilter('maxAge', parseInt(e.currentTarget.value))}
                      min="30" 
                      max="365" 
                      step="30" 
                      class="w-full"
                    />
                    <span class="text-sm font-medium">{filters.maxAge} days</span>
                  </div>
                  <p class="text-sm text-muted-foreground">
                    Only show reviews from the last {filters.maxAge} days
                  </p>
                </div>
              </div>
            </Tabs.Content>
            
            <!-- Embed Code Tab -->
            <Tabs.Content value="embed">
              <div class="space-y-4 pt-4">
                <div class="space-y-2">
                  <Label.Root>Embed Instructions</Label.Root>
                  <p class="text-sm text-muted-foreground">
                    Copy and paste this code into your website to display your Google Reviews widget.
                  </p>
                </div>
                
                <div class="bg-muted p-4 rounded-md relative">
                  <pre class="text-xs overflow-x-auto whitespace-pre-wrap">{#if browser}{generateEmbedCode()}{/if}</pre>
                  <Button.Root
                    variant="ghost"
                    size="icon"
                    on:click={copyEmbedCode}
                    class="absolute top-2 right-2"
                  >
                    <Copy class="h-4 w-4" />
                  </Button.Root>
                </div>
                
                <div class="space-y-2 mt-4">
                  <h4 class="font-medium">Installation Instructions</h4>
                  <ol class="list-decimal ml-5 space-y-2 text-sm">
                    <li>Copy the code above.</li>
                    <li>Paste it into the HTML of your website where you want the widget to appear.</li>
                    <li>The widget will automatically load and display your Google reviews.</li>
                  </ol>
                </div>
                
                <div class="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <h4 class="font-medium text-amber-800">Advanced Integration</h4>
                  <p class="text-sm text-amber-700 mt-1">
                    Need help integrating this widget? Contact support for assistance with custom implementations.
                  </p>
                </div>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </Card.Content>
      </Card.Root>
    </div>
    
    <!-- Live Preview Panel -->
    <div>
      <Card.Root>
        <Card.Header>
          <Card.Title>Widget Preview</Card.Title>
          <Card.Description>This is how your widget will appear on your website</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="border rounded-md p-4 bg-slate-50 dark:bg-slate-900 min-h-[400px]">
            <WidgetPreview 
              config={widgetPreviewConfig} 
              businessName={businessName || 'Your Business'} 
            />
          </div>
        </Card.Content>
        <Card.Footer>
          <p class="text-sm text-muted-foreground">
            This is a preview using sample data. The actual widget will display your real Google reviews.
          </p>
        </Card.Footer>
      </Card.Root>
    </div>
  </div>
  
  <!-- Delete Confirmation Modal -->
  {#if showDeleteConfirm}
    <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="bg-background border rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-2">Delete Widget</h3>
        <p class="mb-4">
          Are you sure you want to delete this widget? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <Button.Root variant="outline" on:click={() => showDeleteConfirm = false}>
            Cancel
          </Button.Root>
          <Button.Root variant="destructive" on:click={deleteWidget}>
            Delete
          </Button.Root>
        </div>
      </div>
    </div>
  {/if}
  
  <Toaster />
</DashboardShell>
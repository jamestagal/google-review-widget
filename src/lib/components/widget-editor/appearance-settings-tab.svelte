<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Input } from '$lib/components/ui/input';
  import { Separator } from '$lib/components/ui/separator';
  import type { WidgetStore, WidgetAppearance } from '$lib/stores/widget-editor-store';
  
  // Accept the widget store as a prop with proper typing
  export let widgetStore: WidgetStore;
  
  // Default values for appearance to avoid undefined errors
  const defaultAppearance = {
    theme: 'light',
    colors: {
      background: '#ffffff',
      text: '#333333',
      stars: '#FFD700',
      links: '#0070f3',
      buttons: '#0070f3'
    },
    fonts: {
      family: 'inherit',
      titleSize: '1.25rem',
      bodySize: '1rem',
      weight: 'normal'
    }
  };
  
  // Local state to prevent undefined access - initialize with defaults
  let appearance: WidgetAppearance = { ...defaultAppearance };
  
  // Track loading state
  let isLoading = true;
  
  // Initialize appearance from store once mounted
  onMount(() => {
    if (browser) {
      // Set a short delay to ensure store is ready
      setTimeout(() => {
        // Safely update appearance from the store's appearance if available
        if ($widgetStore && widgetStore.appearance) {
          const storeAppearance = widgetStore.appearance;
          if (storeAppearance) {
            appearance = {
              theme: storeAppearance.theme || defaultAppearance.theme,
              colors: storeAppearance.colors || defaultAppearance.colors,
              fonts: storeAppearance.fonts || defaultAppearance.fonts
            };
          }
        }
        isLoading = false;
      }, 100);
    }
  });
  
  // Update local state when store changes, with safety checks
  $: if (!isLoading && $widgetStore) {
    const storeAppearance = widgetStore.appearance;
    if (storeAppearance) {
      try {
        appearance = {
          theme: storeAppearance.theme || defaultAppearance.theme,
          colors: {
            background: storeAppearance.colors?.background || defaultAppearance.colors.background,
            text: storeAppearance.colors?.text || defaultAppearance.colors.text,
            stars: storeAppearance.colors?.stars || defaultAppearance.colors.stars,
            links: storeAppearance.colors?.links || defaultAppearance.colors.links,
            buttons: storeAppearance.colors?.buttons || defaultAppearance.colors.buttons
          },
          fonts: {
            family: storeAppearance.fonts?.family || defaultAppearance.fonts.family,
            titleSize: storeAppearance.fonts?.titleSize || defaultAppearance.fonts.titleSize,
            bodySize: storeAppearance.fonts?.bodySize || defaultAppearance.fonts.bodySize,
            weight: storeAppearance.fonts?.weight || defaultAppearance.fonts.weight
          }
        };
      } catch (error) {
        console.error("Error updating appearance from store:", error);
        // Keep existing appearance in case of error
      }
    }
  }
  
  // Update theme - fixed to work with shadcn Select
  function updateTheme(value: string) {
    if (!value) return;
    widgetStore.updateAppearance({ theme: value });
  }
  
  // Update color
  function updateColor(key: string, event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input?.value) return;
    
    widgetStore.updateAppearance({ 
      colors: { [key]: input.value } 
    });
  }
  
  // Update font
  function updateFont(key: string, event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input?.value) return;
    
    widgetStore.updateAppearance({ 
      fonts: { [key]: input.value } 
    });
  }
  
  // Update font weight
  function updateFontWeight(value: string) {
    if (!value) return;
    widgetStore.updateAppearance({ 
      fonts: { weight: value } 
    });
  }
</script>

{#if isLoading}
  <div class="py-8 flex justify-center">
    <div class="flex flex-col items-center space-y-4">
      <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      <p class="text-sm text-muted-foreground">Loading appearance settings...</p>
    </div>
  </div>
{:else}
  <div class="space-y-6">
    <div class="space-y-2">
      <Label for="theme">Theme</Label>
      <Select 
        value={appearance?.theme || 'light'} 
        onSelectedChange={(value) => updateTheme(value)}
      >
        <SelectTrigger id="theme">
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <Separator />
    
    <h3 class="text-lg font-medium">Colors</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label for="background-color">Background Color</Label>
        <div class="flex gap-2">
          <div class="w-8 h-8 rounded border" style={`background-color: ${appearance?.colors?.background || '#ffffff'}`}></div>
          <Input 
            id="background-color" 
            type="text" 
            value={appearance?.colors?.background || '#ffffff'} 
            on:input={(e) => updateColor('background', e)} 
          />
        </div>
      </div>
      
      <div class="space-y-2">
        <Label for="text-color">Text Color</Label>
        <div class="flex gap-2">
          <div class="w-8 h-8 rounded border" style={`background-color: ${appearance?.colors?.text || '#333333'}`}></div>
          <Input 
            id="text-color" 
            type="text" 
            value={appearance?.colors?.text || '#333333'} 
            on:input={(e) => updateColor('text', e)} 
          />
        </div>
      </div>
      
      <div class="space-y-2">
        <Label for="stars-color">Stars Color</Label>
        <div class="flex gap-2">
          <div class="w-8 h-8 rounded border" style={`background-color: ${appearance?.colors?.stars || '#FFD700'}`}></div>
          <Input 
            id="stars-color" 
            type="text" 
            value={appearance?.colors?.stars || '#FFD700'} 
            on:input={(e) => updateColor('stars', e)} 
          />
        </div>
      </div>
      
      <div class="space-y-2">
        <Label for="links-color">Links Color</Label>
        <div class="flex gap-2">
          <div class="w-8 h-8 rounded border" style={`background-color: ${appearance?.colors?.links || '#0070f3'}`}></div>
          <Input 
            id="links-color" 
            type="text" 
            value={appearance?.colors?.links || '#0070f3'} 
            on:input={(e) => updateColor('links', e)} 
          />
        </div>
      </div>
      
      <div class="space-y-2">
        <Label for="buttons-color">Buttons Color</Label>
        <div class="flex gap-2">
          <div class="w-8 h-8 rounded border" style={`background-color: ${appearance?.colors?.buttons || '#0070f3'}`}></div>
          <Input 
            id="buttons-color" 
            type="text" 
            value={appearance?.colors?.buttons || '#0070f3'} 
            on:input={(e) => updateColor('buttons', e)} 
          />
        </div>
      </div>
    </div>
    
    <Separator />
    
    <h3 class="text-lg font-medium">Fonts</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label for="font-family">Font Family</Label>
        <Input 
          id="font-family" 
          type="text" 
          value={appearance?.fonts?.family || 'inherit'} 
          on:input={(e) => updateFont('family', e)} 
        />
      </div>
      
      <div class="space-y-2">
        <Label for="font-weight">Font Weight</Label>
        <Select 
          value={appearance?.fonts?.weight || 'normal'} 
          onSelectedChange={(value) => updateFontWeight(value)}
        >
          <SelectTrigger id="font-weight">
            <SelectValue placeholder="Select font weight" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
            <SelectItem value="300">Light (300)</SelectItem>
            <SelectItem value="400">Regular (400)</SelectItem>
            <SelectItem value="500">Medium (500)</SelectItem>
            <SelectItem value="600">Semi-Bold (600)</SelectItem>
            <SelectItem value="700">Bold (700)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div class="space-y-2">
        <Label for="title-size">Title Size</Label>
        <Input 
          id="title-size" 
          type="text" 
          value={appearance?.fonts?.titleSize || '1.25rem'} 
          on:input={(e) => updateFont('titleSize', e)} 
        />
      </div>
      
      <div class="space-y-2">
        <Label for="body-size">Body Size</Label>
        <Input 
          id="body-size" 
          type="text" 
          value={appearance?.fonts?.bodySize || '1rem'} 
          on:input={(e) => updateFont('bodySize', e)} 
        />
      </div>
    </div>
  </div>
{/if}

<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Separator } from '$lib/components/ui/separator';
  import type { WidgetStore } from '$lib/stores/widget-editor-store';
  
  // Accept the widget store as a prop
  export let widgetStore: WidgetStore;
  
  // Local state to prevent undefined access
  let isLoading = true;
  let displayType = 'grid';
  let displaySettings = {
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
  
  // Initialize on mount
  onMount(() => {
    if (browser) {
      // Set a short delay to ensure store is ready
      setTimeout(() => {
        // Safely access store values with fallbacks
        if ($widgetStore) {
          displayType = $widgetStore.display_type || 'grid';
          
          // Safely create settings object with defaults
          displaySettings = {
            showHeader: $widgetStore.display?.showHeader ?? true,
            showRating: $widgetStore.display?.showRating ?? true,
            showPhotos: $widgetStore.display?.showPhotos ?? true,
            reviewLimit: $widgetStore.display?.reviewLimit ?? 10,
            width: $widgetStore.display?.width ?? '100%',
            height: $widgetStore.display?.height ?? 'auto',
            padding: $widgetStore.display?.padding ?? '16px',
            borderRadius: $widgetStore.display?.borderRadius ?? '8px',
            spacing: $widgetStore.display?.spacing ?? '16px',
            maxHeight: $widgetStore.display?.maxHeight ?? '600px'
          };
        }
        isLoading = false;
      }, 100);
    }
  });
  
  // Update data when store changes
  $: if (browser && !isLoading && $widgetStore) {
    displayType = $widgetStore.display_type || 'grid';
    
    // Only update display settings if they exist to avoid overwriting local state
    if ($widgetStore.display) {
      displaySettings = {
        showHeader: $widgetStore.display.showHeader ?? displaySettings.showHeader,
        showRating: $widgetStore.display.showRating ?? displaySettings.showRating,
        showPhotos: $widgetStore.display.showPhotos ?? displaySettings.showPhotos,
        reviewLimit: $widgetStore.display.reviewLimit ?? displaySettings.reviewLimit,
        width: $widgetStore.display.width ?? displaySettings.width,
        height: $widgetStore.display.height ?? displaySettings.height,
        padding: $widgetStore.display.padding ?? displaySettings.padding,
        borderRadius: $widgetStore.display.borderRadius ?? displaySettings.borderRadius,
        spacing: $widgetStore.display.spacing ?? displaySettings.spacing,
        maxHeight: $widgetStore.display.maxHeight ?? displaySettings.maxHeight
      };
    }
  }
  
  // Display type options
  const displayTypes = [
    { value: 'grid', label: 'Grid' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'list', label: 'List' }
  ];
  
  // Handle display type change
  function handleDisplayTypeChange(type: string) {
    if (!type) return;
    widgetStore.updateDisplay({ type });
  }
  
  // Handle checkbox change
  function handleCheckboxChange(key: string, value: boolean) {
    widgetStore.updateDisplay({ 
      settings: { [key]: value } 
    });
  }
  
  // Handle number input change
  function handleNumberChange(key: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value);
    if (!isNaN(value)) {
      widgetStore.updateDisplay({ 
        settings: { [key]: value } 
      });
    }
  }
  
  // Handle text input change
  function handleTextChange(key: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    widgetStore.updateDisplay({ 
      settings: { [key]: value } 
    });
  }
</script>

{#if isLoading}
  <div class="py-8 flex justify-center">
    <div class="flex flex-col items-center space-y-4">
      <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      <p class="text-sm text-muted-foreground">Loading display settings...</p>
    </div>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Display Type -->
    <div class="space-y-2">
      <Label for="display-type">Display Type</Label>
      <Select 
        value={displayType} 
        onSelectedChange={(value) => handleDisplayTypeChange(value)}
      >
        <SelectTrigger id="display-type" class="w-full">
          <SelectValue placeholder="Select display type" />
        </SelectTrigger>
        <SelectContent>
          {#each displayTypes as type}
            <SelectItem value={type.value}>{type.label}</SelectItem>
          {/each}
        </SelectContent>
      </Select>
      <p class="text-sm text-muted-foreground">
        Choose how your reviews will be displayed on your website
      </p>
    </div>
    
    <Separator />
    
    <h3 class="text-lg font-medium">Display Options</h3>
    
    <!-- Show Header -->
    <div class="flex items-center space-x-2">
      <Checkbox 
        id="show-header" 
        checked={displaySettings.showHeader} 
        onCheckedChange={(checked) => handleCheckboxChange('showHeader', checked)} 
      />
      <Label for="show-header" class="cursor-pointer">Show Business Header</Label>
    </div>
    
    <!-- Show Rating -->
    <div class="flex items-center space-x-2">
      <Checkbox 
        id="show-rating" 
        checked={displaySettings.showRating} 
        onCheckedChange={(checked) => handleCheckboxChange('showRating', checked)} 
      />
      <Label for="show-rating" class="cursor-pointer">Show Star Ratings</Label>
    </div>
    
    <!-- Show Photos -->
    <div class="flex items-center space-x-2">
      <Checkbox 
        id="show-photos" 
        checked={displaySettings.showPhotos} 
        onCheckedChange={(checked) => handleCheckboxChange('showPhotos', checked)} 
      />
      <Label for="show-photos" class="cursor-pointer">Show User Photos</Label>
    </div>
    
    <Separator />
    
    <h3 class="text-lg font-medium">Dimensions</h3>
    
    <!-- Review Limit -->
    <div class="space-y-2">
      <Label for="review-limit">Number of Reviews</Label>
      <Input 
        id="review-limit" 
        type="number" 
        min="1" 
        max="50" 
        value={displaySettings.reviewLimit} 
        on:input={(e) => handleNumberChange('reviewLimit', e)} 
      />
      <p class="text-sm text-muted-foreground">
        Maximum number of reviews to display (1-50)
      </p>
    </div>
    
    <!-- Width -->
    <div class="space-y-2">
      <Label for="width">Width</Label>
      <Input 
        id="width" 
        type="text" 
        value={displaySettings.width} 
        on:input={(e) => handleTextChange('width', e)} 
      />
      <p class="text-sm text-muted-foreground">
        Width of the widget (e.g., 100%, 500px)
      </p>
    </div>
    
    <!-- Height -->
    <div class="space-y-2">
      <Label for="height">Height</Label>
      <Input 
        id="height" 
        type="text" 
        value={displaySettings.height} 
        on:input={(e) => handleTextChange('height', e)} 
      />
      <p class="text-sm text-muted-foreground">
        Height of the widget (e.g., auto, 600px)
      </p>
    </div>
    
    <!-- Max Height -->
    <div class="space-y-2">
      <Label for="max-height">Max Height</Label>
      <Input 
        id="max-height" 
        type="text" 
        value={displaySettings.maxHeight} 
        on:input={(e) => handleTextChange('maxHeight', e)} 
      />
      <p class="text-sm text-muted-foreground">
        Maximum height of the widget (e.g., 600px)
      </p>
    </div>
    
    <!-- Padding -->
    <div class="space-y-2">
      <Label for="padding">Padding</Label>
      <Input 
        id="padding" 
        type="text" 
        value={displaySettings.padding} 
        on:input={(e) => handleTextChange('padding', e)} 
      />
      <p class="text-sm text-muted-foreground">
        Inner padding of the widget (e.g., 16px)
      </p>
    </div>
    
    <!-- Border Radius -->
    <div class="space-y-2">
      <Label for="border-radius">Border Radius</Label>
      <Input 
        id="border-radius" 
        type="text" 
        value={displaySettings.borderRadius} 
        on:input={(e) => handleTextChange('borderRadius', e)} 
      />
      <p class="text-sm text-muted-foreground">
        Corner radius of the widget (e.g., 8px)
      </p>
    </div>
    
    <!-- Spacing -->
    <div class="space-y-2">
      <Label for="spacing">Item Spacing</Label>
      <Input 
        id="spacing" 
        type="text" 
        value={displaySettings.spacing} 
        on:input={(e) => handleTextChange('spacing', e)} 
      />
      <p class="text-sm text-muted-foreground">
        Spacing between review items (e.g., 16px)
      </p>
    </div>
  </div>
{/if}

<script lang="ts">
    // Import all the UI components and dependencies
    import { Button } from '$lib/components/ui/button';
    import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'; // Import directly
    import { Textarea } from '$lib/components/ui/textarea';
    import { Separator } from '$lib/components/ui/separator';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs'; // Import directly
    import { Slider } from '$lib/components/ui/slider';
    import { Switch } from '$lib/components/ui/switch';
    import { AlertCircle, Copy, Save, Trash2 } from 'lucide-svelte';
    import { Toaster, toast } from 'svelte-sonner';
    import { createBrowserClient } from '@supabase/ssr';
    import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
    import _GooglePlacesSearch from '$lib/components/google-places-search.svelte';
    import WidgetPreview from './widget-preview.svelte';
    import type { WidgetPreviewConfig } from '$lib/types/widget-preview.types';
    import { browser } from '$app/environment';
    
    // Define widget data type to fix Lint ID: 0126c83d-a956-43a5-a118-58c7cc47e8fc
    interface WidgetData {
        id: string;
        api_key: string;
        place_id: string;
        subscription_tier: string;
        is_active: boolean;
        allowed_domains: string[];
        max_reviews: number;
        display_mode: string;
        theme: string;
        min_rating: number;
        show_ratings: boolean;
        show_dates: boolean;
        show_photos: boolean;
        autoplay_speed: number;
        custom_settings: {
            colors: {
                background: string;
                text: string;
                stars: string;
                links: string;
                buttons: string;
                border: string;
                shadow: string;
            };
            fonts: {
                family: string;
                titleSize: string;
                textSize: string;
                weight: string;
            };
            layout: {
                padding: string;
                borderRadius: string;
                spacing: string;
                maxHeight: string;
                width: string;
            };
            sortBy: string;
            maxReviewAge: number;
        };
    }
    
    // Export props that will be passed from parent
    export let widgetId: string;
    export let widgetData: WidgetData | null;
    export let onSave: () => void;
    export let onDelete: () => void;
    export let onCancel: () => void; // Used in the component to handle cancellation
    
    // Create Supabase client using the utility function from project conventions
    const supabase = createBrowserClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Widget data
    let isLoading = false;
    let isSaving = false;
    let showDeleteConfirm = false;
    let validationErrors = { placeId: '' };
    let _selectedPlace = null; // Prefixed with underscore to indicate it's intentionally unused (Lint ID: 1195a7b7-5dad-4b20-939c-84b1984bc644)
    
    // Extract custom settings from widget data
    let customSettings = widgetData?.custom_settings || {};
    
    // Convert allowed domains from array to string for UI
    let allowedDomainsString = widgetData?.allowed_domains ? 
        Array.isArray(widgetData.allowed_domains) ? 
            widgetData.allowed_domains.join(',') : 
            typeof widgetData.allowed_domains === 'string' ? 
                widgetData.allowed_domains : '*' 
        : '*';
    
    // Widget project data
    let widgetProject = {
        id: widgetData?.id || '',
        api_key: widgetData?.api_key || '',
        place_id: widgetData?.place_id || '',
        subscription_tier: widgetData?.subscription_tier || 'free',
        is_active: widgetData?.is_active ?? true,
        allowed_domains: allowedDomainsString,
        max_reviews: widgetData?.max_reviews || 5,
        display_mode: widgetData?.display_mode || 'carousel',
        theme: widgetData?.theme || 'light',
        min_rating: widgetData?.min_rating || 0,
        show_ratings: widgetData?.show_ratings ?? true,
        show_dates: widgetData?.show_dates ?? true,
        show_photos: widgetData?.show_photos ?? true,
        autoplay_speed: widgetData?.autoplay_speed || 5000
    };
    
    // Visual customization - handle missing fields
    let colors = {
        background: customSettings?.colors?.background || '#ffffff',
        text: customSettings?.colors?.text || '#333333',
        stars: customSettings?.colors?.stars || '#FFD700',
        links: customSettings?.colors?.links || '#0070f3',
        buttons: customSettings?.colors?.buttons || '#0070f3',
        border: customSettings?.colors?.border || '#e5e7eb',
        shadow: customSettings?.colors?.shadow || 'rgba(0, 0, 0, 0.1)'
    };
    
    // Font customization - handle missing fields
    let fonts = {
        family: customSettings?.fonts?.family || 'system-ui, -apple-system, sans-serif',
        titleSize: customSettings?.fonts?.titleSize || '18px',
        textSize: customSettings?.fonts?.textSize || '14px',
        weight: customSettings?.fonts?.weight || 'normal'
    };
    
    // Layout customization - handle missing fields
    let layout = {
        padding: customSettings?.layout?.padding || '16px',
        borderRadius: customSettings?.layout?.borderRadius || '8px',
        spacing: customSettings?.layout?.spacing || '16px',
        maxHeight: customSettings?.layout?.maxHeight || '600px',
        width: customSettings?.layout?.width || '100%'
    };
    
    // Review sorting - handle missing fields
    let sortBy = customSettings?.sortBy || 'newest';
    let maxReviewAge = customSettings?.maxReviewAge || 365; // days
    
    // Widget configuration
    let widgetConfig = {
        placeId: widgetProject.place_id,
        isActive: widgetProject.is_active,
        maxReviews: widgetProject.max_reviews,
        displayMode: widgetProject.display_mode,
        theme: widgetProject.theme,
        minRating: widgetProject.min_rating,
        showRatings: widgetProject.show_ratings,
        showDates: widgetProject.show_dates,
        showPhotos: widgetProject.show_photos,
        autoplaySpeed: widgetProject.autoplay_speed,
        allowedDomains: widgetProject.allowed_domains,
        colors: colors,
        fonts: fonts,
        layout: layout,
        sortBy: sortBy,
        maxReviewAge: maxReviewAge
    };
    
    // Business details
    let businessDetails = {
        name: '',
        address: '',
        rating: 0,
        totalRatings: 0
    };
    
    // Subscription tiers
    const subscriptionTiers = [
        { id: 'free', label: 'Free', maxReviews: 3, requestLimit: '10/min', cacheDuration: '24h' },
        { id: 'basic', label: 'Basic', maxReviews: 5, requestLimit: '30/min', cacheDuration: '12h' },
        { id: 'premium', label: 'Premium', maxReviews: 10, requestLimit: '60/min', cacheDuration: '6h' },
        { id: 'enterprise', label: 'Enterprise', maxReviews: 20, requestLimit: '120/min', cacheDuration: '1h' }
    ];
    
    let _selectedTier = subscriptionTiers.find(t => t.id === widgetProject.subscription_tier) || subscriptionTiers[0]; // Prefixed with underscore as it's not currently used
    
    // Bind values - Melt UI slider requires arrays for values
    let maxReviewsValue = [widgetConfig.maxReviews];
    let minRatingValue = [widgetConfig.minRating];
    
    // Watch for changes to slider values - extract first value from array
    $: widgetConfig.maxReviews = maxReviewsValue[0];
    $: widgetConfig.minRating = minRatingValue[0];
    
    // Generate embed code
    $: embedCode = generateEmbedCode(widgetConfig, widgetProject.api_key);
    
    /**
     * Fetch business details from a place ID
     */
    async function _fetchBusinessDetails(_placeId: string) { // Prefixed with underscore as it's not currently used
        try {
            // In a production environment, this would call your backend API that interfaces with Google Places API
            // For now, we'll use the existing mock or fetch real data
            businessDetails = {
                name: 'Business Name', // This would come from Google API
                address: '123 Main St, City, Country', // This would come from Google API
                rating: 4.5, // This would come from Google API
                totalRatings: 100 // This would come from Google API
            };
        } catch (error) {
            console.error('Error fetching business details:', error);
            toast.error('Failed to load business details');
        }
    }
    
    /**
     * Handle place selection from Google Places search
     */
    function _handlePlaceSelect(place) { // Prefixed with underscore as it's not currently used
        businessDetails = {
            name: place.name,
            address: place.formatted_address,
            rating: place.rating || 0,
            totalRatings: place.user_ratings_total || 0
        };
        _selectedPlace = place;
        toast.success(`Selected ${place.name}`);
    }
    
    /**
     * Generate embed code for the widget
     */
    function generateEmbedCode(config: WidgetPreviewConfig, apiKeyValue: string): string {
        const attributes = [
            `data-gr-place-id="${config.placeId}"`,
            `data-gr-api-key="${apiKeyValue}"`,
            `data-gr-display-mode="${config.displayMode}"`,
            `data-gr-theme="${config.theme}"`,
            `data-gr-max-reviews="${config.maxReviews}"`,
            `data-gr-min-rating="${config.minRating}"`,
            `data-gr-show-ratings="${config.showRatings}"`,
            `data-gr-show-dates="${config.showDates}"`,
            `data-gr-show-photos="${config.showPhotos}"`,
            `data-gr-sort-by="${config.sortBy}"`,
            `data-gr-max-review-age="${config.maxReviewAge}"`
        ];
        
        // Create the widget div
        const widgetDiv = `<div class="gr-widget" ${attributes.join(' ')}></div>`;
        
        // Create the script tag parts
        const s = 's'+'cript';
        
        // Combine everything
        return `${widgetDiv}\n<${s} src="${PUBLIC_SUPABASE_URL}/storage/v1/widget/gr-widget.min.js" async></${s}>`;
    }
    
    /**
     * Copy embed code to clipboard
     */
    function copyEmbedCode() {
        navigator.clipboard.writeText(embedCode)
            .then(() => {
                toast.success('Embed code copied to clipboard');
            })
            .catch(() => {
                toast.error('Failed to copy embed code');
            });
    }
    
    /**
     * Validate the form before submission
     */
    function validateForm() {
        const errors = { placeId: '' };
        
        if (!widgetConfig.placeId) {
            errors.placeId = 'Google Place ID is required';
        } else if (!/^Ch[A-Za-z0-9_-]{20,}$/.test(widgetConfig.placeId)) {
            errors.placeId = 'Invalid Google Place ID format';
        }
        
        validationErrors = errors;
        return !Object.values(errors).some(error => error);
    }
    
    /**
     * Handle form submission
     */
    async function handleSubmit() {
        if (!validateForm()) return;
        
        isSaving = true;
        
        try {
            // Convert allowed domains string to array for database
            const allowedDomainsArray = widgetConfig.allowedDomains === '*' ? 
                ['*'] : 
                widgetConfig.allowedDomains.split(',').map(domain => domain.trim());
            
            if (allowedDomainsArray.length === 0) {
                allowedDomainsArray.push('*');
            }
            
            // Update the widget in the database
            const { error } = await supabase
                .from('widget_projects')
                .update({
                    place_id: widgetConfig.placeId,
                    is_active: widgetConfig.isActive,
                    max_reviews: widgetConfig.maxReviews,
                    display_mode: widgetConfig.displayMode,
                    theme: widgetConfig.theme,
                    min_rating: widgetConfig.minRating,
                    show_ratings: widgetConfig.showRatings,
                    show_dates: widgetConfig.showDates,
                    show_photos: widgetConfig.showPhotos,
                    autoplay_speed: widgetConfig.autoplaySpeed,
                    allowed_domains: allowedDomainsArray,
                    custom_settings: {
                        colors: colors,
                        fonts: fonts,
                        layout: layout,
                        sortBy: sortBy,
                        maxReviewAge: maxReviewAge
                    }
                })
                .eq('id', widgetId);
                
            if (error) throw error;
            
            toast.success('Widget updated successfully');
            
            // Call the callback instead of using goto
            if (onSave) onSave();
        } catch (error) {
            console.error('Error updating widget:', error);
            toast.error('Failed to update widget');
        } finally {
            isSaving = false;
        }
    }
    
    /**
     * Delete the widget
     */
    async function deleteWidget() {
        try {
            const { error } = await supabase
                .from('widget_projects')
                .delete()
                .eq('id', widgetId);
                
            if (error) throw error;
            
            toast.success('Widget deleted successfully');
            
            // Call the callback instead of using goto
            if (onDelete) onDelete();
        } catch (error) {
            console.error('Error deleting widget:', error);
            toast.error('Failed to delete widget');
        }
    }
    
    // If we have a place ID, fetch business details
    if (widgetConfig.placeId && !isLoading) {
        _fetchBusinessDetails(widgetConfig.placeId);
    }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Configuration Form -->
    <div class="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Widget Configuration</CardTitle>
                <CardDescription>
                    Update your widget settings and configuration.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form class="space-y-6">
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <Label for="place-id">Google Place ID</Label>
                            <div class="flex gap-2">
                                <Input 
                                    id="place-id" 
                                    bind:value={widgetConfig.placeId}
                                    class={validationErrors.placeId ? 'border-red-500' : ''}
                                    disabled={isLoading}
                                />
                                <Button type="button" variant="outline" on:click={() => _fetchBusinessDetails(widgetConfig.placeId)}>
                                    Verify
                                </Button>
                            </div>
                            {#if validationErrors.placeId}
                                <p class="text-red-500 text-sm">{validationErrors.placeId}</p>
                            {/if}
                            <p class="text-sm text-muted-foreground">
                                Enter your Google Place ID to fetch your business reviews.
                            </p>
                        </div>
                        
                        {#if businessDetails.name}
                            <div class="bg-muted p-3 rounded-md">
                                <h4 class="font-medium">{businessDetails.name}</h4>
                                <p class="text-sm text-muted-foreground">{businessDetails.address}</p>
                                {#if businessDetails.rating > 0}
                                    <div class="flex items-center gap-2 mt-1">
                                        <div class="flex">
                                            {#each Array(5) as _, i}
                                                <span class="text-yellow-400 text-xs">
                                                    {#if i < Math.floor(businessDetails.rating)}
                                                        ★
                                                    {:else if i < businessDetails.rating}
                                                        ⋆
                                                    {:else}
                                                        ☆
                                                    {/if}
                                                </span>
                                            {/each}
                                        </div>
                                        <span class="text-sm text-muted-foreground">
                                            {businessDetails.rating.toFixed(1)} ({businessDetails.totalRatings} reviews)
                                        </span>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                        
                        <div class="space-y-2">
                            <Label for="is-active">Widget Status</Label>
                            <div class="flex items-center space-x-2">
                                <Switch id="is-active" bind:checked={widgetConfig.isActive} />
                                <Label for="is-active" class="cursor-pointer">
                                    {widgetConfig.isActive ? 'Active' : 'Inactive'}
                                </Label>
                            </div>
                            <p class="text-sm text-muted-foreground">
                                When inactive, the widget will not display on your website.
                            </p>
                        </div>
                        
                        <Separator class="my-6" />
                        
                        <Tabs value="display" class="w-full">
                            <TabsList>
                                <TabsTrigger value="display">Display</TabsTrigger>
                                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                                <TabsTrigger value="content">Content</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="display">
                                <div class="space-y-4 mt-4">
                                    <div class="space-y-2">
                                        <Label for="display-type">Display Type</Label>
                                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            <div class="flex">
                                                <RadioGroup bind:value={widgetConfig.displayMode}>
                                                    <div class="flex items-center space-x-2">
                                                        <RadioGroupItem value="carousel" id="carousel" />
                                                        <Label for="carousel">Carousel</Label>
                                                    </div>
                                                    <div class="flex items-center space-x-2">
                                                        <RadioGroupItem value="grid" id="grid" />
                                                        <Label for="grid">Grid</Label>
                                                    </div>
                                                    <div class="flex items-center space-x-2">
                                                        <RadioGroupItem value="list" id="list" />
                                                        <Label for="list">List</Label>
                                                    </div>
                                                    <div class="flex items-center space-x-2">
                                                        <RadioGroupItem value="badge" id="badge" />
                                                        <Label for="badge">Badge</Label>
                                                    </div>
                                                    <div class="flex items-center space-x-2">
                                                        <RadioGroupItem value="slider" id="slider" />
                                                        <Label for="slider">Slider</Label>
                                                    </div>
                                                    <div class="flex items-center space-x-2">
                                                        <RadioGroupItem value="floating-badge" id="floating-badge" />
                                                        <Label for="floating-badge">Floating Badge</Label>
                                                    </div>
                                                    <div class="flex items-center space-x-2">
                                                        <RadioGroupItem value="wall" id="wall" />
                                                        <Label for="wall">Review Wall</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label for="theme">Theme</Label>
                                        <Select bind:value={widgetConfig.theme}>
                                            <SelectTrigger class="w-full">
                                                <SelectValue placeholder="Select a theme" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="light">Light</SelectItem>
                                                <SelectItem value="dark">Dark</SelectItem>
                                                <SelectItem value="auto">Auto (System)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label for="autoplay-speed">Autoplay Speed (ms)</Label>
                                        <div class="flex items-center gap-2">
                                            {#if browser}
                                                <Slider 
                                                    id="autoplay-speed" 
                                                    bind:value={widgetConfig.autoplaySpeed} 
                                                    min={1000} 
                                                    max={10000} 
                                                    step={500}
                                                    class="flex-1"
                                                />
                                            {:else}
                                                <div class="h-4 bg-gray-200 rounded w-full"></div>
                                            {/if}
                                            <span class="w-16 text-right">{widgetConfig.autoplaySpeed}ms</span>
                                        </div>
                                        <p class="text-sm text-muted-foreground">
                                            Speed at which carousel slides change (in milliseconds).
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="appearance">
                                <div class="space-y-4 mt-4">
                                    <div class="space-y-2">
                                        <Label>Colors</Label>
                                        <div class="grid grid-cols-2 gap-4">
                                            <div class="space-y-2">
                                                <Label for="background-color" class="text-xs">Background</Label>
                                                <div class="flex gap-2 items-center">
                                                    <div class="h-6 w-6 rounded-md border" style="background-color: {colors.background}"></div>
                                                    <Input 
                                                        id="background-color" 
                                                        type="text" 
                                                        bind:value={colors.background} 
                                                        class="h-8"
                                                    />
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                <Label for="text-color" class="text-xs">Text</Label>
                                                <div class="flex gap-2 items-center">
                                                    <div class="h-6 w-6 rounded-md border" style="background-color: {colors.text}"></div>
                                                    <Input 
                                                        id="text-color" 
                                                        type="text" 
                                                        bind:value={colors.text} 
                                                        class="h-8"
                                                    />
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                <Label for="stars-color" class="text-xs">Stars</Label>
                                                <div class="flex gap-2 items-center">
                                                    <div class="h-6 w-6 rounded-md border" style="background-color: {colors.stars}"></div>
                                                    <Input 
                                                        id="stars-color" 
                                                        type="text" 
                                                        bind:value={colors.stars} 
                                                        class="h-8"
                                                    />
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                <Label for="links-color" class="text-xs">Links</Label>
                                                <div class="flex gap-2 items-center">
                                                    <div class="h-6 w-6 rounded-md border" style="background-color: {colors.links}"></div>
                                                    <Input 
                                                        id="links-color" 
                                                        type="text" 
                                                        bind:value={colors.links} 
                                                        class="h-8"
                                                    />
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                <Label for="buttons-color" class="text-xs">Buttons</Label>
                                                <div class="flex gap-2 items-center">
                                                    <div class="h-6 w-6 rounded-md border" style="background-color: {colors.buttons}"></div>
                                                    <Input 
                                                        id="buttons-color" 
                                                        type="text" 
                                                        bind:value={colors.buttons} 
                                                        class="h-8"
                                                    />
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                <Label for="border-color" class="text-xs">Border</Label>
                                                <div class="flex gap-2 items-center">
                                                    <div class="h-6 w-6 rounded-md border" style="background-color: {colors.border}"></div>
                                                    <Input 
                                                        id="border-color" 
                                                        type="text" 
                                                        bind:value={colors.border} 
                                                        class="h-8"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label>Typography</Label>
                                        <div class="space-y-4">
                                            <div class="space-y-2">
                                                <Label for="font-family" class="text-xs">Font Family</Label>
                                                <Input 
                                                    id="font-family" 
                                                    bind:value={fonts.family} 
                                                    placeholder="system-ui, -apple-system, sans-serif"
                                                />
                                            </div>
                                            <div class="grid grid-cols-2 gap-4">
                                                <div class="space-y-2">
                                                    <Label for="title-size" class="text-xs">Title Size</Label>
                                                    <Input 
                                                        id="title-size" 
                                                        bind:value={fonts.titleSize} 
                                                        placeholder="18px"
                                                    />
                                                </div>
                                                <div class="space-y-2">
                                                    <Label for="text-size" class="text-xs">Text Size</Label>
                                                    <Input 
                                                        id="text-size" 
                                                        bind:value={fonts.textSize} 
                                                        placeholder="14px"
                                                    />
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                <Label for="font-weight" class="text-xs">Font Weight</Label>
                                                <Select bind:value={fonts.weight}>
                                                    <SelectTrigger class="w-full">
                                                        <SelectValue placeholder="Select font weight" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="bold">Bold</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label>Container</Label>
                                        <div class="grid grid-cols-2 gap-4">
                                            <div class="space-y-2">
                                                <Label for="layout-padding" class="text-xs">Padding</Label>
                                                <Input 
                                                    id="layout-padding" 
                                                    bind:value={layout.padding} 
                                                    placeholder="16px" 
                                                />
                                            </div>
                                            <div class="space-y-2">
                                                <Label for="layout-border-radius" class="text-xs">Border Radius</Label>
                                                <Input 
                                                    id="layout-border-radius" 
                                                    bind:value={layout.borderRadius} 
                                                    placeholder="8px" 
                                                />
                                            </div>
                                            <div class="space-y-2">
                                                <Label for="layout-spacing" class="text-xs">Spacing</Label>
                                                <Input 
                                                    id="layout-spacing" 
                                                    bind:value={layout.spacing} 
                                                    placeholder="16px" 
                                                />
                                            </div>
                                            <div class="space-y-2">
                                                <Label for="layout-max-height" class="text-xs">Max Height</Label>
                                                <Input 
                                                    id="layout-max-height" 
                                                    bind:value={layout.maxHeight} 
                                                    placeholder="600px" 
                                                />
                                            </div>
                                            <div class="space-y-2">
                                                <Label for="layout-width" class="text-xs">Width</Label>
                                                <Input 
                                                    id="layout-width" 
                                                    bind:value={layout.width} 
                                                    placeholder="100%" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="content">
                                <div class="space-y-4 mt-4">
                                    <div class="space-y-2">
                                        <Label for="max-reviews">Maximum Reviews</Label>
                                        <div class="flex items-center gap-2">
                                            {#if browser}
                                                <Slider 
                                                    id="max-reviews" 
                                                    bind:value={widgetConfig.maxReviews} 
                                                    min={1} 
                                                    max={20} 
                                                    step={1}
                                                    class="flex-1"
                                                />
                                            {:else}
                                                <div class="h-4 bg-gray-200 rounded w-full"></div>
                                            {/if}
                                            <span class="w-8 text-right">{widgetConfig.maxReviews}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label for="min-rating">Minimum Rating</Label>
                                        <div class="flex items-center gap-2">
                                            {#if browser}
                                                <Slider 
                                                    id="min-rating" 
                                                    bind:value={widgetConfig.minRating} 
                                                    min={0} 
                                                    max={5} 
                                                    step={1}
                                                    class="flex-1"
                                                />
                                            {:else}
                                                <div class="h-4 bg-gray-200 rounded w-full"></div>
                                            {/if}
                                            <span class="w-8 text-right">{widgetConfig.minRating} ★</span>
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label for="sort-by">Sort Reviews By</Label>
                                        <Select bind:value={sortBy}>
                                            <SelectTrigger class="w-full">
                                                <SelectValue placeholder="Select sort order" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="newest">Newest First</SelectItem>
                                                <SelectItem value="highest">Highest Rating First</SelectItem>
                                                <SelectItem value="lowest">Lowest Rating First</SelectItem>
                                                <SelectItem value="relevant">Most Relevant</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label for="max-review-age">Maximum Review Age (days)</Label>
                                        <div class="flex items-center gap-2">
                                            {#if browser}
                                                <Slider 
                                                    id="max-review-age" 
                                                    bind:value={maxReviewAge} 
                                                    min={30} 
                                                    max={730} 
                                                    step={30}
                                                    class="flex-1"
                                                />
                                            {:else}
                                                <div class="h-4 bg-gray-200 rounded w-full"></div>
                                            {/if}
                                            <span class="w-16 text-right">{maxReviewAge} days</span>
                                        </div>
                                        <p class="text-sm text-muted-foreground">
                                            Only show reviews from the last {maxReviewAge} days
                                        </p>
                                    </div>
                                    
                                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div class="flex items-center space-x-2">
                                            <Switch id="show-ratings" bind:checked={widgetConfig.showRatings} />
                                            <Label for="show-ratings">Show Ratings</Label>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <Switch id="show-dates" bind:checked={widgetConfig.showDates} />
                                            <Label for="show-dates">Show Dates</Label>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <Switch id="show-photos" bind:checked={widgetConfig.showPhotos} />
                                            <Label for="show-photos">Show Photos</Label>
                                        </div>
                                    </div>
                                    
                                    <Separator class="my-4" />
                                    
                                    <div class="space-y-2">
                                        <Label for="allowed-domains">Domain Restrictions</Label>
                                        <Textarea 
                                            id="allowed-domains" 
                                            bind:value={widgetConfig.allowedDomains} 
                                            placeholder="example.com, sub.example.com"
                                            rows="3"
                                            class="w-full"
                                        />
                                        <div class="text-sm text-muted-foreground flex items-start gap-2">
                                            <AlertCircle class="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <span>
                                                Enter domains where this widget can be embedded, one per line or comma-separated.
                                                Use <code class="bg-muted px-1 rounded">*</code> to allow all domains, or <code class="bg-muted px-1 rounded">*.example.com</code> to allow all subdomains of example.com.
                                                Leave empty to restrict to your own domain only.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </form>
            </CardContent>
            <CardFooter class="flex justify-between gap-2">
                <div class="flex gap-2">
                    <Button variant="outline" on:click={() => showDeleteConfirm = true} class="text-red-500 hover:text-red-700">
                        <Trash2 class="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                    <Button variant="ghost" on:click={onCancel}>
                        Cancel
                    </Button>
                </div>
                
                <Button on:click={handleSubmit} disabled={isSaving}>
                    {#if isSaving}
                        <div class="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                    {:else}
                        <Save class="mr-2 h-4 w-4" />
                        Save Changes
                    {/if}
                </Button>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Embed Code</CardTitle>
                <CardDescription>
                    Copy this code to embed the widget on your website.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div class="bg-muted rounded-md p-4 relative">
                    <pre class="text-xs overflow-x-auto whitespace-pre-wrap">{embedCode}</pre>
                    <Button
                        variant="ghost"
                        size="icon"
                        on:click={copyEmbedCode}
                        class="absolute top-2 right-2"
                    >
                        <Copy class="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
    
    <!-- Live Preview -->
    <div>
        <Card class="sticky top-4">
            <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                    Preview how your widget will appear on your website.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div class="border rounded-md p-4 bg-background">
                    <!-- We would render our widget here -->
                    <WidgetPreview config={widgetConfig} />
                </div>
            </CardContent>
            <CardFooter class="text-sm text-muted-foreground">
                This is a preview using sample data. The actual widget will display your real Google reviews.
            </CardFooter>
        </Card>
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
                <Button variant="outline" on:click={() => showDeleteConfirm = false}>
                    Cancel
                </Button>
                <Button variant="destructive" on:click={deleteWidget}>
                    Delete
                </Button>
            </div>
        </div>
    </div>
{/if}

<Toaster />

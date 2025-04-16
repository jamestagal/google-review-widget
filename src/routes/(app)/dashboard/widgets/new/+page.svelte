<script lang="ts">
    import { enhance } from '$app/forms';
    import { onMount } from 'svelte';
    import DashboardShell from '../../../components/dashboard-shell.svelte';
    import * as Button from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import * as Input from '$lib/components/ui/input';
    import * as Label from '$lib/components/ui/label';
    import * as Textarea from '$lib/components/ui/textarea';
    import * as Separator from '$lib/components/ui/separator';
    import * as Tabs from '$lib/components/ui/tabs';
    import { AlertCircle, ArrowLeft, Check, Copy } from 'lucide-svelte';
    import type { SupabaseClient, User } from '@supabase/supabase-js';
    import GooglePlacesSearch from '$lib/components/google-places-search.svelte';
    import type { GooglePlace } from '$lib/types/google-places.types';
    import WidgetPreview from '../components/widget-preview.svelte';
    
    // Get data from the parent load function
    export let data: { supabase: SupabaseClient };
    const { supabase } = data;
    
    // Authentication states
    let user: User | null = null;
    let loading = true;
    let error: Error | null = null;
    let formError = '';
    let isSubmitting = false;
    
    // Widget creation result states
    let creationSuccess = false;
    let apiKey = null;
    let embedCode = '';
    
    // Business profile data
    let businessProfile = {
        googlePlaceId: '',
        businessName: '',
        businessAddress: ''
    };
    
    // Track selected place from Google Places search
    let selectedPlace: GooglePlace | null = null;
    
    // Handle place selection
    function handlePlaceSelect(event: CustomEvent<GooglePlace>) {
        const place = event.detail;
        selectedPlace = place;
        businessProfile.googlePlaceId = place.place_id;
        businessProfile.businessName = place.name;
        businessProfile.businessAddress = place.formatted_address;
    }
    
    // Widget configuration
    let displayType = 'carousel';
    let theme = 'light';
    let allowedDomains = '*';
    let maxReviews = 3;
    let minRating = 0;
    let showRatings = true;
    let showDates = true;
    let showPhotos = true;
    let autoplaySpeed = 5000;
    
    // Visual customization
    let colors = {
        background: '#ffffff',
        text: '#333333',
        stars: '#FFD700',
        links: '#0070f3',
        buttons: '#0070f3',
        border: '#e5e7eb',
        shadow: 'rgba(0, 0, 0, 0.1)'
    };
    
    // Font customization
    let fonts = {
        family: 'system-ui, -apple-system, sans-serif',
        titleSize: '18px',
        textSize: '14px',
        weight: 'normal'
    };
    
    // Layout customization
    let layout = {
        padding: '16px',
        borderRadius: '8px',
        spacing: '16px',
        maxHeight: '600px',
        width: '100%'
    };
    
    // Review sorting
    let sortBy = 'newest';
    let maxReviewAge = 365; // days
    
    // Create widget preview config that updates reactively
    $: widgetPreviewConfig = {
        placeId: businessProfile.googlePlaceId || 'ChIJN1t_tDeuEmsRUsoyG83frY4', // Default sample place ID if none selected
        displayMode: displayType,
        theme: theme,
        maxReviews: maxReviews,
        minRating: minRating,
        showRatings: showRatings,
        showDates: showDates,
        showPhotos: showPhotos,
        autoplaySpeed: autoplaySpeed,
        colors: colors,
        fonts: fonts,
        layout: layout,
        sortBy: sortBy,
        maxReviewAge: maxReviewAge
    };
    
    // Use secure authentication method (getUser instead of getSession)
    onMount(async () => {
        try {
            // Use getUser() for secure authentication
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            user = authUser;
            
            console.log('User authenticated successfully:', user?.email);
        } catch (e) {
            error = e;
            console.error('Authentication error:', e);
        } finally {
            loading = false;
        }
    });
    
    // Generate embed code based on widget configuration
    function generateEmbedCode(apiKey: string, placeId: string): string {
        return `<div class="gr-widget" 
  data-gr-place-id="${placeId}" 
  data-gr-api-key="${apiKey}" 
  data-gr-display-mode="${displayType}" 
  data-gr-theme="${theme}"
  data-gr-max-reviews="${maxReviews}"
  data-gr-min-rating="${minRating}"
  data-gr-show-ratings="${showRatings}"
  data-gr-show-dates="${showDates}"
  data-gr-show-photos="${showPhotos}"
  data-gr-sort-by="${sortBy}"
  data-gr-max-review-age="${maxReviewAge}"
></div>
<${'script'} src="https://cdn.example.com/google-reviews-widget.min.js" async></${'script'}>`;
    }
    
    // Copy embed code to clipboard
    function copyEmbedCode(): void {
        navigator.clipboard.writeText(embedCode)
            .then(() => {
                alert('Embed code copied to clipboard');
            })
            .catch(err => {
                console.error('Failed to copy embed code:', err);
                alert('Failed to copy embed code');
            });
    }
</script>

{#if loading}
<DashboardShell showBreadcrumbs={false}>
    <div class="flex justify-center items-center p-8">
        <div class="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        <span class="ml-3">Loading your account information...</span>
    </div>
</DashboardShell>
{:else if error || !user}
<DashboardShell showBreadcrumbs={false}>
    <div class="bg-red-100 border border-red-300 text-red-700 p-4 rounded-md">
        <h3 class="font-semibold">Authentication Required</h3>
        <p>You need to be logged in to create a widget. <a href="/login" class="text-blue-600 underline">Sign in</a></p>
        {#if error}
            <p class="text-sm mt-2">Error details: {error.message}</p>
        {/if}
    </div>
</DashboardShell>
{:else}
<DashboardShell showBreadcrumbs={false}>
    <!-- Debug output to verify user authentication -->
    <pre class="text-xs bg-gray-100 p-2 my-2 rounded">Debug: User authenticated as {user.email}</pre>
    
    <div class="flex items-center mb-4">
        <Button.Root variant="ghost" href="/dashboard/widgets" class="mr-2">
            <ArrowLeft class="h-4 w-4 mr-1" />
            Back
        </Button.Root>
        <h1 class="text-2xl font-bold">Create New Widget</h1>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Configuration Form -->
        <div class="space-y-6">
            <Card.Root>
                <Card.Header>
                    <Card.Title>Widget Configuration</Card.Title>
                    <Card.Description>
                        Enter your Google Place ID and customize how your reviews will appear.
                    </Card.Description>
                </Card.Header>
                <Card.Content>
                    {#if formError}
                        <div class="bg-red-100 text-red-700 p-2 rounded mb-4">
                            <AlertCircle class="h-4 w-4 inline mr-1" />
                            {formError}
                        </div>
                    {/if}
                    
                    {#if creationSuccess}
                        <div class="bg-green-100 text-green-700 p-4 rounded mb-4 border border-green-300">
                            <Check class="h-5 w-5 inline mr-2" />
                            <span class="font-semibold">Widget created successfully!</span>
                            <p class="mt-2">Use the embed code below to add the widget to your website.</p>
                            
                            <div class="mt-4 p-3 bg-gray-100 rounded relative">
                                <pre class="text-xs overflow-auto whitespace-pre-wrap">{embedCode}</pre>
                                <button 
                                    class="absolute top-2 right-2 p-1 bg-gray-200 rounded hover:bg-gray-300"
                                    on:click={copyEmbedCode}
                                >
                                    <Copy class="h-4 w-4" />
                                </button>
                            </div>
                            
                            <div class="mt-4">
                                <Button.Root variant="outline" href="/dashboard/widgets">
                                    View All Widgets
                                </Button.Root>
                            </div>
                        </div>
                    {:else}
                        <form method="POST" action="?/createWidget" use:enhance={({ formData, cancel }) => {
                            // Validate form
                            if (!businessProfile.googlePlaceId) {
                                formError = 'Google Place ID is required';
                                cancel();
                                return;
                            }
                            
                            if (!businessProfile.businessName) {
                                formError = 'Business name is required';
                                cancel();
                                return;
                            }
                            
                            // Add user ID and form data
                            if (user?.id) {
                                formData.append('userId', user.id);
                            } else {
                                formError = 'User authentication required';
                                cancel();
                                return;
                            }
                            
                            // Add fields from our form
                            formData.append('placeId', businessProfile.googlePlaceId);
                            formData.append('businessName', businessProfile.businessName);
                            formData.append('businessAddress', businessProfile.businessAddress || '');
                            formData.append('displayType', displayType);
                            formData.append('theme', theme);
                            formData.append('allowedDomains', allowedDomains);
                            formData.append('maxReviews', maxReviews.toString());
                            formData.append('minRating', minRating.toString());
                            formData.append('showRatings', showRatings.toString());
                            formData.append('showDates', showDates.toString());
                            formData.append('showPhotos', showPhotos.toString());
                            formData.append('autoplaySpeed', autoplaySpeed.toString());
                            formData.append('colors', JSON.stringify(colors));
                            formData.append('fonts', JSON.stringify(fonts));
                            formData.append('layout', JSON.stringify(layout));
                            formData.append('sortBy', sortBy);
                            formData.append('maxReviewAge', maxReviewAge.toString());
                            
                            isSubmitting = true;
                            formError = '';
                            
                            return async ({ result }) => {
                                isSubmitting = false;
                                
                                console.log('Form submission result:', result);
                                
                                if (result.type === 'success' && result.data?.success) {
                                    creationSuccess = true;
                                    apiKey = result.data.apiKey;
                                    // Store widget details in the console for debugging
                                    console.log('Widget created:', result.data.widget);
                                    // Make sure apiKey and placeId are strings for the embed code
                                    if (typeof apiKey === 'string' && businessProfile.googlePlaceId) {
                                        embedCode = generateEmbedCode(apiKey, businessProfile.googlePlaceId);
                                    } else {
                                        console.error('Invalid API key or Place ID type', { apiKey, placeId: businessProfile.googlePlaceId });
                                    }
                                } else if (result.type === 'failure') {
                                    formError = result.data?.error || 'Failed to create widget';
                                }
                            };
                        }} class="space-y-4">
                        <div class="space-y-2">
                            <Label.Root for="google-place-search">Business Search <span class="text-red-500">*</span></Label.Root>
                            <GooglePlacesSearch
                                id="google-place-search"
                                bind:value={businessProfile.googlePlaceId}
                                bind:selectedPlace={selectedPlace}
                                on:select={handlePlaceSelect}
                                on:clear={() => {
                                    businessProfile.googlePlaceId = '';
                                    businessProfile.businessName = '';
                                    businessProfile.businessAddress = '';
                                    selectedPlace = null;
                                }}
                                placeholder="Search for your business..."
                            />
                            <div class="text-sm text-gray-500">
                                Search for your business by name and location to automatically fill in the business details.
                            </div>
                            
                            {#if selectedPlace}
                                <div class="mt-2 p-3 bg-gray-100 rounded-md">
                                    <h4 class="font-medium">{selectedPlace.name}</h4>
                                    <p class="text-sm text-gray-600">{selectedPlace.formatted_address}</p>
                                    {#if selectedPlace.rating}
                                    <div class="flex items-center gap-2 mt-1">
                                        <div class="flex">
                                            {#each Array(5) as _, i}
                                            <span class="text-yellow-400 text-xs">
                                                {#if i < Math.floor(selectedPlace.rating)}
                                                ★
                                                {:else if i < selectedPlace.rating}
                                                ⋆
                                                {:else}
                                                ☆
                                                {/if}
                                            </span>
                                            {/each}
                                        </div>
                                        <span class="text-sm text-gray-600">
                                            {selectedPlace.rating.toFixed(1)} ({selectedPlace.user_ratings_total} reviews)
                                        </span>
                                    </div>
                                    {/if}
                                </div>
                            {/if}
                            
                            <!-- Keep manual entry option as a fallback -->
                            <details class="mt-3 text-sm">
                                <summary class="cursor-pointer text-blue-600 hover:text-blue-800">Advanced: Enter Place ID manually</summary>
                                <div class="mt-2 pl-2 border-l-2 border-gray-200">
                                    <Label.Root for="place-id">Google Place ID</Label.Root>
                                    <Input.Root 
                                        id="place-id"
                                        bind:value={businessProfile.googlePlaceId}
                                        placeholder="Enter your Google Place ID"
                                    />
                                    <div class="text-sm text-gray-500">
                                        You can find your Place ID by searching for your business on
                                        <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" class="text-blue-600 hover:underline">Google's Place ID Finder</a>.
                                    </div>
                                </div>
                            </details>
                        </div>

                        <div class="space-y-2">
                            <Label.Root for="business-name">Business Name <span class="text-red-500">*</span></Label.Root>
                            <Input.Root 
                                id="business-name"
                                bind:value={businessProfile.businessName}
                                placeholder="Enter your business name"
                            />
                        </div>

                        <div class="space-y-2">
                            <Label.Root for="business-address">Business Address (Optional)</Label.Root>
                            <Textarea.Root 
                                id="business-address" 
                                bind:value={businessProfile.businessAddress}
                                placeholder="Enter your business address (optional)"
                            />
                        </div>
                        
                        <Separator.Root class="my-6" />
                        
                        <Tabs.Root value="display" class="w-full">
                            <Tabs.List>
                                <Tabs.Trigger value="display">Display</Tabs.Trigger>
                                <Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
                                <Tabs.Trigger value="content">Content</Tabs.Trigger>
                            </Tabs.List>
                            
                            <Tabs.Content value="display">
                                <div class="space-y-4 mt-4">
                                    <div class="space-y-2">
                                        <Label.Root for="display-type">Display Type</Label.Root>
                                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            <label class="flex items-center space-x-2">
                                                <input type="radio" bind:group={displayType} value="carousel" id="display-carousel" />
                                                <span>Carousel</span>
                                            </label>
                                            <label class="flex items-center space-x-2">
                                                <input type="radio" bind:group={displayType} value="grid" id="display-grid" />
                                                <span>Grid</span>
                                            </label>
                                            <label class="flex items-center space-x-2">
                                                <input type="radio" bind:group={displayType} value="list" id="display-list" />
                                                <span>List</span>
                                            </label>
                                            <label class="flex items-center space-x-2">
                                                <input type="radio" bind:group={displayType} value="badge" id="display-badge" />
                                                <span>Badge</span>
                                            </label>
                                            <label class="flex items-center space-x-2">
                                                <input type="radio" bind:group={displayType} value="slider" id="display-slider" />
                                                <span>Slider</span>
                                            </label>
                                            <label class="flex items-center space-x-2">
                                                <input type="radio" bind:group={displayType} value="floating-badge" id="display-floating-badge" />
                                                <span>Floating Badge</span>
                                            </label>
                                            <label class="flex items-center space-x-2">
                                                <input type="radio" bind:group={displayType} value="review-wall" id="display-review-wall" />
                                                <span>Review Wall</span>
                                            </label>
                                        </div>
                                        <div class="text-sm text-gray-500">
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
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label.Root for="theme">Theme</Label.Root>
                                        <div class="flex gap-4">
                                            <label class="flex items-center space-x-2">
                                                <input type="radio" bind:group={theme} value="light" id="theme-light" />
                                                <span>Light</span>
                                            </label>
                                            <label class="flex items-center space-x-2">
                                                <input type="radio" bind:group={theme} value="dark" id="theme-dark" />
                                                <span>Dark</span>
                                            </label>
                                            <label class="flex items-center space-x-2">
                                                <input type="radio" bind:group={theme} value="auto" id="theme-auto" />
                                                <span>Auto</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label.Root for="layout-width">Widget Width</Label.Root>
                                        <Input.Root 
                                            id="layout-width" 
                                            bind:value={layout.width} 
                                            placeholder="100%" 
                                        />
                                        <div class="text-sm text-gray-500">
                                            Use percentage (e.g., 100%) or pixels (e.g., 500px)
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label.Root for="layout-max-height">Maximum Height</Label.Root>
                                        <Input.Root 
                                            id="layout-max-height" 
                                            bind:value={layout.maxHeight} 
                                            placeholder="600px" 
                                        />
                                        <div class="text-sm text-gray-500">
                                            Maximum height for the widget (use 'auto' or pixels)
                                        </div>
                                    </div>
                                </div>
                            </Tabs.Content>
                            
                            <Tabs.Content value="appearance">
                                <div class="space-y-4 mt-4">
                                    <div class="space-y-2">
                                        <Label.Root>Colors</Label.Root>
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label.Root for="color-background" class="text-sm">Background</Label.Root>
                                                <div class="flex items-center gap-2">
                                                    <input 
                                                        type="color" 
                                                        id="color-background" 
                                                        bind:value={colors.background} 
                                                        class="w-8 h-8 rounded-md border"
                                                    />
                                                    <Input.Root 
                                                        value={colors.background} 
                                                        on:input={(e) => colors.background = e.currentTarget.value}
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
                                                        bind:value={colors.text} 
                                                        class="w-8 h-8 rounded-md border"
                                                    />
                                                    <Input.Root 
                                                        value={colors.text} 
                                                        on:input={(e) => colors.text = e.currentTarget.value}
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
                                                        bind:value={colors.stars} 
                                                        class="w-8 h-8 rounded-md border"
                                                    />
                                                    <Input.Root 
                                                        value={colors.stars} 
                                                        on:input={(e) => colors.stars = e.currentTarget.value}
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
                                                        bind:value={colors.buttons} 
                                                        class="w-8 h-8 rounded-md border"
                                                    />
                                                    <Input.Root 
                                                        value={colors.buttons} 
                                                        on:input={(e) => colors.buttons = e.currentTarget.value}
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
                                                        bind:value={fonts.titleSize} 
                                                        placeholder="18px" 
                                                    />
                                                </div>
                                                <div>
                                                    <Label.Root for="font-text-size" class="text-sm">Text Size</Label.Root>
                                                    <Input.Root 
                                                        id="font-text-size" 
                                                        bind:value={fonts.textSize} 
                                                        placeholder="14px" 
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <Label.Root for="font-weight" class="text-sm">Font Weight</Label.Root>
                                                <select 
                                                    id="font-weight" 
                                                    bind:value={fonts.weight} 
                                                    class="w-full p-2 border rounded-md"
                                                >
                                                    <option value="normal">Normal</option>
                                                    <option value="bold">Bold</option>
                                                    <option value="light">Light</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label.Root>Container Styling</Label.Root>
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label.Root for="layout-padding" class="text-sm">Padding</Label.Root>
                                                <Input.Root 
                                                    id="layout-padding" 
                                                    bind:value={layout.padding} 
                                                    placeholder="16px" 
                                                />
                                            </div>
                                            <div>
                                                <Label.Root for="layout-border-radius" class="text-sm">Border Radius</Label.Root>
                                                <Input.Root 
                                                    id="layout-border-radius" 
                                                    bind:value={layout.borderRadius} 
                                                    placeholder="8px" 
                                                />
                                            </div>
                                            <div>
                                                <Label.Root for="layout-spacing" class="text-sm">Spacing</Label.Root>
                                                <Input.Root 
                                                    id="layout-spacing" 
                                                    bind:value={layout.spacing} 
                                                    placeholder="16px" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Tabs.Content>
                            
                            <Tabs.Content value="content">
                                <div class="space-y-4 mt-4">
                                    <div class="space-y-2">
                                        <Label.Root for="max-reviews">Maximum Reviews ({maxReviews})</Label.Root>
                                        <div class="flex items-center gap-2">
                                            <input 
                                                type="range" 
                                                id="max-reviews" 
                                                bind:value={maxReviews} 
                                                min="1" 
                                                max="10" 
                                                class="w-full"
                                            />
                                            <span class="text-sm font-medium">{maxReviews}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label.Root for="min-rating">Minimum Rating ({minRating} stars)</Label.Root>
                                        <div class="flex items-center gap-2">
                                            <input 
                                                type="range" 
                                                id="min-rating" 
                                                bind:value={minRating} 
                                                min="0" 
                                                max="5" 
                                                step="1" 
                                                class="w-full"
                                            />
                                            <span class="text-sm font-medium">{minRating} stars</span>
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <Label.Root for="sort-by">Sort Reviews By</Label.Root>
                                        <select 
                                            id="sort-by" 
                                            bind:value={sortBy} 
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
                                                bind:value={maxReviewAge} 
                                                min="30" 
                                                max="365" 
                                                step="30" 
                                                class="w-full"
                                            />
                                            <span class="text-sm font-medium">{maxReviewAge} days</span>
                                        </div>
                                        <div class="text-sm text-gray-500">
                                            Only show reviews from the last {maxReviewAge} days
                                        </div>
                                    </div>
                                    
                                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div class="flex items-center space-x-2">
                                            <input 
                                                type="checkbox" 
                                                id="show-ratings" 
                                                bind:checked={showRatings}
                                                class="form-checkbox h-4 w-4"
                                            />
                                            <Label.Root for="show-ratings">Show Ratings</Label.Root>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <input 
                                                type="checkbox" 
                                                id="show-dates" 
                                                bind:checked={showDates}
                                                class="form-checkbox h-4 w-4"
                                            />
                                            <Label.Root for="show-dates">Show Dates</Label.Root>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <input 
                                                type="checkbox" 
                                                id="show-photos" 
                                                bind:checked={showPhotos}
                                                class="form-checkbox h-4 w-4"
                                            />
                                            <Label.Root for="show-photos">Show Photos</Label.Root>
                                        </div>
                                    </div>
                                    
                                    <Separator.Root class="my-4" />
                                    
                                    <div class="space-y-2">
                                        <Label.Root for="allowed-domains">Domain Restrictions</Label.Root>
                                        <Textarea.Root 
                                            id="allowed-domains" 
                                            bind:value={allowedDomains} 
                                            placeholder="example.com, sub.example.com"
                                            rows="3"
                                            class="w-full"
                                        />
                                        <div class="text-sm text-gray-500 flex items-start gap-2">
                                            <AlertCircle class="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <span>
                                                Enter domains where this widget can be embedded, one per line or comma-separated.
                                                Use <code class="bg-gray-100 px-1 rounded">*</code> to allow all domains, or <code class="bg-gray-100 px-1 rounded">*.example.com</code> to allow all subdomains of example.com.
                                                Leave empty to restrict to your own domain only.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Tabs.Content>
                        </Tabs.Root>
                        
                        <div class="mt-6">
                            <Button.Root type="submit" disabled={isSubmitting}>
                                {#if isSubmitting}
                                    <div class="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                    Creating...
                                {:else}
                                    Create Widget
                                {/if}
                            </Button.Root>
                        </div>
                    </form>
                    {/if}
                </Card.Content>
            </Card.Root>
        </div>
        
        <!-- Live Preview -->
        <div>
            <Card.Root>
                <Card.Header>
                    <Card.Title>Live Preview</Card.Title>
                    <Card.Description>See how your widget will appear on your website</Card.Description>
                </Card.Header>
                <Card.Content>
                    <div class="border rounded-md p-4 bg-white dark:bg-gray-800 min-h-[400px]">
                        <WidgetPreview 
                            config={widgetPreviewConfig} 
                            businessName={businessProfile.businessName || (selectedPlace ? selectedPlace.name : '')}
                        />
                    </div>
                </Card.Content>
                <Card.Footer>
                    <p class="text-sm text-gray-500">
                        This is a preview using sample data. The actual widget will display your real Google reviews.
                    </p>
                </Card.Footer>
            </Card.Root>
        </div>
    </div>
</DashboardShell>
{/if}

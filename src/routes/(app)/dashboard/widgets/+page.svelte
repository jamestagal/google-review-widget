<script lang="ts">
    import * as Button from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import * as Tabs from '$lib/components/ui/tabs';
    import * as Select from '$lib/components/ui/select';
    import * as Input from '$lib/components/ui/input';
    import { PlusCircle, ExternalLink, Star, Settings, Copy, Search, ChevronLeft, ChevronRight } from 'lucide-svelte';
    import { createBrowserClient } from '@supabase/ssr';
    import DashboardShell from '../../components/dashboard-shell.svelte';
    import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { onMount, afterUpdate } from 'svelte';
    import { toast } from 'svelte-sonner';
    
    // Define interface for Google Review Widgets
    interface ReviewWidget {
        id: string;
        name: string;
        place_id: string;
        place_name?: string;
        api_key: string;
        theme: string;
        display_mode: string;
        max_reviews: number;
        min_rating: number;
        created_at: string;
        updated_at: string;
        views_count: number;
        user_id: string;
        embed_count: number;
    }
    
    // Access initial data from the server component
    let { 
        widgets = [], 
        totalCount = 0, 
        pageSize: initialPageSize = 10, 
        page: initialPage = 1, 
        totalPages: initialTotalPages = 1, 
        sortBy: initialSortBy = 'created_at', 
        sortOrder: initialSortOrder = 'desc', 
        filterName: initialFilterName = '' 
    } = $page.data;
    
    // Local state for controlling UI
    let isLoading = false;
    let currentPage = initialPage;
    let pageSize = initialPageSize;
    let totalPages = initialTotalPages;
    let sortBy = initialSortBy;
    let sortOrder = initialSortOrder;
    let searchTerm = initialFilterName;
    let timeoutId: ReturnType<typeof setTimeout>;
    let isInitialized = false;
    let inputEl: HTMLInputElement; // Reference to the search input element
    
    // Create Supabase client for data fetching
    const supabase = createBrowserClient(
      PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY
    );
    
    const sortOptions = [
        { label: 'Newest first', value: 'created_at:desc' },
        { label: 'Oldest first', value: 'created_at:asc' },
        { label: 'Name (A-Z)', value: 'name:asc' },
        { label: 'Name (Z-A)', value: 'name:desc' },
        { label: 'Most views', value: 'views_count:desc' },
        { label: 'Least views', value: 'views_count:asc' }
    ];
    
    const pageSizeOptions = [
        { label: '5 per page', value: '5' },
        { label: '10 per page', value: '10' },
        { label: '20 per page', value: '20' },
        { label: '50 per page', value: '50' }
    ];
    
    // Initialize component
    onMount(async () => {
        if (browser) {
            // Check URL parameters on initial load
            const url = new URL(window.location.href);
            const urlPage = parseInt(url.searchParams.get('page') || '1');
            const urlPageSize = parseInt(url.searchParams.get('pageSize') || '10');
            const urlSortBy = url.searchParams.get('sortBy') || 'created_at';
            const urlSortOrder = url.searchParams.get('sortOrder') || 'desc';
            const urlName = url.searchParams.get('name') || '';
            
            // Set local state from URL params if they exist
            currentPage = urlPage;
            pageSize = urlPageSize;
            sortBy = urlSortBy;
            sortOrder = urlSortOrder;
            searchTerm = urlName;
            
            isInitialized = true;
        }
    });
    
    // Watch for page data changes and update local state
    $: if ($page.data && isInitialized) {
        widgets = $page.data.widgets || [];
        totalCount = $page.data.totalCount || 0;
        totalPages = $page.data.totalPages || 1;
        isLoading = false;
    }
    
    // Update page URL with new search params and fetch new data
    async function updateFilterAndFetch() {
        if (!browser || !isInitialized) return;
        
        isLoading = true;
        
        try {
            // Construct URL with all parameters
            const url = new URL(window.location.href);
            url.searchParams.set('page', currentPage.toString());
            url.searchParams.set('pageSize', pageSize.toString());
            url.searchParams.set('sortBy', sortBy);
            url.searchParams.set('sortOrder', sortOrder);
            
            if (searchTerm) {
                url.searchParams.set('name', searchTerm);
            } else {
                url.searchParams.delete('name');
            }
            
            // Navigate to the new URL, which will trigger a reload
            // Use replaceState to avoid adding to browser history
            await goto(url.toString(), { 
                replaceState: true, 
                noScroll: true,
                keepFocus: true // Important: This keeps focus on the active element
            });
        } catch (error) {
            console.error('Error updating filters:', error);
            toast.error('Failed to update filters. Please try again.');
            isLoading = false;
        }
    }
    
    // Handle changing sort order
    function handleSortChange(value: string) {
        if (!value) return;
        
        const [newSortBy, newSortOrder] = value.split(':');
        sortBy = newSortBy;
        sortOrder = newSortOrder;
        currentPage = 1; // Reset to first page on sort change
        updateFilterAndFetch();
    }
    
    // Handle changing page size
    function handlePageSizeChange(value: string) {
        if (!value) return;
        
        const newPageSize = parseInt(value);
        if (isNaN(newPageSize) || newPageSize < 1) return;
        
        pageSize = newPageSize;
        currentPage = 1; // Reset to first page on page size change
        updateFilterAndFetch();
    }
    
    // Handle search input with debounce
    function handleSearchInput() {
        // Debounce the search
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            currentPage = 1; // Reset to first page on search
            updateFilterAndFetch();
        }, 300);
    }
    
    // Handle page navigation
    function goToPage(newPage: number) {
        if (newPage < 1 || newPage > totalPages) return;
        
        currentPage = newPage;
        updateFilterAndFetch();
    }
    
    // Function to create a new widget
    function createNewWidget() {
        goto('/dashboard/widgets/new');
    }
    
    // Function to copy embed code
    function copyEmbedCode(widget: ReviewWidget) {
        // Avoid template literals for script tags to prevent parsing issues
        const widgetProps = [
            `data-gr-api-key="${widget.api_key}"`,
            `data-gr-place-id="${widget.place_id}"`,
            `data-gr-theme="${widget.theme}"`,
            `data-gr-display="${widget.display_mode}"`
        ].join(' ');
        
        // Create the embed code parts separately to avoid parsing issues
        const widgetDiv = `<div class="gr-widget" ${widgetProps}></div>`;
        const scriptTag = '<' + 'script src="' + window.location.origin + '/widget.js" async></' + 'script>';
        const embedCode = widgetDiv + '\n' + scriptTag;
        
        navigator.clipboard.writeText(embedCode)
            .then(() => {
                toast.success('Embed code copied to clipboard!');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                toast.error('Could not copy embed code.');
            });
    }
    
    // Function to view widget preview
    function openPreview(widget: ReviewWidget) {
        const previewUrl = `/dashboard/widgets/debug?apiKey=${widget.api_key}&placeId=${widget.place_id}&displayMode=${widget.display_mode}&theme=${widget.theme}&maxReviews=${widget.max_reviews}&minRating=${widget.min_rating}`;
        window.open(previewUrl, '_blank');
    }
</script>

<svelte:head>
    <title>Widgets - Google Reviews Widget</title>
</svelte:head>

<DashboardShell showBreadcrumbs={false}>
    
    <div class="flex items-center justify-between mb-4">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Google Reviews Widgets</h2>
            <p class="text-muted-foreground">
                Create and customize widgets to display Google reviews on your website.
            </p>
        </div>
        <div class="flex items-center gap-2">
            <Button.Root on:click={createNewWidget}>
                <PlusCircle class="mr-2 h-4 w-4" />
                New Widget
            </Button.Root>
        </div>
    </div>

    <Tabs.Tabs defaultValue="widgets" class="space-y-4">
        <Tabs.TabsList>
            <Tabs.TabsTrigger value="widgets">My Widgets</Tabs.TabsTrigger>
            <Tabs.TabsTrigger value="usage">Usage & Analytics</Tabs.TabsTrigger>
        </Tabs.TabsList>
        
        <Tabs.TabsContent value="widgets" class="space-y-4">
            <!-- Search and filter controls -->
            <Card.Root>
                <Card.Content class="pt-4">
                    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <!-- Search filter -->
                        <div class="flex items-center space-x-2">
                            <div class="grid flex-1 gap-2">
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Search class="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <Input.Input 
                                        bind:this={inputEl}
                                        placeholder="Search widgets..." 
                                        bind:value={searchTerm} 
                                        on:input={handleSearchInput}
                                        class="pl-10" 
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Sort options -->
                        <div class="flex items-center space-x-2">
                            <Select.Root 
                                value={sortBy + ":" + sortOrder} 
                            >
                                <Select.Trigger class="w-full">
                                    <Select.Value />
                                </Select.Trigger>
                                <Select.Content>
                                    {#each sortOptions as option}
                                        <Select.Item 
                                            value={option.value}
                                            on:click={() => handleSortChange(option.value)}
                                        >
                                            {option.label}
                                        </Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>

                        <!-- Page size -->
                        <div class="flex items-center space-x-2">
                            <Select.Root 
                                value={pageSize.toString()} 
                            >
                                <Select.Trigger class="w-full">
                                    <Select.Value />
                                </Select.Trigger>
                                <Select.Content>
                                    {#each pageSizeOptions as option}
                                        <Select.Item 
                                            value={option.value}
                                            on:click={() => handlePageSizeChange(option.value)}
                                        >
                                            {option.label}
                                        </Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                    </div>
                </Card.Content>
            </Card.Root>

            {#if isLoading}
                <div class="flex justify-center p-8">
                    <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            {:else if widgets.length === 0}
                <Card.Root>
                    <Card.Content class="pt-6">
                        <div class="flex flex-col items-center justify-center py-12 text-center">
                            <div class="mb-4 rounded-full bg-blue-50 p-3 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                <Star class="h-8 w-8" />
                            </div>
                            <h3 class="mb-2 text-xl font-semibold">No widgets found</h3>
                            <p class="mb-6 max-w-md text-muted-foreground">
                                {searchTerm ? `No widgets matching "${searchTerm}"` : 'Create your first Google Reviews widget to showcase testimonials on your website'}
                            </p>
                            <Button.Root on:click={createNewWidget}>
                                <PlusCircle class="mr-2 h-4 w-4" />
                                Create {searchTerm ? 'New' : 'Your First'} Widget
                            </Button.Root>
                        </div>
                    </Card.Content>
                </Card.Root>
            {:else}
                <!-- Widget listing -->
                <div class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                    {#each widgets as widget}
                        <Card.Root>
                            <Card.Header>
                                <div class="flex justify-between items-center">
                                    <Card.Title>{widget.name}</Card.Title>
                                    <div class="flex gap-1">
                                        <Button.Root 
                                            variant="ghost" 
                                            size="icon" 
                                            href={`/dashboard/widgets/${widget.id}`}
                                            aria-label="Edit widget"
                                        >
                                            <Settings class="h-4 w-4" />
                                        </Button.Root>
                                        <Button.Root 
                                            variant="ghost" 
                                            size="icon" 
                                            on:click={() => openPreview(widget)}
                                            aria-label="Preview widget"
                                        >
                                            <ExternalLink class="h-4 w-4" />
                                        </Button.Root>
                                    </div>
                                </div>
                                <Card.Description>
                                    {widget.place_name || 'Google Place'} • {widget.display_mode} • {widget.theme}
                                </Card.Description>
                            </Card.Header>
                            <Card.Content>
                                <div class="grid grid-cols-3 gap-4 text-center text-sm">
                                    <div>
                                        <div class="font-semibold">{widget.views_count}</div>
                                        <div class="text-muted-foreground">Views</div>
                                    </div>
                                    <div>
                                        <div class="font-semibold">{widget.embed_count}</div>
                                        <div class="text-muted-foreground">Embeds</div>
                                    </div>
                                    <div>
                                        <div class="font-semibold">{widget.max_reviews}</div>
                                        <div class="text-muted-foreground">Reviews</div>
                                    </div>
                                </div>
                            </Card.Content>
                            <Card.Footer class="flex justify-between">
                                <div class="text-xs text-muted-foreground">
                                    Created {new Date(widget.created_at).toLocaleDateString()}
                                </div>
                                <Button.Root size="sm" variant="outline" on:click={() => copyEmbedCode(widget)}>
                                    <Copy class="mr-2 h-3 w-3" />
                                    Embed Code
                                </Button.Root>
                            </Card.Footer>
                        </Card.Root>
                    {/each}
                </div>
                
                <!-- Pagination controls -->
                {#if totalPages > 1}
                    <div class="flex items-center justify-between mt-6">
                        <div class="text-sm text-muted-foreground">
                            Showing {widgets.length} of {totalCount} widgets
                        </div>
                        <div class="flex items-center space-x-2">
                            <Button.Root 
                                variant="outline" 
                                size="sm" 
                                disabled={currentPage === 1} 
                                on:click={() => goToPage(currentPage - 1)}
                            >
                                <ChevronLeft class="h-4 w-4 mr-1" />
                                Previous
                            </Button.Root>
                            
                            <div class="flex items-center space-x-1">
                                {#if currentPage > 2}
                                    <Button.Root variant="outline" size="sm" on:click={() => goToPage(1)}>1</Button.Root>
                                {/if}
                                
                                {#if currentPage > 3}
                                    <span class="text-muted-foreground">...</span>
                                {/if}
                                
                                {#if currentPage > 1}
                                    <Button.Root variant="outline" size="sm" on:click={() => goToPage(currentPage - 1)}>
                                        {currentPage - 1}
                                    </Button.Root>
                                {/if}
                                
                                <Button.Root variant="default" size="sm">{currentPage}</Button.Root>
                                
                                {#if currentPage < totalPages}
                                    <Button.Root variant="outline" size="sm" on:click={() => goToPage(currentPage + 1)}>
                                        {currentPage + 1}
                                    </Button.Root>
                                {/if}
                                
                                {#if currentPage < totalPages - 2}
                                    <span class="text-muted-foreground">...</span>
                                {/if}
                                
                                {#if currentPage < totalPages - 1}
                                    <Button.Root variant="outline" size="sm" on:click={() => goToPage(totalPages)}>
                                        {totalPages}
                                    </Button.Root>
                                {/if}
                            </div>
                            
                            <Button.Root 
                                variant="outline" 
                                size="sm" 
                                disabled={currentPage === totalPages} 
                                on:click={() => goToPage(currentPage + 1)}
                            >
                                Next
                                <ChevronRight class="h-4 w-4 ml-1" />
                            </Button.Root>
                        </div>
                    </div>
                {/if}
            {/if}
        </Tabs.TabsContent>
        
        <Tabs.TabsContent value="usage" class="space-y-4">
            <Card.Root>
                <Card.Header>
                    <Card.Title>Usage & Analytics</Card.Title>
                    <Card.Description>
                        Track how your widgets are performing across your sites.
                    </Card.Description>
                </Card.Header>
                <Card.Content>
                    <div class="text-center py-8 text-muted-foreground">
                        <p>Widget analytics will be available soon.</p>
                    </div>
                </Card.Content>
            </Card.Root>
        </Tabs.TabsContent>
    </Tabs.Tabs>
</DashboardShell>
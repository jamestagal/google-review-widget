<script lang="ts">
    import { toast } from 'svelte-sonner';
    import { 
        Card, 
        CardHeader, 
        CardTitle, 
        CardDescription, 
        CardContent, 
        CardFooter 
    } from '$lib/components/ui/card';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Search, Plus, Star, ExternalLink, MoreHorizontal, Filter, ChevronLeft, ChevronRight } from 'lucide-svelte';
    import * as Tabs from '$lib/components/ui/tabs';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import * as Tooltip from '$lib/components/ui/tooltip';
    import { Badge } from '$lib/components/ui/badge';

    // Import widgets from the parent component's props
    export let data;
    const { widgets = [] } = data;

    // Widget search and filter state
    let searchQuery = '';
    let selectedStatus = 'all';
    let selectedTab = 'widgets';

    // Pagination state
    let currentPage = 1;
    let itemsPerPage = 9;
    let totalPages = 1;

    // Filtered widgets based on search and status
    $: filteredWidgets = widgets.filter(widget => {
        const matchesSearch = searchQuery === '' || 
            widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            widget.domain?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = selectedStatus === 'all' || widget.status === selectedStatus;
        
        return matchesSearch && matchesStatus;
    });

    // Calculate total pages
    $: totalPages = Math.ceil(filteredWidgets.length / itemsPerPage);
    
    // Get current page items
    $: paginatedWidgets = filteredWidgets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to first page when filters change
    $: {
        if (searchQuery || selectedStatus) {
            currentPage = 1;
        }
    }

    // Pagination functions
    function goToPage(page: number) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
        }
    }

    function goToNextPage() {
        if (currentPage < totalPages) {
            currentPage++;
        }
    }

    function goToPreviousPage() {
        if (currentPage > 1) {
            currentPage--;
        }
    }

    // Function to create a new widget
    function createNewWidget() {
        window.location.href = '/dashboard/widgets/new';
    }

    // Function to view widget details
    function viewWidgetDetails(widgetId) {
        window.location.href = `/dashboard/widgets/${widgetId}`;
    }

    // Function to copy widget embed code
    function copyEmbedCode(widget) {
        // Manually construct the embed code to avoid issues with script tags
        const tag1 = '<';
        const tag2 = 'script';
        const tag3 = ' src="';
        const tag4 = '">';
        const tag5 = '</';
        const tag6 = '>';
        const embedCode = tag1 + tag2 + tag3 + window.location.origin + '/embed/' + widget.id + '.js' + tag4 + tag5 + tag2 + tag6;
        
        navigator.clipboard.writeText(embedCode)
            .then(() => {
                toast.success('Embed code copied to clipboard');
            })
            .catch(() => {
                toast.error('Failed to copy embed code');
            });
    }

    // Function to preview widget
    function previewWidget(widgetId) {
        window.open(`/preview/${widgetId}`, '_blank');
    }
</script>

<svelte:head>
    <title>Widgets Dashboard - Google Review Widget</title>
</svelte:head>

<div class="container mx-auto py-6 px-4 max-w-7xl">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold tracking-tight">Widgets</h1>
        <Button on:click={createNewWidget}>
            <Plus class="mr-2 h-4 w-4" />
            Create Widget
        </Button>
    </div>

    <Tabs.Root value={selectedTab} onValueChange={(value) => selectedTab = value}>
        <Tabs.List class="mb-6">
            <Tabs.Trigger value="widgets">Widgets</Tabs.Trigger>
            <Tabs.Trigger value="templates">Templates</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="widgets">
            <!-- Search and filter -->
            <div class="flex flex-col sm:flex-row gap-4 mb-6">
                <div class="relative flex-1">
                    <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="search" 
                        placeholder="Search widgets..." 
                        class="pl-8"
                        bind:value={searchQuery}
                    />
                </div>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                        <Button variant="outline" builders={[builder]}>
                            <Filter class="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        <DropdownMenu.Label>Status</DropdownMenu.Label>
                        <DropdownMenu.RadioGroup value={selectedStatus} onValueChange={(value) => selectedStatus = value}>
                            <DropdownMenu.RadioItem value="all">All</DropdownMenu.RadioItem>
                            <DropdownMenu.RadioItem value="active">Active</DropdownMenu.RadioItem>
                            <DropdownMenu.RadioItem value="inactive">Inactive</DropdownMenu.RadioItem>
                            <DropdownMenu.RadioItem value="draft">Draft</DropdownMenu.RadioItem>
                        </DropdownMenu.RadioGroup>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </div>

            <!-- Widget grid -->
            {#if paginatedWidgets.length === 0}
                <div class="text-center py-12">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Star class="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 class="text-lg font-medium mb-2">No widgets found</h3>
                    <p class="text-muted-foreground mb-4">
                        {searchQuery || selectedStatus !== 'all' 
                            ? 'Try adjusting your search or filter criteria' 
                            : 'Create your first widget to get started'}
                    </p>
                    {#if !searchQuery && selectedStatus === 'all'}
                        <Button on:click={createNewWidget}>
                            <Plus class="mr-2 h-4 w-4" />
                            Create Widget
                        </Button>
                    {/if}
                </div>
            {:else}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {#each paginatedWidgets as widget}
                        <Card>
                            <CardHeader class="pb-3">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <CardTitle class="text-lg">{widget.name}</CardTitle>
                                        <CardDescription>
                                            {widget.domain || 'No domain set'}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={widget.status === 'active' ? 'default' : widget.status === 'inactive' ? 'secondary' : 'outline'}>
                                        {widget.status || 'Draft'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent class="pb-3">
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p class="text-muted-foreground">Reviews</p>
                                        <p class="font-medium">{widget.reviewCount || 0}</p>
                                    </div>
                                    <div>
                                        <p class="text-muted-foreground">Rating</p>
                                        <p class="font-medium flex items-center">
                                            {widget.averageRating?.toFixed(1) || '0.0'}
                                            <Star class="h-4 w-4 text-yellow-500 ml-1" />
                                        </p>
                                    </div>
                                    <div>
                                        <p class="text-muted-foreground">Views</p>
                                        <p class="font-medium">{widget.views || 0}</p>
                                    </div>
                                    <div>
                                        <p class="text-muted-foreground">Created</p>
                                        <p class="font-medium">{new Date(widget.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter class="flex justify-between">
                                <Button variant="outline" size="sm" on:click={() => viewWidgetDetails(widget.id)}>
                                    Edit
                                </Button>
                                <div class="flex gap-2">
                                    <Tooltip.Root>
                                        <Tooltip.Trigger asChild let:builder>
                                            <Button variant="ghost" size="icon" builders={[builder]} on:click={() => previewWidget(widget.id)}>
                                                <ExternalLink class="h-4 w-4" />
                                            </Button>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content>Preview</Tooltip.Content>
                                    </Tooltip.Root>
                                    
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger asChild let:builder>
                                            <Button variant="ghost" size="icon" builders={[builder]}>
                                                <MoreHorizontal class="h-4 w-4" />
                                            </Button>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content align="end">
                                            <DropdownMenu.Item on:click={() => copyEmbedCode(widget)}>
                                                Copy embed code
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item on:click={() => viewWidgetDetails(widget.id)}>
                                                Edit settings
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Separator />
                                            <DropdownMenu.Item class="text-red-600">
                                                Delete widget
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                </div>
                            </CardFooter>
                        </Card>
                    {/each}
                </div>
                <div class="flex justify-between items-center mt-6">
                    <div class="text-sm text-muted-foreground">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredWidgets.length)} - 
                        {Math.min(currentPage * itemsPerPage, filteredWidgets.length)} of {filteredWidgets.length} widgets
                    </div>
                    <div class="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            on:click={goToPreviousPage} 
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft class="h-4 w-4" />
                        </Button>
                        
                        {#if totalPages <= 7}
                            {#each Array(totalPages) as _, page}
                                <Button 
                                    variant={currentPage === page + 1 ? 'default' : 'outline'} 
                                    size="sm" 
                                    on:click={() => goToPage(page + 1)}
                                >
                                    {page + 1}
                                </Button>
                            {/each}
                        {:else}
                            <!-- First page -->
                            <Button 
                                variant={currentPage === 1 ? 'default' : 'outline'} 
                                size="sm" 
                                on:click={() => goToPage(1)}
                            >
                                1
                            </Button>
                            
                            <!-- Ellipsis if needed -->
                            {#if currentPage > 3}
                                <span class="px-2">...</span>
                            {/if}
                            
                            <!-- Pages around current page -->
                            {#each Array(Math.min(3, totalPages)) as _, i}
                                {#if currentPage > 2 && currentPage < totalPages - 1}
                                    {@const pageNum = currentPage - 1 + i}
                                    {#if pageNum > 1 && pageNum < totalPages}
                                        <Button 
                                            variant={currentPage === pageNum ? 'default' : 'outline'} 
                                            size="sm" 
                                            on:click={() => goToPage(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    {/if}
                                {/if}
                            {/each}
                            
                            <!-- Ellipsis if needed -->
                            {#if currentPage < totalPages - 2}
                                <span class="px-2">...</span>
                            {/if}
                            
                            <!-- Last page -->
                            <Button 
                                variant={currentPage === totalPages ? 'default' : 'outline'} 
                                size="sm" 
                                on:click={() => goToPage(totalPages)}
                            >
                                {totalPages}
                            </Button>
                        {/if}
                        
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            on:click={goToNextPage} 
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            {/if}
        </Tabs.Content>
        
        <Tabs.Content value="templates">
            <div class="text-center py-12">
                <h3 class="text-lg font-medium mb-2">Widget Templates Coming Soon</h3>
                <p class="text-muted-foreground mb-4">
                    We're working on adding pre-designed templates to help you get started quickly.
                </p>
            </div>
        </Tabs.Content>
    </Tabs.Root>
</div>

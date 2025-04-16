<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import { Search, X } from 'lucide-svelte';
    import { createEventDispatcher, onMount } from 'svelte';
    import type { GooglePlace } from '$lib/types/google-places.types';

    // Props
    export let placeholder = "Search for a business...";
    export let value = "";
    export let selectedPlace: GooglePlace | null = null;
    export let id: string = ""; // Add id prop for accessibility
    
    // State
    let searchInput = "";
    let searchResults: GooglePlace[] = [];
    let isLoading = false;
    let showResults = false;
    
    const dispatch = createEventDispatcher<{
        select: GooglePlace;
        clear: void;
    }>();

    onMount(async () => {
        // Initialize with existing value if available
        if (value) {
            searchInput = value;
            
            // If we have a place ID but no selected place, try to fetch its details
            if (value && !selectedPlace) {
                await fetchPlaceDetails(value);
            }
        }
    });

    // Fetch details for an existing place ID
    async function fetchPlaceDetails(placeId: string) {
        try {
            isLoading = true;
            
            const response = await fetch(`/api/places/details?place_id=${encodeURIComponent(placeId)}`);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.result) {
                selectedPlace = data.result;
                searchInput = data.result.name;
            }
        } catch (error) {
            console.error('Error fetching place details:', error);
        } finally {
            isLoading = false;
        }
    }

    // Search for places using our secure API endpoint
    async function handleSearch() {
        if (!searchInput.trim()) return;
        
        isLoading = true;
        showResults = true;
        searchResults = []; // Clear previous results
        
        try {
            const response = await fetch(`/api/places/search?query=${encodeURIComponent(searchInput)}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API error (${response.status}):`, errorText);
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.error) {
                console.error('API returned error:', data.error, data.details || '');
                throw new Error(data.error);
            }
            
            searchResults = data.results || [];
            console.log(`Found ${searchResults.length} places for query: ${searchInput}`);
        } catch (error) {
            console.error('Error searching for places:', error);
            searchResults = [];
        } finally {
            isLoading = false;
        }
    }

    function selectPlace(place: GooglePlace) {
        selectedPlace = place;
        searchInput = place.name;
        showResults = false;
        value = place.place_id;
        dispatch('select', place);
    }

    function clearSearch() {
        searchInput = "";
        searchResults = [];
        selectedPlace = null;
        value = "";
        showResults = false;
        dispatch('clear');
    }

    function handleInputKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearch();
        }
    }

    function handleClickOutside(event: MouseEvent) {
        // Only run in browser context
        if (typeof document === 'undefined') return;
        
        const target = event.target as Node;
        const containerId = id || 'google-places-search-container';
        const searchContainer = document.getElementById(containerId);
        
        if (searchContainer && !searchContainer.contains(target)) {
            showResults = false;
        }
    }

    // Set up click outside listener - only in browser environment
    let isBrowser = typeof window !== 'undefined';
    
    $: if (isBrowser && showResults) {
        document.addEventListener('mousedown', handleClickOutside);
    } else if (isBrowser) {
        document.removeEventListener('mousedown', handleClickOutside);
    }
</script>

<div id={id || "google-places-search-container"} class="relative w-full">
    <div class="relative">
        <Input
            type="text"
            bind:value={searchInput}
            on:keydown={handleInputKeydown}
            {placeholder}
            class="pr-16"
        />
        <div class="absolute right-1 top-1 flex gap-1">
            {#if searchInput}
            <Button 
                variant="ghost" 
                size="icon" 
                class="h-8 w-8" 
                on:click={clearSearch}
                aria-label="Clear search"
            >
                <X class="h-4 w-4" />
            </Button>
            {/if}
            <Button 
                variant="secondary" 
                size="icon" 
                class="h-8 w-8" 
                on:click={handleSearch}
                disabled={isLoading}
                aria-label="Search"
            >
                <Search class="h-4 w-4" />
            </Button>
        </div>
    </div>
    
    {#if showResults}
    <div class="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
        {#if isLoading}
        <div class="py-4 text-center">
            <div class="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p class="text-sm mt-2">Searching...</p>
        </div>
        {:else if searchResults.length === 0}
        <div class="p-4 text-center text-muted-foreground">
            <p>No results found. Try another search term.</p>
        </div>
        {:else}
        <ul class="max-h-60 overflow-auto p-0 m-0">
            {#each searchResults as place}
            <li>
                <button 
                    type="button"
                    class="w-full text-left px-4 py-2 hover:bg-accent transition-colors flex flex-col gap-1"
                    on:click={() => selectPlace(place)}
                >
                    <span class="font-medium">{place.name}</span>
                    <span class="text-sm text-muted-foreground truncate">{place.formatted_address}</span>
                    {#if place.rating !== undefined}
                    <div class="flex items-center gap-2">
                        <div class="flex">
                            {#each Array(5) as _, i}
                            <span class="text-yellow-400 text-xs">
                                {#if place.rating && i < Math.floor(place.rating)}
                                ★
                                {:else if place.rating && i < place.rating}
                                ⋆
                                {:else}
                                ☆
                                {/if}
                            </span>
                            {/each}
                        </div>
                        <span class="text-xs text-muted-foreground">
                            {place.rating.toFixed(1)} ({place.user_ratings_total || 0} reviews)
                        </span>
                    </div>
                    {/if}
                </button>
            </li>
            {/each}
        </ul>
        {/if}
    </div>
    {/if}
</div>

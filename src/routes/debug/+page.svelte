<script lang="ts">
    import { onMount } from 'svelte';
    
    // Track dynamic component loading errors
    let loadingErrors: string[] = [];
    let componentInfo: Record<string, any> = {};
    
    // Function to safely check if something is a valid component
    function isValidSvelteComponent(component: any): boolean {
        return component !== null && 
               component !== undefined && 
               typeof component === 'function' &&
               (component.prototype?.$$ !== undefined || component.$$);
    }
    
    // Test component loading
    onMount(() => {
        // The ThemeSwitchButton import was removed as it doesn't exist in this project
        // and was causing build failures
            
        // Load alert dialog components
        import('$lib/components/ui/alert-dialog/alert-dialog-content.svelte')
            .then(module => {
                componentInfo['AlertDialogContent'] = {
                    loaded: true,
                    isValidComponent: isValidSvelteComponent(module.default),
                    type: typeof module.default
                };
            })
            .catch(error => {
                loadingErrors.push(`Failed to load AlertDialogContent: ${error.message}`);
            });
    });
</script>

<div class="container mx-auto p-8">
    <h1 class="text-2xl font-bold mb-6">Svelte Component Debugging Page</h1>
    
    <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Component Loading Status</h2>
        {#if Object.keys(componentInfo).length === 0}
            <p class="text-amber-600">Loading components...</p>
        {:else}
            <div class="grid gap-4">
                {#each Object.entries(componentInfo) as [name, info]}
                    <div class="border p-4 rounded-md">
                        <h3 class="font-medium">{name}</h3>
                        <ul class="mt-2 space-y-1">
                            <li>Loaded: <span class={info.loaded ? "text-green-600" : "text-red-600"}>{info.loaded ? "✓" : "✗"}</span></li>
                            <li>Valid Svelte Component: <span class={info.isValidComponent ? "text-green-600" : "text-red-600"}>{info.isValidComponent ? "✓" : "✗"}</span></li>
                            <li>Type: {info.type}</li>
                        </ul>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
    
    {#if loadingErrors.length > 0}
        <div class="mt-8">
            <h2 class="text-xl font-semibold mb-4 text-red-600">Loading Errors</h2>
            <ul class="list-disc pl-5 space-y-2">
                {#each loadingErrors as error}
                    <li class="text-red-600">{error}</li>
                {/each}
            </ul>
        </div>
    {/if}
    
    <div class="mt-8 p-4 bg-gray-100 rounded-md">
        <h2 class="text-xl font-semibold mb-4">Fixing Steps</h2>
        <ol class="list-decimal pl-5 space-y-3">
            <li>Add validation checks before using <code>&lt;svelte:component&gt;</code> tags</li>
            <li>Check component imports for valid paths</li>
            <li>Make sure the Supabase database permissions are correctly set (see SQL fix)</li>
            <li>Clear browser cache and restart the dev server</li>
        </ol>
    </div>
</div>

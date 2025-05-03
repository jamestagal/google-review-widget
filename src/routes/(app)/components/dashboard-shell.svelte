<script lang="ts">
    // A layout component that provides consistent UI shell for dashboard pages
    // import Breadcrumbs from './breadcrumbs.svelte';
    
    // Optional props
    // export let showBreadcrumbs = true;
</script>

<div class="container mx-auto py-6 px-4 max-w-7xl">
<!--     {#if showBreadcrumbs}
        <Breadcrumbs />
    {/if} -->
    
    <div class="dashboard-content">
        <slot />
    </div>
</div>

<style>
    .dashboard-content {
        width: 100%;
        /* max-width: 1200px; */
        margin: 0 auto;
    }
</style>

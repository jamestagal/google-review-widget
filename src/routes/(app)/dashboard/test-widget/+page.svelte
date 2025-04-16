<script lang="ts">
    import { page } from '$app/stores';
    import DashboardShell from '../../components/dashboard-shell.svelte';
    import * as Card from '$lib/components/ui/card';
    import * as Button from '$lib/components/ui/button';
</script>

<svelte:head>
    <title>Test Widget Page</title>
</svelte:head>

<DashboardShell>
    <div class="flex items-center mb-4">
        <h2 class="text-3xl font-bold tracking-tight">Test Widget Page</h2>
    </div>
    
    <Card.Root>
        <Card.Header>
            <Card.Title>Basic Test</Card.Title>
            <Card.Description>
                This is a simplified test page to check if the dashboard shell works correctly.
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <div class="space-y-4">
                <p>This is a basic test to see if the dashboard shell and routing are working correctly.</p>
                
                {#if $page.data.user}
                    <div class="bg-green-100 p-4 rounded-md border border-green-200">
                        <h3 class="font-semibold text-green-800">User Authentication Working</h3>
                        <p>User ID: {$page.data.user.id}</p>
                        <p>Email: {$page.data.user.email}</p>
                    </div>
                {:else}
                    <div class="bg-yellow-100 p-4 rounded-md border border-yellow-200">
                        <h3 class="font-semibold text-yellow-800">Not Authenticated</h3>
                        <p>User session not detected.</p>
                    </div>
                {/if}
            </div>
        </Card.Content>
        <Card.Footer>
            <Button.Root variant="outline" href="/dashboard/widgets">
                Back to Widgets
            </Button.Root>
        </Card.Footer>
    </Card.Root>
</DashboardShell>
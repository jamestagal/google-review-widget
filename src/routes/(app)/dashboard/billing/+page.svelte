<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import * as Button from '$lib/components/ui/button';
    import { CreditCard, CheckCircle, ChevronRight } from 'lucide-svelte';
    import DashboardShell from '../../components/dashboard-shell.svelte';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    // Get data from the server
    export let data;
    
    // Use user data securely from the parent layout
    $: user = $page.data.user;
    // Get subscription and products from Stripe via server
    $: products = data.products || [];
    $: currentSubscriptions = data.currentSubscriptions || [];
    
    // Process product data for display
    $: withDefaultPrices = products.map((product) => {
        return {
            ...product,
            prices: product.prices.filter(
                (price) => price.id === product.default_price.id,
            ),
        };
    });

    $: currentSubscriptionsPrices = currentSubscriptions
        ? currentSubscriptions
                .map((subscription) => {
                    return subscription.items.data.map(({ price }) => price);
                })
                .flat(1)
        : [];
    
    // Fallback for demo if no products are available
    $: hasProducts = products && products.length > 0;
    
    // Sample plans for display in case Stripe data is unavailable
    let fallbackPlans = [
        {
            id: 'free',
            name: 'Starlite Starter Free',
            description: '1 widget, 200 views/month, Starlite branding, limited features',
            price: 'A$0',
            interval: '/month',
            features: [
                'Everything from free tier',
                'Good kickstart for your product'
            ],
            isCurrent: true,
            color: 'bg-blue-50 text-blue-600'
        },
        {
            id: 'basic',
            name: 'Starlite Basic',
            description: '3 widgets, 5,000 views/month, no branding, basic support',
            price: 'A$5',
            interval: '/month',
            features: [
                'Everything from free',
                'Warm fuzzy feeling for both of us'
            ],
            isCurrent: false,
            color: 'bg-violet-50 text-violet-600',
            recommended: true
        },
        {
            id: 'pro',
            name: 'Starlite Pro',
            description: '5 widgets, 50,000 views/month, 3 projects, 1 collaborator, priority support',
            price: 'A$10',
            interval: '/month',
            features: [
                'Everything from free and "Say thanks"',
                'Logo cloud spot',
                'Your logo in the README'
            ],
            isCurrent: false,
            color: 'bg-orange-50 text-orange-600'
        }
    ];

    // Function to view and manage a subscription
    function manageSubscription() {
        goto('/settings/billing');
    }

    // Function to upgrade to a plan
    function upgradeToPlan(planId: string) {
        goto(`/settings/billing?plan=${planId}`);
    }
    
    // Determine if a price is current based on user's subscriptions
    function isPriceCurrent(priceId: string): boolean {
        return currentSubscriptionsPrices.findIndex((p) => p.id === priceId) > -1 ||
            (priceId === 'price_free' && (!currentSubscriptions || currentSubscriptions.length <= 0));
    }
</script>

<svelte:head>
    <title>Billing & Plans | Google Reviews Widget</title>
</svelte:head>

<DashboardShell showBreadcrumbs={false}>
    <div class="flex justify-between items-center mb-6">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Billing & Plans</h2>
            <p class="text-muted-foreground">
                Manage your subscription and view billing details
            </p>
        </div>
        <a href="/settings/billing" class="text-sm text-primary hover:underline inline-flex items-center">
            View in Settings
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
        </a>
    </div>

    <!-- Current Subscription -->
    <Card.Root class="mb-8">
        <Card.Header>
            <Card.Title class="flex items-center gap-2">
                <CreditCard class="h-5 w-5" />
                Current Subscription
            </Card.Title>
            <Card.Description>
                Your current plan and subscription details
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                    <div class="font-semibold text-lg mb-1">Starlite Starter Free</div>
                    <div class="text-muted-foreground text-sm">1 widget, 200 views/month, Starlite branding</div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircle class="mr-1 h-3 w-3" />
                        Active
                    </span>
                    <Button.Root variant="outline" on:click={manageSubscription}>
                        Manage Subscription
                    </Button.Root>
                </div>
            </div>
        </Card.Content>
    </Card.Root>

    <!-- Available Plans -->
    <h3 class="text-xl font-semibold mb-4">Available Plans</h3>
    
    <!-- Display Stripe Products if available -->
    {#if hasProducts}
        <div class="grid gap-6 md:grid-cols-3">
            {#each withDefaultPrices as product}
                {#each product.prices as price}
                    {@const isFree = price.unit_amount === 0}
                    {@const isCurrent = isPriceCurrent(price.id)}
                    <Card.Root class="relative {product.name.includes('Pro') ? 'border-2 border-primary' : ''}">
                        {#if product.name.includes('Pro')}
                            <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 z-10">
                                <span class="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">Recommended</span>
                            </div>
                        {/if}
                        <Card.Header>
                            <Card.Title tag="h4">{product.name}</Card.Title>
                            <Card.Description>
                                {product.description || `${product.name} subscription plan`}
                            </Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <div class="mb-4">
                                <span class="text-3xl font-bold">
                                    {price.currency.toUpperCase()} {(price.unit_amount / 100).toFixed(2)}
                                </span>
                                <span class="text-muted-foreground">/{price.recurring?.interval || 'month'}</span>
                            </div>
                            <ul class="space-y-2">
                                {#each (product.metadata?.features || '').split(',') as feature}
                                    {#if feature.trim()}
                                        <li class="flex items-start">
                                            <svg class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>{feature.trim()}</span>
                                        </li>
                                    {/if}
                                {/each}
                            </ul>
                        </Card.Content>
                        <Card.Footer>
                            <Button.Root 
                                variant={isCurrent ? 'outline' : 'default'} 
                                class="w-full" 
                                disabled={isCurrent}
                                on:click={() => upgradeToPlan(product.id)}
                            >
                                {isCurrent ? 'Current Plan' : isFree ? 'Downgrade' : 'Upgrade'}
                            </Button.Root>
                        </Card.Footer>
                    </Card.Root>
                {/each}
            {/each}
        </div>
    {:else}
        <!-- Fallback to sample plans when Stripe data isn't available -->
        <div class="grid gap-6 md:grid-cols-3">
            {#each fallbackPlans as plan}
                <Card.Root class={plan.recommended ? 'border-2 border-primary relative' : ''}>
                    {#if plan.recommended}
                        <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 z-10">
                            <span class="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">Recommended</span>
                        </div>
                    {/if}
                    <Card.Header>
                        <div class="flex items-center justify-between">
                            <div class={`${plan.color} p-2 rounded-full w-10 h-10 flex items-center justify-center`}>
                                <span class="font-bold">{plan.id.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <Card.Title>{plan.name}</Card.Title>
                        <Card.Description>
                            {plan.description}
                        </Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <div class="mb-4">
                            <span class="text-3xl font-bold">{plan.price}</span>
                            <span class="text-muted-foreground">{plan.interval}</span>
                        </div>
                        <ul class="space-y-2">
                            {#each plan.features as feature}
                                <li class="flex items-start">
                                    <svg class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{feature}</span>
                                </li>
                            {/each}
                        </ul>
                    </Card.Content>
                    <Card.Footer>
                        <Button.Root 
                            variant={plan.isCurrent ? 'outline' : 'default'} 
                            class="w-full" 
                            disabled={plan.isCurrent}
                            on:click={() => upgradeToPlan(plan.id)}
                        >
                            {plan.isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                        </Button.Root>
                    </Card.Footer>
                </Card.Root>
            {/each}
        </div>
    {/if}

    <!-- Billing History -->
    <div class="mt-8">
        <h3 class="text-xl font-semibold mb-4">Billing History</h3>
        <Card.Root>
            <Card.Content class="p-6">
                <div class="text-center py-8">
                    <p class="text-muted-foreground">No billing history yet.</p>
                    <p class="text-sm text-muted-foreground mt-1">Your invoices will appear here once you subscribe to a paid plan.</p>
                </div>
            </Card.Content>
        </Card.Root>
    </div>
</DashboardShell>

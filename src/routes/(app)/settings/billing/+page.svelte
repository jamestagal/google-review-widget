<script lang="ts">
	import * as Price from '$lib/components/price/index.js';
	import * as Card from '$lib/components/ui/card';
	import UserProducts from './components/sections/user-products.svelte';

	export let data;

	let {
		products,
		// <!-- TODO: uncomment once userProducts are correctly supported -->
		// userProducts,
		currentSubscriptions,
	} = data;
	// <!-- TODO: uncomment once other payment models are correctly supported -->
	// let showOtherPrices = false;

	$: withDefaultPrices = products.map((product) => {
		return {
			...product,
			prices: product.prices.filter(
				(price) => price.id === product.default_price.id,
			),
		};
	});

	// <!-- TODO: uncomment once other payment models are correctly supported -->
	// $: withOtherPrices = products.map((product) => {
	// 	return {
	// 		...product,
	// 		prices: product.prices.filter(
	// 			(price) => price.id !== product.default_price.id,
	// 		),
	// 	};
	// });

	$: currentSubscriptionsPrices = currentSubscriptions
		? currentSubscriptions
				.map((subscription) => {
					return subscription.items.data.map(({ price }) => price);
				})
				.flat(1)
		: [];
</script>

<svelte:head>
	<title>Billing | Settings</title>
</svelte:head>

<div class="flex justify-between items-center mb-6">
	<h2 class="text-xl font-semibold">Billing</h2>
	<a href="/dashboard/billing" class="text-sm text-primary hover:underline inline-flex items-center">
		View Dashboard Billing
		<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
	</a>
</div>

<!-- TODO: pass in user products once correctly supported -->
<!-- {#if userProducts && userProducts.length > 0} -->
<UserProducts userProducts={[]} {products} />
<!-- {/if} -->

<section class="flex flex-col gap-3">
	<h3 class="text-lg font-semibold">Default Prices</h3>
	<ol class="grid gap-4 lg:grid-cols-3">
		{#each withDefaultPrices as product}
			{#each product.prices as price}
				{@const isFree = price.unit_amount === 0}
				{@const isCurrent =
					currentSubscriptionsPrices.findIndex((p) => p.id === price.id) > -1 ||
					(isFree &&
						(!currentSubscriptions || currentSubscriptions.length <= 0))}
				<li
					class="[&:nth-child(2)>.bg-card]:border-2 [&:nth-child(2)>.bg-card]:border-primary [&:nth-child(2)]:scale-105"
				>
					<Card.Root class="relative">
						<div class="absolute right-1.5 top-1.5">
							<Price.Badges {price} />
						</div>
						<Card.Header>
							<Card.Title tag="h4">{product.name}</Card.Title>
							<Card.Description>
								{product.description}
							</Card.Description>
						</Card.Header>
						<Price.Core {price}>
							<Card.Content>
								<Price.Amount {price} />
							</Card.Content>
							<Card.Footer>
								<Price.Button {price} disabled={isCurrent}>
									{isCurrent ? 'Current Plan' : 'Select Plan'}
								</Price.Button>
							</Card.Footer>
						</Price.Core>
					</Card.Root>
				</li>
			{/each}
		{/each}
	</ol>
</section>

<!-- TODO: uncomment once other payment models are correctly supported -->
<!-- <Button
	variant="link"
	class="flex flex-nowrap gap-2 "
	on:click={() => (showOtherPrices = !showOtherPrices)}
>
	<LucideArrowDown
		class={twMerge(
			'h-4 w-4 transition-transform',
			showOtherPrices && 'rotate-180',
		)}
	/>
	{showOtherPrices ? 'Hide other payment models' : 'Show other payment models'}
</Button>
{#if showOtherPrices}
	<section class="flex flex-col gap-3" transition:fly={{ y: -10 }}>
		<h3 class="text-lg font-semibold">Other Prices</h3>
		<ol class="grid gap-4 lg:grid-cols-3">
			{#each withOtherPrices as product}
				{#each product.prices as price}
					{@const isCurrent =
						currentSubscriptionsPrices.findIndex((p) => p.id === price.id) > -1}
					<li>
						<Card.Root>
							<div class="flex flex-row justify-between gap-4">
								<Card.Header>
									<Card.Title tag="h4">{product.name}</Card.Title>
									<Card.Description>
										{product.description}
									</Card.Description>
								</Card.Header>
								<div class="flex-shrink p-1">
									<Price.Badges {price} />
								</div>
							</div>
							<Price.Core {price}>
								<Card.Content>
									<Price.Amount {price} />
								</Card.Content>
								<Card.Footer>
									<Price.Button {price} disabled={isCurrent}>
										{isCurrent ? 'Current Plan' : 'Select Plan'}
									</Price.Button>
								</Card.Footer>
							</Price.Core>
						</Card.Root>
					</li>
				{/each}
			{/each}
		</ol>
	</section>
{/if} -->

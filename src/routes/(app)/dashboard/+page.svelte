<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Button from '$lib/components/ui/button';
	import { Star, BellRing, GaugeCircle, Users, TrendingUp, Settings, HelpCircle, CreditCard } from 'lucide-svelte';
	import { onMount } from 'svelte';

	// Create a function to handle creating a new widget
	function createNewWidget() {
		window.location.href = '/dashboard/widgets/new';
	}

	// Navigation items for user actions
	const dashboardActions = [
		{
			title: 'Widgets',
			description: 'Create and manage your Google Review widgets',
			icon: Star,
			color: 'bg-blue-50 text-blue-600',
			link: '/dashboard/widgets',
			action: 'Manage widgets'
		},
		{
			title: 'Analytics',
			description: 'Track performance and view widget statistics',
			icon: TrendingUp,
			color: 'bg-indigo-50 text-indigo-600',
			link: '/dashboard/analytics',
			action: 'View analytics'
		},
		{
			title: 'Settings',
			description: 'Update your account preferences and profile',
			icon: Settings,
			color: 'bg-slate-50 text-slate-600',
			link: '/settings',
			action: 'Edit settings'
		},
		{
			title: 'Billing',
			description: 'Manage your subscription and payment methods',
			icon: CreditCard,
			color: 'bg-green-50 text-green-600',
			link: '/dashboard/billing',
			action: 'View billing'
		}
	];
</script>

<svelte:head>
	<title>Dashboard - Google Reviews Widget</title>
</svelte:head>

<div class="container mx-auto py-6 px-4 max-w-7xl">
	<!-- Dashboard Header -->
	<header class="mb-8">
		<h1 class="text-3xl font-bold mb-2">StarLite</h1>
		<p class="text-slate-600 dark:text-slate-400">Welcome to your go to Google Reviews Widget platform</p>
	</header>

	<!-- Get Started Section (Similar to the testimonials example) -->
	<Card.Root class="mb-10">
		<Card.Content class="p-0">
			<div class="flex flex-col md:flex-row">
				<div class="p-6 md:w-1/2">
					<h2 class="text-2xl font-bold mb-2">Let's add some Google reviews! 🎉</h2>
					<p class="text-slate-600 dark:text-slate-400 mb-4">
						Easily import and display your Google reviews on your website to boost trust and credibility.
					</p>
					<ul class="space-y-2 mb-6">
						<li class="flex items-center">
							<svg class="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Integrate Google reviews in minutes
						</li>
						<li class="flex items-center">
							<svg class="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Customize the look and feel to match your brand
						</li>
						<li class="flex items-center">
							<svg class="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Build trust and increase conversions
						</li>
					</ul>
					<Button.Root on:click={createNewWidget} class="px-6">
						Create your first widget
					</Button.Root>
				</div>
				<div class="p-6 md:w-1/2 bg-slate-50 dark:bg-slate-800 rounded-r-lg flex items-center justify-center">
					<div class="relative w-full max-w-sm">
						<!-- Reviews illustration with site icons -->
						<div class="mx-auto w-48 h-48 relative">
							<div class="absolute inset-0 flex items-center justify-center">
								<div class="w-32 h-32 rounded-full bg-white dark:bg-slate-700 shadow-lg flex items-center justify-center">
									<Star class="w-12 h-12 text-yellow-500" />
								</div>
							</div>
							<!-- Social media icons orbit -->
							<div class="absolute top-0 left-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shadow">
								<span class="text-red-500 text-xs font-bold">G</span>
							</div>
							<div class="absolute top-12 right-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shadow">
								<span class="text-blue-500 text-xs font-bold">FB</span>
							</div>
							<div class="absolute bottom-0 right-12 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shadow">
								<span class="text-green-500 text-xs font-bold">T</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Action Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
		{#each dashboardActions as action}
			<Card.Root>
				<Card.Content class="p-6">
					<div class="flex flex-col h-full">
						<div class="{action.color} p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
							<svelte:component this={action.icon} class="w-6 h-6" />
						</div>
						<h3 class="text-lg font-semibold mb-2">{action.title}</h3>
						<p class="text-sm text-slate-600 dark:text-slate-400 mb-4 flex-grow">{action.description}</p>
						<a href={action.link} class="text-sm font-medium text-primary hover:underline inline-flex items-center">
							{action.action}
							<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</a>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<!-- Recent Activity (Placeholder) -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<BellRing class="w-5 h-5" />
				Recent Activity
			</Card.Title>
			<Card.Description>Your latest widget interactions and updates</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="text-center py-6">
				<p class="text-slate-500 dark:text-slate-400">No recent activity to display</p>
				<p class="text-sm text-slate-400 dark:text-slate-500 mt-1">Activities will appear here once you create your first widget</p>
			</div>
		</Card.Content>
	</Card.Root>
</div>

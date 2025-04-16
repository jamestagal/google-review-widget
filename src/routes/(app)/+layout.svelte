<script lang="ts">
	// Import all necessary icons directly from lucide-svelte instead of using unplugin-icons
	import { 
		Home,
		Star,
		FileText,
		Layout,
		TrendingUp,
		Heart,
		MessageSquare,
		CreditCard,
		Settings,
		PanelLeft,
		HelpCircle, 
		Wrench, // Using Wrench instead of Tool since Tool isn't available
		LogOut
	} from 'lucide-svelte';

	import Logo from '$lib/components/Logo.svelte';
	import PersonalMenu from '$lib/components/personal-menu.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Breadcrumbs from './components/breadcrumbs.svelte';
	import NavLink from './components/nav-link.svelte';
	
	// Define sidebar navigation items
	const sidebarNavItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: Home },
		{ href: '/dashboard/testimonials', label: 'Testimonials', icon: Star, badge: 'New' },
		{ href: '/dashboard/forms', label: 'Collection Forms', icon: FileText },
		{ href: '/dashboard/widgets', label: 'Widgets', icon: Layout },
		{ href: '/dashboard/review-booster', label: 'Review Booster', icon: TrendingUp, badge: 'New' },
		{ href: '/dashboard/wall-of-love', label: 'Wall of Love', icon: Heart, badge: 'New' },
		{ href: '/dashboard/campaigns', label: 'Campaigns', icon: MessageSquare },
	];
	
	// Define bottom navigation items
	const bottomNavItems = [
		{ href: '/dashboard/billing', label: 'Plan & Billing', icon: CreditCard },
		{ href: '/settings', label: 'Settings', icon: Settings },
		{ href: '/dashboard/tools', label: 'Mini Tools', icon: Wrench, badge: 'New' },
		{ href: '/help', label: 'Help', icon: HelpCircle }
	];
	
	// Function to navigate to settings/billing from dashboard/billing or vice versa
	function navigateToBilling() {
		const currentPath = window.location.pathname;
		if (currentPath.includes('/dashboard/billing')) {
			window.location.href = '/settings/billing';
		} else if (currentPath.includes('/settings/billing')) {
			window.location.href = '/dashboard/billing';
		}
	}
	


	export let data;
</script>

<div class="flex min-h-screen w-full flex-col bg-muted/40">
	<aside
		class="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex"
	>
		<!-- Top Section with Logo -->
		<div class="flex flex-col items-center py-4 border-b">
			<a
				href="/"
				class="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 md:h-8 md:w-8"
			>
				<Logo />
				<span class="sr-only">Google Reviews Widget</span>
			</a>
		</div>
		
		<!-- Main Navigation -->
		<nav class="flex flex-col items-center gap-4 px-2 py-5 overflow-y-auto">
			{#each sidebarNavItems as item}
				<Tooltip.Root>
					<Tooltip.Trigger asChild let:builder>
						<NavLink
							href={item.href}
							class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 relative"
							activeClass="bg-accent text-accent-foreground"
							{builder}
						>
							<svelte:component this={item.icon} class="h-5 w-5" />
							<span class="sr-only">{item.label}</span>
							{#if item.badge}
								<span class="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500"></span>
							{/if}
						</NavLink>
					</Tooltip.Trigger>
					<Tooltip.Content side="right">{item.label}</Tooltip.Content>
				</Tooltip.Root>
			{/each}
		</nav>
		
		<!-- Bottom Navigation Items -->
		<nav class="mt-auto flex flex-col items-center gap-4 px-2 py-5 border-t">
			{#each bottomNavItems as item}
				<Tooltip.Root>
					<Tooltip.Trigger asChild let:builder>
						<NavLink
							href={item.href}
							class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 relative"
							activeClass="bg-accent text-accent-foreground"
							{builder}
						>
							<svelte:component this={item.icon} class="h-5 w-5" />
							<span class="sr-only">{item.label}</span>
							{#if item.badge}
								<span class="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500"></span>
							{/if}
						</NavLink>
					</Tooltip.Trigger>
					<Tooltip.Content side="right">{item.label}</Tooltip.Content>
				</Tooltip.Root>
			{/each}
		</nav>
	</aside>
	<div class="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
		<header
			class="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6"
		>
			<Sheet.Root>
				<Sheet.Trigger asChild let:builder>
					<Button
						builders={[builder]}
						size="icon"
						variant="outline"
						class="sm:hidden"
					>
						<PanelLeft class="h-5 w-5" />
						<span class="sr-only">Toggle Menu</span>
					</Button>
				</Sheet.Trigger>
				<Sheet.Content side="left" class="sm:max-w-xs">
					<nav class="grid gap-6 text-lg font-medium">
						<a
							href="##"
							class="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
						>
							<Logo />
							<span class="sr-only">SaaS Kit</span>
						</a>
						<a
							href="##"
							class="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
						>
							<Home class="h-5 w-5" />
							Dashboard
						</a>
					</nav>
				</Sheet.Content>
			</Sheet.Root>
			<Breadcrumbs />
			<!-- <div class="relative ml-auto flex-1 md:grow-0">
				<Search
					class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
				/>
				<Input
					type="search"
					placeholder="Search..."
					class="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
				/>
			</div> -->
			<PersonalMenu user={data.user} />
		</header>
		<main class="flex flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
			<slot />
		</main>
	</div>
</div>

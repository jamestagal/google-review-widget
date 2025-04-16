<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { setMode, userPrefersMode } from 'mode-watcher';
	import CheckIcon from 'virtual:icons/lucide/check';
	import MonitorIcon from 'virtual:icons/lucide/monitor';
	import MoonIcon from 'virtual:icons/lucide/moon';
	import SunIcon from 'virtual:icons/lucide/sun';

	type Mode = typeof $userPrefersMode;
	// Define a proper type for Svelte components
	// Using more specific type to avoid 'any'
	import type { ComponentType } from 'svelte';

	export let mode: Mode;

	const settings: Record<
		Mode,
		{
			icon: ComponentType;
			label: string;
		}
	> = {
		system: {
			icon: MonitorIcon,
			label: 'System',
		},
		light: {
			icon: SunIcon,
			label: 'Light',
		},
		dark: {
			icon: MoonIcon,
			label: 'Dark',
		},
	};

	// Verify that all icons are loaded correctly
	function isValidComponent(component: unknown): boolean {
		return component !== null && component !== undefined;
	}
</script>

<Button
	variant="ghost"
	class={cn('w-full text-base', $$props.class)}
	on:click={() => setMode(mode)}
>
	{#if $userPrefersMode === mode}
		<CheckIcon class="h-4 w-4 justify-self-end" />
	{/if}
	<span class="col-[2] flex flex-nowrap items-center gap-2">
		{#if isValidComponent(settings[mode].icon)}
			<svelte:component this={settings[mode].icon} class="h-4 w-4" />
		{:else}
			<span class="h-4 w-4">●</span>
		{/if}
		{settings[mode].label}
	</span>
</Button>

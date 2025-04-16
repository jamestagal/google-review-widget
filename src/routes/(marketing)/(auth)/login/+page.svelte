<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Card from '$lib/components/ui/card';
	import type { AuthChangeEvent } from '@supabase/supabase-js';
	import { onMount } from 'svelte';
	import { WebsiteName } from '../../../../config';
	import SocialsAuth from '../components/socials-auth.svelte';
	import LoginForm from './login-form.svelte';

	export let data;
	// export let form;

	let { supabase } = data;

	onMount(() => {
		// IMPORTANT: Implement secure authentication pattern following Supabase best practices
		// Separate handler function avoids receiving the session parameter entirely
		function handleAuthChange(event: AuthChangeEvent) {
			// Redirect to account after successful login
			if (event === 'SIGNED_IN') {
				// Always verify the user with getUser() which validates with Supabase Auth server
				supabase.auth.getUser().then(({ data: { user } }) => {
					if (user) {
						// Only redirect if we have a verified user from getUser()
						// Delay needed because order of callback not guaranteed
						setTimeout(() => {
							goto('/dashboard');
						}, 1);
					}
				});
			}
		}
		
		// Create auth listener using the separate handler function
		const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);
		
		// Ensure proper cleanup when component unmounts
		return () => {
			authListener.subscription.unsubscribe();
		};
	});
</script>

<svelte:head>
	<title>Sign in to {WebsiteName}</title>
</svelte:head>

{#if $page.url.searchParams.get('verified') == 'true'}
	<div role="alert" class="alert alert-success mb-5">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
			><path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/></svg
		>
		<span>Email verified! Please log in.</span>
	</div>
{/if}
<Card.Root class="mx-auto max-w-sm">
	<Card.Header>
		<Card.Title tag="h1" class="text-2xl">
			Log in <span class="sr-only">to {WebsiteName}</span>
		</Card.Title>
	</Card.Header>
	<Card.Content class="flex flex-col gap-4">
		<SocialsAuth />

		<div class="flex flex-col gap-3">
			<p class="text-sm text-muted-foreground">
				Log in to your account with your email address below.
			</p>
			<LoginForm data={data.form} />
			<div class="mt-4 text-center text-sm">
				Don&apos;t have an account?
				<a href="/register" class="underline">Sign up</a>.
			</div>
		</div>
	</Card.Content>
</Card.Root>

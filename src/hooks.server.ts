// src/hooks.server.ts
import {
	PRIVATE_STRIPE_SECRET_KEY,
	PRIVATE_SUPABASE_SERVICE_ROLE,
} from '$env/static/private';
import {
	PUBLIC_SUPABASE_ANON_KEY,
	PUBLIC_SUPABASE_URL,
} from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { 
	createClient 
} from '@supabase/supabase-js';
import type { Handle } from '@sveltejs/kit';
import Stripe from 'stripe';

export const handle: Handle = async ({ event, resolve }) => {
	// Create the Supabase client
	event.locals.supabase = createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				get: (key) => event.cookies.get(key),
				/**
				 * Note: You have to add the `path` variable to the
				 * set and remove method due to sveltekit's cookie API
				 * requiring this to be set, setting the path to an empty string
				 * will replicate previous/standard behaviour (https://kit.svelte.dev/docs/types#public-types-cookies)
				 */
				set: (key, value, options) => {
					event.cookies.set(key, value, { ...options, path: '/' });
				},
				remove: (key, options) => {
					event.cookies.delete(key, { ...options, path: '/' });
				},
			},
		},
	);

	// Create the service role client (admin client)
	event.locals.supabaseServiceRole = createClient(
		PUBLIC_SUPABASE_URL,
		PRIVATE_SUPABASE_SERVICE_ROLE,
		{ auth: { persistSession: false } },
	);

	// Create a safe version of getSession that doesn't trigger cookie issues
	event.locals.safeGetSession = async () => {
		// Get session (this just reads from cookies, not secure by itself)
		const { data: { session } } = await event.locals.supabase.auth.getSession();
		
		// Validate the JWT by calling getUser (this actually verifies with auth server)
		const { data: { user } } = session 
			? await event.locals.supabase.auth.getUser() 
			: { data: { user: null } };
			
		// If the JWT validation fails or there's no user, the session isn't valid
		if (!user) {
			return { session: null, user: null };
		}
		
		// Return both the validated session and user
		return { session, user };
	};

	// For backward compatibility and immediate access, still set user in locals
	const { data: { user } } = await event.locals.supabase.auth.getUser();
	if (user) {
		event.locals.user = user;
	}

	// Set up Stripe client
	event.locals.stripe = new Stripe(PRIVATE_STRIPE_SECRET_KEY, {
		apiVersion: '2024-04-10',
	});

	// Resolve the request
	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		},
	});
};

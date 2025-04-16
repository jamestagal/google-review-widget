import type { LayoutServerLoad } from './$types';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const load: LayoutServerLoad = async ({ cookies }) => {
	// Create a Supabase client using the request cookies
	const supabase = createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				get: (key) => cookies.get(key),
				set: (key, value, options) => {
					cookies.set(key, value, { ...options, path: '/' });
				},
				remove: (key, options) => {
					cookies.delete(key, { ...options, path: '/' });
				}
			}
		}
	);

	// Check if user is authenticated
	const { data: { session } } = await supabase.auth.getSession();
	const { data: { user } } = session ? await supabase.auth.getUser() : { data: { user: null } };

	return { session, user };
};

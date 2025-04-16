import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
	locals: { safeGetSession, user },
}) => {
	const { session, user: sessionUser } = await safeGetSession();
	if (!session) {
		throw redirect(303, '/login');
	}

	// Return the authenticated user
	return {
		user: user || sessionUser
	};
};

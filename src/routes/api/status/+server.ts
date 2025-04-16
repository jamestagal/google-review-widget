import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Handles GET requests to the /api/status endpoint.
 * Returns a simple JSON response indicating the API is operational.
 */
export const GET: RequestHandler = async () => {
    return json({ ok: true });
};

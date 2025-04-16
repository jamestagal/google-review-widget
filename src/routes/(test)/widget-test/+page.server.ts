import type { PageServerLoad } from './$types';

// Simple load function that doesn't access database
export const load: PageServerLoad = async ({ url }) => {
    // Get query parameters with defaults
    const apiKey = url.searchParams.get('apiKey') || 'grw_free_j8yvxbgoo5_m922roed';
    // Updated to use Google headquarters as default Place ID (more likely to work with API key)
    const placeId = url.searchParams.get('placeId') || 'ChIJj61dQgK6j4AR4GeTYWZsKWw';
    const displayMode = url.searchParams.get('displayMode') || 'grid';
    const theme = url.searchParams.get('theme') || 'light';
    const maxReviews = parseInt(url.searchParams.get('maxReviews') || '5', 10);
    const minRating = parseInt(url.searchParams.get('minRating') || '0', 10);
    
    // Return configuration directly without database access
    return {
        apiKey,
        placeId,
        displayMode,
        theme,
        maxReviews,
        minRating
    };
};

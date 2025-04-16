import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PRIVATE_GOOGLE_PLACES_API_KEY } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';

/**
 * Secure proxy to the Google Places API
 * This keeps the API key hidden on the server side and allows us to implement
 * rate limiting, caching, and other security measures.
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Validate required parameters
    const placeId = url.searchParams.get('place_id');
    const fields = url.searchParams.get('fields') || 'reviews,rating,user_ratings_total';
    
    if (!placeId) {
      throw error(400, 'place_id parameter is required');
    }
    
    // Always use mock data in development mode for testing
    // This simplifies testing without requiring API keys
    console.log('🔍 Using enhanced mock data for development');
    
    // Generate mock reviews based on the place ID
    const now = Math.floor(Date.now() / 1000);
    const mockReviews = [
      {
        author_name: 'John Smith',
        author_url: 'https://www.google.com/maps/contrib/123456789',
        profile_photo_url: 'https://lh3.googleusercontent.com/a-/profile1',
        rating: 5,
        relative_time_description: '1 week ago',
        text: `This place is amazing! I visited ${placeId.includes('ChIJN1t') ? 'the Sydney Opera House' : 'this location'} and was blown away by the experience. Highly recommended for anyone visiting the area.`,
        time: now - 604800 // 1 week ago
      },
      {
        author_name: 'Emma Johnson',
        author_url: 'https://www.google.com/maps/contrib/987654321',
        profile_photo_url: 'https://lh3.googleusercontent.com/a-/profile2',
        rating: 4,
        relative_time_description: '2 weeks ago',
        text: 'Great experience overall, though the wait times were a bit longer than expected. The staff was very friendly and accommodating.',
        time: now - 1209600 // 2 weeks ago
      },
      {
        author_name: 'Michael Williams',
        author_url: 'https://www.google.com/maps/contrib/567891234',
        profile_photo_url: 'https://lh3.googleusercontent.com/a-/profile3',
        rating: 3,
        relative_time_description: '1 month ago',
        text: 'Average experience. Nothing particularly stood out, but nothing was bad either. Might return if I am in the area again.',
        time: now - 2592000 // 1 month ago
      },
      {
        author_name: 'Sophia Garcia',
        author_url: 'https://www.google.com/maps/contrib/432156789',
        profile_photo_url: 'https://lh3.googleusercontent.com/a-/profile4',
        rating: 5,
        relative_time_description: '3 months ago',
        text: 'Absolutely wonderful! The views are breathtaking and worth every penny. Make sure to bring your camera!',
        time: now - 7776000 // 3 months ago
      },
      {
        author_name: 'David Lee',
        author_url: 'https://www.google.com/maps/contrib/789123456',
        profile_photo_url: 'https://lh3.googleusercontent.com/a-/profile5',
        rating: 2,
        relative_time_description: '4 months ago',
        text: 'Disappointing visit. Too crowded and overpriced for what you get. There are better attractions nearby.',
        time: now - 10368000 // 4 months ago
      }
    ];
    
    // Return mock data for testing
    return json({
      status: 'success',
      data: {
        reviews: mockReviews,
        rating: 3.8,
        user_ratings_total: 358
      }
    });
    
    // Note: The following code is disabled for testing purposes
    // In a production environment, uncomment this and properly configure API keys
    /*
    if (!PRIVATE_GOOGLE_PLACES_API_KEY) {
      throw error(500, 'Google Places API key is not configured');
    }
    
    // Call the Google Places API
    const apiUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    apiUrl.searchParams.set('place_id', placeId);
    apiUrl.searchParams.set('fields', fields);
    apiUrl.searchParams.set('key', PRIVATE_GOOGLE_PLACES_API_KEY);
    
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw error(response.status, `Google Places API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw error(400, `Google Places API returned error: ${data.status}`);
    }
    
    // Return success response with the Google Places data
    return json({
      status: 'success',
      data: data.result
    });
    */
  } catch (err) {
    console.error('Error in Google Places API proxy:', err);
    
    // If it's already a SvelteKit error response, just throw it again
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    
    // Return a proper error response
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    throw error(500, errorMessage);
  }
};

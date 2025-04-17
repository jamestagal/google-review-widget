import { json } from '@sveltejs/kit';
import { createServerClient } from '$lib/utils/supabase/server';
import type { RequestHandler } from './$types';

// Import Google API key with fallback for build process
const GOOGLE_API_KEY = process.env.PRIVATE_GOOGLE_API_KEY || 'AIzaSyCnTrmaeDEjz-keYN1-FD2K43kCrIe5SuI';

/**
 * API endpoint to get place details using Google Places API
 * This protects our API key from being exposed to the client
 */
export const GET: RequestHandler = async (event) => {
    try {
        // Verify API key is available
        if (!GOOGLE_API_KEY) {
            console.error('Google Places API key is not configured');
            return json({ 
                error: 'Server configuration error: Google Places API key is missing'
            }, { status: 500 });
        }
        
        // Create a Supabase client for authenticating the request using project convention
        const supabase = createServerClient(event.cookies);

        // Authenticate the user with getUser() for security
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('Unauthorized access attempt to Places Details API');
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get place_id parameter
        const placeId = event.url.searchParams.get('place_id');
        if (!placeId) {
            console.error('Missing place_id parameter in Places Details API request');
            return json({ error: 'Missing place_id parameter' }, { status: 400 });
        }

        console.log(`Processing Places Details API request for place_id: ${placeId}`);

        let data: any;
        try {
            // Make the request to Google Places API
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,place_id,formatted_address,rating,user_ratings_total,photos&key=${GOOGLE_API_KEY}`;
            
            console.log(`Calling Google Places Details API: ${url.replace(GOOGLE_API_KEY, '[REDACTED]')}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error(`Google Places Details API HTTP error: ${response.status} ${response.statusText}`);
                return json({
                    error: `Google Places Details API HTTP error: ${response.status}`,
                    details: await response.text()
                }, { status: 500 });
            }

            data = await response.json();
            
            if (data.status !== 'OK') {
                console.error(`Google Places Details API returned error status: ${data.status}`, data.error_message || '');
                return json({
                    error: `Google Places Details API error: ${data.status}`,
                    details: data.error_message || 'No additional details provided'
                }, { status: 500 });
            }
        } catch (fetchError: unknown) {
            console.error('Error fetching from Google Places Details API:', fetchError);
            return json({
                error: 'Failed to fetch from Google Places Details API',
                details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
            }, { status: 500 });
        }
        
        // Return place details
        try {
            const placeDetails = {
                place_id: data.result.place_id || '',
                name: data.result.name || '',
                formatted_address: data.result.formatted_address || '',
                rating: data.result.rating || 0,
                user_ratings_total: data.result.user_ratings_total || 0,
                photos: data.result.photos?.map((photo: { photo_reference: string }) => ({
                    photo_reference: photo.photo_reference
                })) || []
            };
            
            console.log(`Successfully retrieved details for place: ${placeDetails.name}`);
            return json({ result: placeDetails });
        } catch (parseError: unknown) {
            console.error('Error parsing place details response:', parseError);
            return json({
                error: 'Failed to parse place details', 
                details: parseError instanceof Error ? parseError.message : 'Unknown error',
                response: data
            }, { status: 500 });
        }
    } catch (error: unknown) {
        console.error('Error in Places Details API endpoint:', error);
        return json({ 
            error: 'Failed to fetch place details', 
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
};

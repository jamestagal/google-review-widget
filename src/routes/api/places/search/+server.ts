import { json } from '@sveltejs/kit';
import { PRIVATE_GOOGLE_API_KEY } from '$env/static/private';
import { createServerClient } from '$lib/utils/supabase/server';
import type { RequestHandler } from './$types';

/**
 * API endpoint to search for places using Google Places API
 * This protects our API key from being exposed to the client
 */
export const GET: RequestHandler = async (event) => {
    try {
        // Verify API key is available
        if (!PRIVATE_GOOGLE_API_KEY) {
            console.error('Google Places API key is not configured');
            return json({ 
                error: 'Server configuration error: Google Places API key is missing', 
                details: 'Please add PRIVATE_GOOGLE_API_KEY to your .env.local file'
            }, { status: 500 });
        }
        
        // Create a Supabase client for authenticating the request using project convention
        const supabase = createServerClient(event.cookies);

        // Authenticate the user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('Unauthorized access attempt to Places API');
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get search query parameter
        const query = event.url.searchParams.get('query');
        if (!query) {
            console.error('Missing query parameter in Places API request');
            return json({ error: 'Missing query parameter' }, { status: 400 });
        }

        console.log(`Processing Places API search for query: ${query}`);

        let data: any;
        try {
            // Make the request to Google Places API
            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                query
            )}&types=establishment&key=${PRIVATE_GOOGLE_API_KEY}`;
            
            console.log(`Calling Google Places API: ${url.replace(PRIVATE_GOOGLE_API_KEY, '[REDACTED]')}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error(`Google Places API HTTP error: ${response.status} ${response.statusText}`);
                return json({
                    error: `Google Places API HTTP error: ${response.status}`,
                    details: await response.text()
                }, { status: 500 });
            }

            data = await response.json();
            
            if (data.status !== 'OK') {
                console.error(`Google Places API returned error status: ${data.status}`, data.error_message || '');
                return json({
                    error: `Google Places API error: ${data.status}`,
                    details: data.error_message || 'No additional details provided'
                }, { status: 500 });
            }
        } catch (fetchError: unknown) {
            console.error('Error fetching from Google Places API:', fetchError);
            return json({
                error: 'Failed to fetch from Google Places API',
                details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
            }, { status: 500 });
        }
        
        // We need to get details for each place to get more information
        const predictions = data.predictions.slice(0, 5); // Limit to 5 results
        console.log(`Found ${predictions.length} places matching query: ${query}`);
        
        const places = [];
        
        for (const prediction of predictions) {
            try {
                console.log(`Fetching details for place: ${prediction.place_id} (${prediction.description})`);
                
                // Get place details
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${
                    prediction.place_id
                }&fields=name,place_id,formatted_address,rating,user_ratings_total,photos&key=${PRIVATE_GOOGLE_API_KEY}`;
                
                const detailsResponse = await fetch(detailsUrl);
                
                if (!detailsResponse.ok) {
                    console.error(`Google Places Details API HTTP error for ${prediction.place_id}: ${detailsResponse.status}`);
                    continue; // Skip this place but continue with others
                }
                
                const detailsData = await detailsResponse.json();
                
                if (detailsData.status === 'OK' && detailsData.result) {
                    places.push({
                        place_id: detailsData.result.place_id,
                        name: detailsData.result.name,
                        formatted_address: detailsData.result.formatted_address,
                        rating: detailsData.result.rating,
                        user_ratings_total: detailsData.result.user_ratings_total,
                        photos: detailsData.result.photos?.map((photo: { photo_reference: string }) => ({
                            photo_reference: photo.photo_reference
                        })) || []
                    });
                } else {
                    console.warn(`Places Details API returned non-OK status for ${prediction.place_id}: ${detailsData.status}`);
                }
            } catch (detailsError) {
                console.error(`Error fetching details for place ${prediction.place_id}:`, detailsError);
                // Continue with other places
            }
        }
        
        console.log(`Returning ${places.length} places with details`);
        return json({ results: places });
    } catch (error: unknown) {
        console.error('Error in Places API endpoint:', error);
        return json({ 
            error: 'Failed to search for places', 
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
};

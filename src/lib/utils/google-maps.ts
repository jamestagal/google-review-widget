/**
 * Google Maps API utility functions
 */
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';
import type { GooglePlace } from '../types/google-places.types';

/**
 * Load the Google Maps API script dynamically
 */
export function loadGoogleMapsApi(): Promise<void> {
    return new Promise((resolve, reject) => {
        // If already loaded, resolve immediately
        if (window.google && window.google.maps) {
            resolve();
            return;
        }

        // Create script element and load the API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => resolve();
        script.onerror = (error) => reject(new Error(`Failed to load Google Maps API: ${error}`));
        
        document.head.appendChild(script);
    });
}

/**
 * Search for places using the Google Places API
 */
export async function searchPlaces(query: string, limit = 5): Promise<GooglePlace[]> {
    try {
        // Ensure the API is loaded
        await loadGoogleMapsApi();
        
        if (!window.google || !window.google.maps) {
            throw new Error('Google Maps API not loaded');
        }
        
        // Create the required services
        const autocompleteService = new google.maps.places.AutocompleteService();
        
        // Create a hidden map element required by PlacesService
        const mapElement = document.createElement('div');
        mapElement.style.display = 'none';
        document.body.appendChild(mapElement);
        
        const placesService = new google.maps.places.PlacesService(mapElement);
        
        // Get place predictions
        const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
            autocompleteService.getPlacePredictions(
                {
                    input: query,
                    types: ['establishment']
                },
                (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        resolve(results);
                    } else {
                        reject(new Error(`Places API error: ${status}`));
                    }
                }
            );
        });
        
        // Get details for each place
        const detailsPromises = predictions.slice(0, limit).map(prediction => 
            new Promise<GooglePlace>((resolve, reject) => {
                placesService.getDetails(
                    {
                        placeId: prediction.place_id,
                        fields: ['name', 'place_id', 'formatted_address', 'photos', 'rating', 'user_ratings_total']
                    },
                    (result, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                            resolve({
                                place_id: result.place_id || '',
                                name: result.name || '',
                                formatted_address: result.formatted_address || '',
                                photos: result.photos?.map(photo => ({ 
                                    photo_reference: photo.getUrl?.() || ''
                                })) || [],
                                rating: result.rating,
                                user_ratings_total: result.user_ratings_total
                            });
                        } else {
                            reject(new Error(`Place details API error: ${status}`));
                        }
                    }
                );
            })
        );
        
        // Clean up the map element
        document.body.removeChild(mapElement);
        
        return await Promise.all(detailsPromises);
    } catch (error) {
        console.error('Error searching for places:', error);
        throw error;
    }
}

/**
 * Get details for a specific place by ID
 */
export async function getPlaceDetails(placeId: string): Promise<GooglePlace> {
    try {
        // Ensure the API is loaded
        await loadGoogleMapsApi();
        
        if (!window.google || !window.google.maps) {
            throw new Error('Google Maps API not loaded');
        }
        
        // Create a hidden map element required by PlacesService
        const mapElement = document.createElement('div');
        mapElement.style.display = 'none';
        document.body.appendChild(mapElement);
        
        const placesService = new google.maps.places.PlacesService(mapElement);
        
        // Get place details
        const placeDetails = await new Promise<GooglePlace>((resolve, reject) => {
            placesService.getDetails(
                {
                    placeId,
                    fields: ['name', 'place_id', 'formatted_address', 'photos', 'rating', 'user_ratings_total']
                },
                (result, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                        resolve({
                            place_id: result.place_id || '',
                            name: result.name || '',
                            formatted_address: result.formatted_address || '',
                            photos: result.photos?.map(photo => ({ 
                                photo_reference: photo.getUrl?.() || ''
                            })) || [],
                            rating: result.rating,
                            user_ratings_total: result.user_ratings_total
                        });
                    } else {
                        reject(new Error(`Place details API error: ${status}`));
                    }
                }
            );
        });
        
        // Clean up the map element
        document.body.removeChild(mapElement);
        
        return placeDetails;
    } catch (error) {
        console.error('Error getting place details:', error);
        throw error;
    }
}

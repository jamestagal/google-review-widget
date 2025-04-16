/**
 * Google Places API types for our application
 */

/**
 * Simplified Google Place object with the properties we need
 */
export interface GooglePlace {
    place_id: string;
    name: string;
    formatted_address: string;
    photos?: { photo_reference: string }[];
    rating?: number;
    user_ratings_total?: number;
}

/**
 * Search options for Google Places API
 */
export interface GooglePlacesSearchOptions {
    input: string;
    types?: string[];
    location?: {
        lat: number;
        lng: number;
    };
    radius?: number;
    language?: string;
    components?: {
        country: string;
    }[];
}

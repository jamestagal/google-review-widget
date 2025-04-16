import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Process reviews by applying filtering and sorting from options
 */
function filterAndSortReviews(reviews: GoogleReview[], options: ReviewOptions = {}): GoogleReview[] {
  let processed = [...reviews];
  
  // Apply filtering
  if (options.minRating && options.minRating > 0) {
    processed = processed.filter(review => review.rating >= options.minRating!);
  }
  
  // Apply sorting
  if (options.sortBy) {
    switch (options.sortBy) {
      case 'recent':
        processed.sort((a, b) => b.time - a.time);
        break;
      case 'highest':
        processed.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        processed.sort((a, b) => a.rating - b.rating);
        break;
    }
  }
  
  // Apply limit
  if (options.maxResults && options.maxResults > 0) {
    processed = processed.slice(0, options.maxResults);
  }
  
  return processed;
}

export interface ReviewOptions {
  minRating?: number;
  maxResults?: number;
  sortBy?: 'recent' | 'highest' | 'lowest';
  cacheOverride?: boolean;
}

export interface GoogleReview {
  author_name: string;
  author_url: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface CachedReviewData {
  id: string;
  place_id: string;
  project_id: string;
  reviews: GoogleReview[];
  overall_rating: number;
  total_reviews: number;
  last_updated: string;
}

export interface PlaceDetails {
  reviews: GoogleReview[];
  rating: number;
  user_ratings_total: number;
}

/**
 * Fetches Google reviews for a place from cache or directly from the Google Places API
 * @param supabase - Supabase client (server-side)
 * @param placeId - Google Place ID to fetch reviews for
 * @param projectId - The widget project ID to associate these reviews with
 * @param options - Options for filtering and sorting reviews
 */
export async function getReviewsForPlace(
  supabase: SupabaseClient,
  placeId: string,
  projectId: string,
  options: ReviewOptions = {}
): Promise<GoogleReview[]> {
  try {
    // Variables for subscription tier handling
    let subscriptionTier = 'basic'; // Default to basic tier
    
    // Check if this is a test project ID for development
    const isTestProject = projectId === 'test-project-id';
    
    if (isTestProject) {
      console.log('Using test project in development mode');
      // For test project, use the basic tier
      subscriptionTier = 'basic';
    } else {
      // Otherwise, fetch the actual project information
      const { data: project, error: projectError } = await supabase
        .from('widget_projects')
        .select('subscription_tier')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        console.error("Error fetching widget project info:", projectError);
      } else if (project) {
        subscriptionTier = project.subscription_tier || 'basic';
      }
    }
    
    // Default cache duration (24 hours in ms)
    let cacheDuration = 24 * 60 * 60 * 1000; 
    
    // Override based on subscription tier
    // Set cache duration based on subscription tier
    switch (subscriptionTier) {
        case 'premium':
          cacheDuration = 6 * 60 * 60 * 1000; // 6 hours
          break;
        case 'business':
          cacheDuration = 12 * 60 * 60 * 1000; // 12 hours
          break;
        default: // 'basic' or undefined
          cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
    }
    
    // Skip cache for test project
    if (isTestProject) {
      console.log('Test project: Skipping cache check');
    } else {
      // Check cache first
      const { data: cachedReviews, error: cacheError } = await supabase
        .from('review_cache')
        .select('*')
        .eq('place_id', placeId)
        .eq('project_id', projectId)
        .single();
        
      // Use cache if it's valid and we're not overriding cache
      const isCacheValid = cachedReviews && 
        new Date(cachedReviews.last_updated).getTime() > Date.now() - cacheDuration;
        
      if (isCacheValid && !options.cacheOverride && !cacheError) {
        return filterAndSortReviews(cachedReviews.reviews, options);
      }
    }
    
    // Fetch fresh data from Google Places API
    try {
      // When running on the server, we need to determine the base URL based on environment
      // This is for server-side rendering environments
      let baseUrl = '';
      
      // In a browser environment, we can use relative URLs
      const isBrowser = typeof window !== 'undefined';
      
      // If not in browser, construct a base URL for SSR
      if (!isBrowser) {
        baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';
      }
      
      // This goes through our secure server endpoint that proxies to Google Places API
      console.log(`Fetching reviews for place ID: ${placeId}`);
      
      // Construct the API URL (relative in browser, absolute in SSR)
      const apiUrl = `${baseUrl}/api/google-places/details?place_id=${placeId}&fields=reviews,rating,user_ratings_total`;
      
      let apiResponseData;
      try {
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          console.error(`API response not OK: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch from Google Places API: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check for successful API response
        if (data.status !== 'success') {
          console.error('API returned non-success status:', data);
          throw new Error(`Google Places API error: ${data.error || 'Unknown error'}`);
        }
        
        // In development mode, we might get mock data without result property
        if (!data.data) {
          console.error('API response missing data property:', data);
          throw new Error('Invalid API response format');
        }
        
        // Store the response data for use outside the try block
        apiResponseData = data;
      } catch (error) {
        console.error('Error during API fetch:', error);
        throw error;
      }
      
      // Get the result data with proper fallbacks for each property
      const result = apiResponseData.data;
      
      const placeDetails: PlaceDetails = {
        reviews: result?.reviews || [],
        rating: result?.rating || 0,
        user_ratings_total: result?.user_ratings_total || 0
      };
      
      console.log(`Fetched ${placeDetails.reviews.length} reviews with overall rating ${placeDetails.rating}`);
      
      
      // Skip cache update for test project
      if (!isTestProject) {
        await supabase.from('review_cache').upsert({
          place_id: placeId,
          project_id: projectId,
          reviews: placeDetails.reviews,
          overall_rating: placeDetails.rating,
          total_reviews: placeDetails.user_ratings_total,
          last_updated: new Date().toISOString()
        });
      }
      
      return filterAndSortReviews(placeDetails.reviews, options);
    } catch (error) {
      console.error('Error fetching reviews from Google Places API:', error);
      
      // Skip stale cache for test project
      if (isTestProject) {
        console.log('Test project: Not using stale cache');
        throw error;
      }
      // Fall back to possibly stale cache if available
      const { data: cachedReviews } = await supabase
        .from('review_cache')
        .select('*')
        .eq('place_id', placeId)
        .eq('project_id', projectId)
        .single();
        
      if (cachedReviews) {
        console.log('Using stale cache as fallback');
        return filterAndSortReviews(cachedReviews.reviews, options);
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error in getReviewsForPlace:', error);
    throw error;
  }
}



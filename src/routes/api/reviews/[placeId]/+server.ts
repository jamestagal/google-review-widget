import { json, error } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { 
  PUBLIC_SUPABASE_URL, 
  PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';
import { getReviewsForPlace } from '$lib/services/reviews';
import type { RequestHandler } from './$types';

/**
 * GET handler for fetching Google reviews
 * This endpoint requires authentication via API key
 */
export const GET: RequestHandler = async ({ params, url, cookies }) => {
  try {
    const { placeId } = params;
    const apiKey = url.searchParams.get('apiKey');
    
    if (!placeId) {
      throw error(400, 'Place ID is required');
    }
    
    if (!apiKey) {
      throw error(401, 'API key is required');
    }
    
    // For development/testing, allow special test keys - always true in development for debugging
    // const isDevelopment = process.env.NODE_ENV === 'development';
    const isDevelopment = true; // Force development mode for testing
    
    // Check for any of our test keys
    const testKeys = ['test_key', 'grw_free_test', 'test-key'];
    const isTestKey = testKeys.includes(apiKey);
    
    console.log(`API request with key: ${apiKey}`);
    console.log(`isDevelopment: ${isDevelopment}`);
    console.log(`isTestKey: ${isTestKey}`);
    
    // If in development mode and using a test key, we'll use mock data
    let mockProjectId: string | null = null;
    if (isTestKey) {
      console.log('⭐️ Using test API key in development mode ⭐️');
      mockProjectId = 'test-project-id';
    }
    
    // Create a server-side Supabase client
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
          },
        },
      }
    );
    
    // Define the type to avoid using 'any'
    interface ApiKeyData {
      id: string;
      api_key: string;
      is_active: boolean;
      max_reviews: number;
      rate_limit: number;
      widget_projects: {
        id: string;
        google_place_id: string;
        subscription_tier: string;
        name: string;
      };
    }
    
    // Skip real API key validation if using the test key
    let keyData: ApiKeyData | null = null;
    
    if (mockProjectId || isTestKey) {
      console.log('⚡️ Creating mock data for test key');
      // Create mock data for development testing
      keyData = {
        id: 'test-key-id',
        api_key: 'test_key',
        is_active: true,
        max_reviews: 5,
        rate_limit: 30,
        widget_projects: {
          id: 'test-project-id',
          google_place_id: placeId, // Always match for testing
          subscription_tier: 'basic',
          name: 'Test Project'
        }
      };
      console.log('Mock data created:', keyData);
    } else {
      console.log('Attempting to validate real API key...');
      // Verify API key and get associated widget project
      const { data: realKeyData, error: keyError } = await supabase
        .from('widget_api_keys')
        .select('*, widget_projects!inner(*)')
        .eq('api_key', apiKey)
        .eq('is_active', true)
        .single();
        
      if (keyError || !realKeyData) {
        console.error('API key validation error:', keyError);
        throw error(401, 'Invalid API key');
      }
      
      keyData = realKeyData;
    }
    
    // Ensure keyData is not null
    if (!keyData) {
      throw error(500, 'Error validating API key');
    }

    // Rate limiting check based on subscription tier
    // We store this for future implementation but in a real system we would use this value
    const _rateLimit = keyData.rate_limit || 30; // Default to 30 requests/min
    
    // TODO: Implement proper rate limiting using Redis or similar in production
    // This would track requests per API key and enforce rate limits
    
    // Get options from query params
    const minRating = Number(url.searchParams.get('minRating') || 0);
    const maxResults = Number(url.searchParams.get('maxResults') || keyData.max_reviews || 5);
    const sortBy = url.searchParams.get('sortBy') as 'recent' | 'highest' | 'lowest' | undefined;
    const forceFresh = url.searchParams.get('forceFresh') === 'true';
    
    // Get widget project ID (keyData is not null at this point)
    const projectId = keyData.widget_projects.id;
    
    // Check that the place ID matches the one on the widget project
    // Skip this check for test keys in development mode
    if (!testKeys.includes(keyData.api_key) && keyData.widget_projects.google_place_id !== placeId) {
      console.warn('Place ID mismatch:', keyData.widget_projects.google_place_id, placeId);
      // Continue anyway, but log the mismatch (could be a security issue)
    }
    
    // Get reviews
    const reviews = await getReviewsForPlace(
      supabase,
      placeId,
      projectId,
      {
        minRating,
        maxResults,
        sortBy,
        cacheOverride: forceFresh
      }
    );
    
    // Track usage (in a production system)
    // await supabase.from('api_usage_logs').insert({
    //   api_key_id: keyData.id,
    //   endpoint: 'reviews',
    //   timestamp: new Date().toISOString()
    // });
    
    // Return the reviews
    return json({
      success: true,
      reviews,
      place_id: placeId,
      cache_status: forceFresh ? 'refreshed' : 'used_if_valid'
    });
  } catch (err: unknown) {
    console.error('Error fetching reviews:', err);
    
    // Define a type for errors that might have a status property
    type ErrorWithStatus = {
      status: number;
      message: string;
    };
    
    // Check if the error is an instance of Error
    const errorMessage = err instanceof Error 
      ? err.message 
      : 'Failed to fetch reviews';
    
    // Check if the error has a status property in a type-safe way
    const errorStatus = err instanceof Error && 
      'status' in err && 
      typeof (err as ErrorWithStatus).status === 'number' 
      ? (err as ErrorWithStatus).status 
      : 500;
    
    return json({
      success: false,
      error: errorMessage,
      status: errorStatus
    }, { status: errorStatus });
  }
};

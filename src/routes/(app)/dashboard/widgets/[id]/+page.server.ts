import { createServerClient } from '@supabase/ssr';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Define a custom error interface for better type safety
interface AppError {
  status?: number;
  message?: string;
  stack?: string;
}

/**
 * Widget editor page server load function
 * Following Supabase integration best practices
 */
export const load: PageServerLoad = async ({ cookies, params, setHeaders }) => {
  // Get widget ID from route parameters
  const widgetId = params.id;
  
  // Create server client with proper cookie handling
  const supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    { cookies: {
      get: (key) => cookies.get(key),
      set: (key, value, options) => {
        cookies.set(key, value, { ...options, path: '/' });
      },
      remove: (key, options) => {
        cookies.delete(key, { ...options, path: '/' });
      }
    }}
  );
  
  // Check if user is authenticated - use getUser() for secure authentication
  const { data: { user } } = await supabase.auth.getUser();

  // If no user is authenticated, return error
  if (!user) {
    console.error('User not authenticated');
    throw error(401, 'Unauthorized');
  }

  try {
    console.log('Fetching widget with ID:', widgetId);
    
    // Validate widgetId
    if (!widgetId) {
      console.error('Widget ID is missing from params');
      throw error(400, 'Widget ID is required');
    }
    
    // Get business profiles first to make joining easier
    const { data: businessProfiles, error: profilesError } = await supabase
      .from('business_profiles')
      .select('id, business_name, google_place_id')
      .eq('user_id', user.id);
      
    if (profilesError) {
      console.error('Error fetching business profiles:', profilesError);
      // Continue anyway, might not need business profiles
    }
    
    // Optimize query by selecting only needed fields, but don't try to join business_profiles
    const { data: widget, error: widgetError } = await supabase
      .from('widget_projects')
      .select(`
        id,
        name,
        api_key,
        business_profile_id,
        display_type,
        theme,
        colors,
        fonts,
        filters,
        display,
        subscription_tier,
        created_at,
        updated_at,
        user_id
      `)
      .eq('id', widgetId)
      .eq('user_id', user.id) // Ensure RLS by explicitly checking user_id
      .single();
    
    if (widgetError) {
      console.error('Widget not found error:', widgetError);
      throw error(404, 'Widget not found');
    }
    
    if (!widget) {
      console.error('Widget is null or undefined despite no error');
      throw error(404, 'Widget not found');
    }
    
    console.log('Widget data retrieved successfully:', JSON.stringify(widget, null, 2));
    
    // Find the matching business profile if it exists
    let businessProfile = null;
    if (widget.business_profile_id && businessProfiles) {
      businessProfile = businessProfiles.find(
        profile => profile.id === widget.business_profile_id
      );
    }
    
    // Manually add the business_profiles property
    widget.business_profiles = businessProfile ? {
      business_name: businessProfile.business_name,
      google_place_id: businessProfile.google_place_id
    } : null;
    
    // Verify essential widget properties exist
    if (!widget.display_type) {
      console.warn('Widget is missing display_type, using default');
      widget.display_type = 'grid';
    }
    
    // Ensure JSON fields are properly initialized
    widget.colors = widget.colors || { background: '#ffffff', text: '#333333', stars: '#FFD700', links: '#0070f3', buttons: '#0070f3' };
    widget.fonts = widget.fonts || { family: 'inherit', titleSize: '1.25rem', bodySize: '1rem', weight: 'normal' };
    widget.filters = widget.filters || { minRating: 1, maxAge: 365, sortBy: 'newest' };
    widget.display = widget.display || { showHeader: true, showRating: true, showPhotos: true, reviewLimit: 10, width: '100%', height: 'auto' };
    
    // Set cache headers to improve performance
    setHeaders({
      'Cache-Control': 'private, max-age=60', // Cache for 60 seconds for authenticated users
      'Vary': 'Cookie' // Vary cache based on cookies (for authentication)
    });
    
    return {
      widget
    };
  } catch (err: unknown) {
    console.error('Error fetching widget:', err);
    
    // Convert to our error type for better handling
    const appError = err as AppError;
    
    // Provide more specific error messages based on error type
    if (appError.status === 404) {
      throw error(404, 'Widget not found. Please check the ID and try again.');
    } else if (appError.status === 401) {
      throw error(401, 'You are not authorized to view this widget.');
    } else {
      console.error('Stack trace:', appError.stack || 'No stack trace available');
      throw error(500, 'Failed to load widget. Please try again later.');
    }
  }
};

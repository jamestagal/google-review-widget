import { createServerClient } from '@supabase/ssr';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * POST endpoint for tracking widget impressions
 * This endpoint calls the track_widget_impression() function in Supabase
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Create Supabase server client
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
          }
        }
      }
    );

    // Get request data
    const data = await request.json();
    const {
      widget_id,
      api_key,
      visitor_id,
      referrer,
      referrer_domain,
      user_agent,
      screen_size
    } = data;

    // Validate required fields
    if (!widget_id || !api_key) {
      throw error(400, 'Missing required fields: widget_id and api_key');
    }

    // First, verify that the widget exists and the API key is valid
    const { data: widget, error: widgetError } = await supabase
      .from('widget_projects')
      .select('id')
      .eq('id', widget_id)
      .eq('api_key', api_key)
      .single();

    if (widgetError || !widget) {
      console.error('Widget validation error:', widgetError);
      throw error(401, 'Invalid widget ID or API key');
    }

    // Track the impression using the database function
    const { data: _result, error: trackError } = await supabase
      .rpc('track_widget_impression', {
        p_widget_id: widget_id,
        p_visitor_id: visitor_id || null
      });

    if (trackError) {
      console.error('Error tracking impression:', trackError);
      throw error(500, 'Failed to track impression');
    }

    // Insert record into widget_usage_stats table
    const { error: statsError } = await supabase
      .from('widget_usage_stats')
      .insert({
        widget_id,
        date_hour: new Date().toISOString(),
        views: 1,
        visitor_id: visitor_id || null,
        referrer: referrer || null,
        referrer_domain: referrer_domain || null,
        user_agent: user_agent || null,
        screen_size: screen_size || null
      });

    if (statsError) {
      console.error('Error inserting usage stats:', statsError);
      // Don't throw here, as we've already tracked the impression
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error in impression tracking endpoint:', err);
    
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    
    throw error(500, 'Internal server error');
  }
};

/**
 * GET endpoint for pixel tracking fallback
 * This handles tracking via image pixels when fetch API fails (e.g., due to CORS)
 */
export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    // Create Supabase server client
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
          }
        }
      }
    );

    // Get parameters from URL
    const widget_id = url.searchParams.get('widget_id');
    const api_key = url.searchParams.get('api_key');
    const visitor_id = url.searchParams.get('visitor_id');
    const referrer = url.searchParams.get('referrer');
    const referrer_domain = url.searchParams.get('referrer_domain');
    const user_agent = url.searchParams.get('user_agent');
    const screen_size = url.searchParams.get('screen_size');

    // Validate required fields
    if (!widget_id || !api_key) {
      throw error(400, 'Missing required fields: widget_id and api_key');
    }

    // First, verify that the widget exists and the API key is valid
    const { data: widget, error: widgetError } = await supabase
      .from('widget_projects')
      .select('id')
      .eq('id', widget_id)
      .eq('api_key', api_key)
      .single();

    if (widgetError || !widget) {
      console.error('Widget validation error:', widgetError);
      throw error(401, 'Invalid widget ID or API key');
    }

    // Track the impression using the database function
    const { data: _result, error: trackError } = await supabase
      .rpc('track_widget_impression', {
        p_widget_id: widget_id,
        p_visitor_id: visitor_id || null
      });

    if (trackError) {
      console.error('Error tracking impression:', trackError);
      throw error(500, 'Failed to track impression');
    }

    // Insert record into widget_usage_stats table
    const { error: statsError } = await supabase
      .from('widget_usage_stats')
      .insert({
        widget_id,
        date_hour: new Date().toISOString(),
        views: 1,
        visitor_id: visitor_id || null,
        referrer: referrer || null,
        referrer_domain: referrer_domain || null,
        user_agent: user_agent || null,
        screen_size: screen_size || null
      });

    if (statsError) {
      console.error('Error inserting usage stats:', statsError);
      // Don't throw here, as we've already tracked the impression
    }

    // Return a 1x1 transparent GIF
    return new Response(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (err) {
    console.error('Error in pixel tracking endpoint:', err);
    
    // Return a 1x1 transparent GIF even on error to avoid broken images
    return new Response(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
};

import { createServerClient } from '@supabase/ssr';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * POST endpoint for tracking widget interactions (clicks)
 * This endpoint calls the track_widget_click() function in Supabase
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
      _interaction_type,
      _element_id,
      referrer,
      referrer_domain
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

    // Track the interaction using the database function
    const { data: _result, error: trackError } = await supabase
      .rpc('track_widget_click', {
        p_widget_id: widget_id,
        p_visitor_id: visitor_id || null
      });

    if (trackError) {
      console.error('Error tracking interaction:', trackError);
      throw error(500, 'Failed to track interaction');
    }

    // Update widget_usage_stats table to increment interactions
    // First, try to find an existing record for this widget and date
    const now = new Date();
    const dateHour = now.toISOString().split(':')[0] + ':00:00Z'; // Round to the hour
    
    const { data: existingStats, error: statsQueryError } = await supabase
      .from('widget_usage_stats')
      .select('id, interactions')
      .eq('widget_id', widget_id)
      .eq('date_hour', dateHour)
      .eq('visitor_id', visitor_id || null)
      .maybeSingle();
      
    if (statsQueryError) {
      console.error('Error querying usage stats:', statsQueryError);
    } else if (existingStats) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('widget_usage_stats')
        .update({
          interactions: (existingStats.interactions || 0) + 1,
          updated_at: now.toISOString()
        })
        .eq('id', existingStats.id);
        
      if (updateError) {
        console.error('Error updating usage stats:', updateError);
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('widget_usage_stats')
        .insert({
          widget_id,
          date_hour: dateHour,
          interactions: 1,
          visitor_id: visitor_id || null,
          referrer: referrer || null,
          referrer_domain: referrer_domain || null
        });
        
      if (insertError) {
        console.error('Error inserting usage stats:', insertError);
      }
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error in interaction tracking endpoint:', err);
    
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
    const _interaction_type = url.searchParams.get('interaction_type') || 'click';
    const _element_id = url.searchParams.get('element_id');
    const referrer = url.searchParams.get('referrer');
    const referrer_domain = url.searchParams.get('referrer_domain');

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

    // Track the interaction using the database function
    const { data: _result, error: trackError } = await supabase
      .rpc('track_widget_click', {
        p_widget_id: widget_id,
        p_visitor_id: visitor_id || null
      });

    if (trackError) {
      console.error('Error tracking interaction:', trackError);
      throw error(500, 'Failed to track interaction');
    }

    // Update widget_usage_stats table to increment interactions
    // First, try to find an existing record for this widget and date
    const now = new Date();
    const dateHour = now.toISOString().split(':')[0] + ':00:00Z'; // Round to the hour
    
    const { data: existingStats, error: statsQueryError } = await supabase
      .from('widget_usage_stats')
      .select('id, interactions')
      .eq('widget_id', widget_id)
      .eq('date_hour', dateHour)
      .eq('visitor_id', visitor_id || null)
      .maybeSingle();
      
    if (statsQueryError) {
      console.error('Error querying usage stats:', statsQueryError);
    } else if (existingStats) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('widget_usage_stats')
        .update({
          interactions: (existingStats.interactions || 0) + 1,
          updated_at: now.toISOString()
        })
        .eq('id', existingStats.id);
        
      if (updateError) {
        console.error('Error updating usage stats:', updateError);
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('widget_usage_stats')
        .insert({
          widget_id,
          date_hour: dateHour,
          interactions: 1,
          visitor_id: visitor_id || null,
          referrer: referrer || null,
          referrer_domain: referrer_domain || null
        });
        
      if (insertError) {
        console.error('Error inserting usage stats:', insertError);
      }
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

// src/lib/services/widget-usage.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface WidgetUsage {
  totalViews: number;
  viewsByDay: { date: string; count: number }[];
  viewsByDomain: { domain: string; count: number }[];
  lastViewed: string | null;
}

/**
 * Track a new widget view
 */
export async function trackWidgetView(
  supabase: SupabaseClient,
  widgetId: string,
  apiKeyId: string,
  referer: string | null
): Promise<void> {
  try {
    // Extract domain from referer
    let domain = 'unknown';
    if (referer) {
      try {
        domain = new URL(referer).hostname;
      } catch (e) {
        // Invalid URL, keep as unknown
      }
    }
    
    // Update widget view count
    await supabase.rpc('increment_widget_views', { 
      widget_id: widgetId
    });
    
    // Log detailed usage data
    await supabase.from('widget_usage_stats').insert({
      api_key_id: apiKeyId,
      date: new Date().toISOString().split('T')[0],
      referer_domain: domain,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
    });
  } catch (error) {
    console.error('Failed to track widget view:', error);
    // Don't throw the error - tracking should be non-blocking
  }
}

/**
 * Get usage statistics for a widget
 */
export async function getWidgetUsage(
  supabase: SupabaseClient,
  widgetId: string
): Promise<WidgetUsage> {
  // Get widget views count and last viewed date
  const { data: widget, error: widgetError } = await supabase
    .from('widget_projects')
    .select('view_count, last_viewed_at')
    .eq('id', widgetId)
    .single();
  
  if (widgetError) {
    throw new Error(`Failed to get widget: ${widgetError.message}`);
  }
  
  // Get widget API key for usage stats lookup
  const { data: widgetWithKey, error: keyError } = await supabase
    .from('widget_projects')
    .select('api_key')
    .eq('id', widgetId)
    .single();
  
  if (keyError) {
    throw new Error(`Failed to get widget API key: ${keyError.message}`);
  }
  
  // Get API key ID
  const { data: apiKey, error: apiKeyError } = await supabase
    .from('widget_api_keys')
    .select('id')
    .eq('api_key', widgetWithKey.api_key)
    .single();
  
  if (apiKeyError) {
    throw new Error(`Failed to get API key ID: ${apiKeyError.message}`);
  }
  
  // Get usage stats by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: usageByDay, error: usageError } = await supabase
    .from('widget_usage_stats')
    .select('date, count(*)')
    .eq('api_key_id', apiKey.id)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .group('date')
    .order('date');
  
  if (usageError) {
    throw new Error(`Failed to get usage stats: ${usageError.message}`);
  }
  
  // Get usage stats by domain
  const { data: usageByDomain, error: domainError } = await supabase
    .from('widget_usage_stats')
    .select('referer_domain, count(*)')
    .eq('api_key_id', apiKey.id)
    .group('referer_domain')
    .order('count', { ascending: false })
    .limit(10);
  
  if (domainError) {
    throw new Error(`Failed to get domain stats: ${domainError.message}`);
  }
  
  return {
    totalViews: widget.view_count || 0,
    lastViewed: widget.last_viewed_at,
    viewsByDay: usageByDay?.map(item => ({
      date: item.date,
      count: parseInt(item.count, 10)
    })) || [],
    viewsByDomain: usageByDomain?.map(item => ({
      domain: item.referer_domain,
      count: parseInt(item.count, 10)
    })) || []
  };
}
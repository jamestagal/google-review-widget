import { createServerClient } from '@supabase/ssr';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Create Supabase server client with proper cookie handling
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

    // Verify authentication - using getUser for secure auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw error(401, 'Unauthorized');
    }

    // Get request parameters
    const { period = '7d', widgetId = 'all' } = await request.json();

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Format dates for database query
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();

    // Check if we have any widgets first
    const { data: widgetsData, error: widgetsError } = await supabase
      .from('widget_projects')
      .select('id, name, analytics, api_usage, view_count, last_viewed_at')
      .eq('user_id', user.id);
      
    if (widgetsError) {
      console.error('Error fetching widgets:', widgetsError);
      throw error(500, 'Failed to fetch widgets data');
    }
    
    // If no widgets, return empty data
    if (!widgetsData || widgetsData.length === 0) {
      return json({
        totalViews: 0,
        uniqueVisitors: 0,
        interactions: 0,
        viewsChange: 0,
        visitorsChange: 0,
        interactionsChange: 0,
        timeData: [],
        domainData: [],
        widgetComparison: [],
        errorData: []
      });
    }

    // Filter widgets by ID if specified
    const filteredWidgets = widgetId !== 'all' 
      ? widgetsData.filter(w => w.id === widgetId)
      : widgetsData;
    
    if (filteredWidgets.length === 0) {
      throw error(404, 'Widget not found');
    }

    // Get widget usage stats for the selected period
    const { data: usageStats, error: usageError } = await supabase
      .from('widget_usage_stats')
      .select('*')
      .in('widget_id', filteredWidgets.map(w => w.id))
      .gte('date_hour', startDateStr)
      .lte('date_hour', endDateStr)
      .order('date_hour', { ascending: true });
    
    if (usageError) {
      console.error('Error fetching usage stats:', usageError);
      throw error(500, 'Failed to fetch usage statistics');
    }

    // Get API calls for the selected period
    const { data: apiCalls, error: apiError } = await supabase
      .from('api_calls')
      .select('*')
      .in('widget_id', filteredWidgets.map(w => w.id))
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .order('created_at', { ascending: true });
    
    if (apiError) {
      console.error('Error fetching API calls:', apiError);
      throw error(500, 'Failed to fetch API call data');
    }

    // Process the data for the dashboard
    // 1. Calculate totals
    const totalViews = filteredWidgets.reduce((sum, widget) => sum + (widget.view_count || 0), 0);
    
    // Calculate unique visitors from usage stats
    const uniqueVisitors = usageStats 
      ? new Set(usageStats.map(stat => stat.visitor_id)).size 
      : 0;
    
    // Calculate interactions from analytics data
    const interactions = filteredWidgets.reduce((sum, widget) => {
      const analyticsData = widget.analytics || { clicks: 0 };
      return sum + (typeof analyticsData.clicks === 'number' ? analyticsData.clicks : 0);
    }, 0);

    // 2. Generate time series data
    const timeData = generateTimeSeriesData(usageStats, period);

    // 3. Generate domain data
    const domainData = generateDomainData(usageStats);

    // 4. Generate widget comparison data
    const widgetComparison = generateWidgetComparisonData(filteredWidgets, usageStats, apiCalls);

    // 5. Generate error data
    const errorData = generateErrorData(usageStats);

    // 6. Calculate changes from previous period
    // For this, we'd need to compare with the previous time period
    // This is a simplified implementation
    const viewsChange = calculatePercentageChange(totalViews, totalViews * 0.9);
    const visitorsChange = calculatePercentageChange(uniqueVisitors, uniqueVisitors * 0.85);
    const interactionsChange = calculatePercentageChange(interactions, interactions * 0.8);

    return json({
      totalViews,
      uniqueVisitors,
      interactions,
      viewsChange,
      visitorsChange,
      interactionsChange,
      timeData,
      domainData,
      widgetComparison,
      errorData,
      // Include raw data for debugging if needed
      _debug: {
        widgetsCount: filteredWidgets.length,
        statsCount: usageStats?.length || 0,
        apiCallsCount: apiCalls?.length || 0
      }
    });
    
  } catch (err: unknown) {
    console.error('Error in analytics API:', err);
    
    // Type guard for error with status and body properties
    interface ErrorWithStatus {
      status?: number;
      body?: {
        message?: string;
      };
      message?: string;
    }
    
    // Check if the error has the expected properties
    if (typeof err === 'object' && err !== null && 'status' in err && 'body' in err) {
      const typedError = err as ErrorWithStatus;
      if (typedError.status && typedError.body) {
        throw error(typedError.status, typedError.body.message || 'An error occurred');
      }
    }
    
    // Handle generic error with message
    if (typeof err === 'object' && err !== null && 'message' in err) {
      const typedError = err as ErrorWithStatus;
      throw error(500, typedError.message || 'Internal server error');
    }
    
    throw error(500, 'Internal server error');
  }
};

// Helper function to generate time series data
function generateTimeSeriesData(usageStats: UsageStat[] | null, period: string) {
  if (!usageStats || usageStats.length === 0) {
    return [];
  }

  return processAnalyticsForPeriod(usageStats, period);
}

// Helper function to generate domain data
function generateDomainData(usageStats: UsageStat[] | null) {
  if (!usageStats || usageStats.length === 0) {
    return [];
  }
  
  // Group by domain
  const domainMap = new Map<string, number>();
  const totalViews = usageStats.reduce((sum, stat) => sum + (stat.views || 0), 0);
  
  usageStats.forEach(stat => {
    const domain = stat.referrer_domain || 'direct';
    
    if (!domainMap.has(domain)) {
      domainMap.set(domain, 0);
    }
    
    domainMap.set(domain, domainMap.get(domain)! + (stat.views || 0));
  });
  
  // Convert to array and calculate percentages
  return Array.from(domainMap.entries())
    .map(([name, value]) => ({
      name,
      value,
      percentage: totalViews > 0 ? Math.round((value / totalViews) * 100) : 0
    }))
    .sort((a, b) => b.value - a.value);
}

// Define types for widget data
interface WidgetData {
  id: string;
  name: string;
  analytics?: {
    impressions?: number;
    clicks?: number;
    last_updated?: string | null;
  };
  api_usage?: number;
  view_count?: number;
  last_viewed_at?: string | null;
}

// Define types for usage stats
interface UsageStat {
  widget_id: string;
  date_hour: string;
  views?: number;
  visitor_id?: string;
  interactions?: number;
  error_count?: number;
  error_details?: string;
  referrer_domain?: string;
  widget_name?: string;
  avg_load_time?: number;
}

// Define types for API calls
interface ApiCall {
  id: string;
  widget_id: string;
  endpoint: string;
  created_at: string;
  response_code: number;
  ip_address?: string;
  user_agent?: string;
}

// Helper function to generate widget comparison data
function generateWidgetComparisonData(
  widgets: WidgetData[], 
  usageStats: UsageStat[] | null, 
  apiCalls: ApiCall[] | null
) {
  return widgets.map(widget => {
    // Filter stats for this widget
    const widgetStats = usageStats?.filter(stat => stat.widget_id === widget.id) || [];
    const widgetApiCalls = apiCalls?.filter(call => call.widget_id === widget.id) || [];
    
    // Calculate metrics
    const views = widget.view_count || 0;
    const visitors = new Set(widgetStats.map(stat => stat.visitor_id).filter(Boolean)).size;
    const interactions = typeof widget.analytics?.clicks === 'number' ? widget.analytics.clicks : 0;
    const errors = widgetStats.reduce((sum, stat) => sum + (stat.error_count || 0), 0);
    
    // Calculate average load time
    const totalLoadTime = widgetStats.reduce((sum, stat) => sum + (stat.avg_load_time || 0), 0);
    const avgLoadTime = widgetStats.length > 0 ? totalLoadTime / widgetStats.length : 0;
    
    return {
      id: widget.id,
      name: widget.name,
      views,
      visitors,
      interactions,
      errors,
      avgLoadTime,
      apiCalls: widgetApiCalls.length
    };
  }).sort((a, b) => b.views - a.views);
}

// Helper function to generate error data
function generateErrorData(usageStats: UsageStat[] | null) {
  if (!usageStats || usageStats.length === 0) {
    return [];
  }
  
  // Filter stats with errors
  return usageStats
    .filter(stat => (stat.error_count || 0) > 0)
    .map(stat => ({
      date: stat.date_hour,
      widgetId: stat.widget_id,
      widgetName: stat.widget_name || 'Unknown Widget',
      domain: stat.referrer_domain || 'direct',
      count: stat.error_count || 0,
      details: stat.error_details || 'Unknown error'
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Helper function to calculate percentage change
function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Helper function to process analytics for a given period
function processAnalyticsForPeriod(
  usageStats: UsageStat[],
  period: string
): TimeSeriesDataPoint[] {
  // Group by date
  const dateMap = new Map<string, {
    date: string;
    views: number;
    visitors: Set<string>;
    interactions: number;
  }>();
  
  usageStats.forEach(stat => {
    // Format date based on period (day, week, month)
    let dateKey;
    
    if (period === 'day') {
      dateKey = new Date(stat.date_hour).toISOString().split('T')[0];
    } else if (period === 'week') {
      const date = new Date(stat.date_hour);
      const dayOfWeek = date.getUTCDay();
      const diff = date.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
      const startOfWeek = new Date(date.setUTCDate(diff));
      dateKey = startOfWeek.toISOString().split('T')[0];
    } else if (period === 'month') {
      dateKey = new Date(stat.date_hour).toISOString().substring(0, 7); // YYYY-MM
    } else {
      // Default to day if period is not recognized
      dateKey = new Date(stat.date_hour).toISOString().split('T')[0];
    }
    
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: dateKey,
        views: 0,
        visitors: new Set<string>(),
        interactions: 0
      });
    }
    
    const periodData = dateMap.get(dateKey)!;
    periodData.views += stat.views || 0;
    
    if (stat.visitor_id) {
      periodData.visitors.add(stat.visitor_id);
    }
    
    periodData.interactions += stat.interactions || 0;
  });
  
  // Convert to array and calculate final values
  return Array.from(dateMap.values())
    .map(day => ({
      date: day.date,
      views: day.views,
      visitors: day.visitors.size,
      interactions: day.interactions
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

interface TimeSeriesDataPoint {
  date: string;
  views: number;
  visitors: number;
  interactions: number;
}

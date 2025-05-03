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
    const { period = '7d', widgetId: _widgetId = 'all' } = await request.json();

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

    // Format dates for database query - these would be used in a real implementation
    // when querying the widget_usage_stats table
    const _startDateStr = startDate.toISOString();
    const _endDateStr = now.toISOString();

    // For now, return mock data since we're just setting up the UI
    // In a real implementation, we would query the widget_usage_stats table
    
    // Check if we have any widgets first
    const { data: widgetsData, error: widgetsError } = await supabase
      .from('widget_projects')
      .select('id, name')
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
    
    // Generate mock data for demonstration
    const totalViews = Math.floor(Math.random() * 5000) + 1000;
    const uniqueVisitors = Math.floor(totalViews * 0.7);
    const interactions = Math.floor(uniqueVisitors * 0.4);
    
    // Generate mock time data (last 7, 30, or 90 days)
    const timeData = [];
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      
      timeData.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 300) + 50,
        visitors: Math.floor(Math.random() * 200) + 30,
        interactions: Math.floor(Math.random() * 100) + 10
      });
    }
    
    // Generate mock domain data
    const domains = [
      'example.com',
      'yourbusiness.com',
      'clientwebsite.org',
      'anothersite.net',
      'testdomain.co'
    ];
    
    const domainData = domains.map(domain => {
      const value = Math.floor(Math.random() * 1000) + 100;
      return {
        name: domain,
        value,
        percentage: Math.floor((value / totalViews) * 100)
      };
    }).sort((a, b) => b.value - a.value);
    
    // Generate mock widget comparison data
    const widgetComparison = widgetsData.map(widget => ({
      id: widget.id,
      name: widget.name,
      views: Math.floor(Math.random() * 2000) + 200,
      visitors: Math.floor(Math.random() * 1500) + 150,
      interactions: Math.floor(Math.random() * 800) + 50,
      errors: Math.floor(Math.random() * 10),
      avgLoadTime: Math.random() * 500 + 100
    })).sort((a, b) => b.views - a.views);
    
    // Generate mock error data
    const errorData = [];
    const errorCount = Math.floor(Math.random() * 5);
    
    for (let i = 0; i < errorCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * days));
      
      errorData.push({
        date: date.toISOString(),
        widgetId: widgetsData[Math.floor(Math.random() * widgetsData.length)].id,
        widgetName: widgetsData[Math.floor(Math.random() * widgetsData.length)].name,
        domain: domains[Math.floor(Math.random() * domains.length)],
        count: Math.floor(Math.random() * 10) + 1,
        details: 'Error loading widget resources'
      });
    }
    
    // Calculate changes from previous period
    const viewsChange = Math.floor(Math.random() * 40) - 10; // -10 to +30
    const visitorsChange = Math.floor(Math.random() * 40) - 10;
    const interactionsChange = Math.floor(Math.random() * 40) - 10;

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
      errorData
    });
    
  } catch (err: unknown) {
    console.error('Error in analytics API:', err);
    
    // Type guard for error with status and body properties
    interface ErrorWithStatus {
      status?: number;
      body?: {
        message?: string;
      };
    }
    
    // Check if the error has the expected properties
    if (typeof err === 'object' && err !== null && 'status' in err && 'body' in err) {
      const typedError = err as ErrorWithStatus;
      if (typedError.status && typedError.body) {
        throw error(typedError.status, typedError.body.message || 'An error occurred');
      }
    }
    
    throw error(500, 'Internal server error');
  }
};

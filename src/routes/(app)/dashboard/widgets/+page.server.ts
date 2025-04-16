import { createServerClient } from '$lib/utils/supabase/server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Widgets dashboard page server load function
 * Following Supabase integration rules for secure authentication
 */
export const load: PageServerLoad = async ({ cookies, url }) => {
  // Create server client using the utility function
  const supabase = createServerClient(cookies);
  
  // Check if user is authenticated - use getUser() for secure authentication
  const { data: { user } } = await supabase.auth.getUser();

  // If no user is authenticated, return early
  if (!user) {
    return {
      widgets: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      sortBy: 'created_at',
      sortOrder: 'desc',
      filterName: ''
    };
  }

  try {    
    // Get query parameters for pagination, filtering, and sorting
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const filterName = url.searchParams.get('name') || '';
    
    // Validate parameters to prevent SQL injection
    const validSortFields = ['created_at', 'updated_at', 'name', 'views_count'];
    const validSortOrders = ['asc', 'desc'];
    
    // If parameters are invalid, use defaults
    const sanitizedSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sanitizedSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';
    const sanitizedPage = isNaN(page) || page < 1 ? 1 : page;
    const sanitizedPageSize = isNaN(pageSize) || pageSize < 1 || pageSize > 100 ? 10 : pageSize;
    
    // Calculate pagination range
    const from = (sanitizedPage - 1) * sanitizedPageSize;
    const to = from + sanitizedPageSize - 1;

    // Query widgets with proper relationship to business profiles
    let widgetsQuery = supabase
      .from('widget_projects')
      .select(`
        *,
        business_profiles(business_name, google_place_id)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order(sanitizedSortBy, { ascending: sanitizedSortOrder === 'asc' })
      .range(from, to);
    
    // Apply name filter if provided
    if (filterName) {
      widgetsQuery = widgetsQuery.ilike('name', `%${filterName}%`);
    }
    
    const { data: widgets, count, error: widgetsError } = await widgetsQuery;
    
    if (widgetsError) {
      console.error('Database error:', widgetsError);
      throw error(500, `Error fetching widgets: ${widgetsError.message}`);
    }

    // Get widget usage stats for the fetched widgets
    const widgetIds = widgets?.map(widget => widget.id) || [];
    
    // Only query usage stats if we have widgets
    let usageStats = [];
    if (widgetIds.length > 0) {
      const { data: stats, error: usageError } = await supabase
        .from('widget_usage_stats')
        .select('widget_id, views, referrer')
        .in('widget_id', widgetIds);
        
      if (!usageError && stats) {
        usageStats = stats;
      } else if (usageError) {
        console.error('Usage stats error:', usageError);
      }
    }
      
    // Client-side processing of usage statistics
    const processedStats = [];
    if (usageStats.length > 0) {
      // Group by widget_id and calculate totals
      const statsMap = new Map();
      for (const stat of usageStats) {
        if (!statsMap.has(stat.widget_id)) {
          statsMap.set(stat.widget_id, { 
            widget_id: stat.widget_id, 
            total_views: 0, 
            referrers: new Set() 
          });
        }
        const entry = statsMap.get(stat.widget_id);
        entry.total_views += (stat.views || 0);
        if (stat.referrer) entry.referrers.add(stat.referrer);
      }
      
      // Convert to array format for easier consumption
      for (const [widget_id, stats] of statsMap.entries()) {
        processedStats.push({
          widget_id,
          total_views: stats.total_views,
          embed_count: stats.referrers.size
        });
      }
    }
    
    // Combine widgets with their usage stats
    const widgetsWithStats = widgets?.map(widget => {
      const stats = processedStats.find(stat => stat.widget_id === widget.id);
      
      // Extract business name from the relationship
      const businessProfile = widget.business_profiles || {};
      const businessName = businessProfile?.business_name || 'Business';
        
      return {
        ...widget,
        views_count: stats?.total_views || 0,
        embed_count: stats?.embed_count || 0,
        place_name: businessName
      };
    }) || [];

    // Calculate total pages
    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / sanitizedPageSize));
    
    // Ensure page is not beyond total pages
    const finalPage = sanitizedPage > totalPages ? 1 : sanitizedPage;

    // Return the data for the page
    return {
      widgets: widgetsWithStats,
      totalCount,
      page: finalPage,
      pageSize: sanitizedPageSize,
      totalPages,
      sortBy: sanitizedSortBy,
      sortOrder: sanitizedSortOrder,
      filterName
    };
  } catch (err) {
    console.error('Server error:', err);
    throw error(500, 'Internal server error');
  }
};
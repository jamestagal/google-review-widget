import type { Database } from '../types/database.types';
import { createClient } from '@supabase/supabase-js';

/**
 * This is a test file to verify that our database schema types are working correctly.
 * It's not meant to be executed, just to verify TypeScript compilation.
 */

// Function to test widget_projects analytics fields
async function testWidgetAnalyticsFields() {
  // Create a typed Supabase client
  const supabase = createClient<Database>(
    'https://example.supabase.co',
    'your-anon-key',
    {
      auth: {
        persistSession: false
      }
    }
  );
  
  // Test querying widget_projects with analytics fields
  const { data: widget } = await supabase
    .from('widget_projects')
    .select('id, name, analytics, api_usage, view_count, last_viewed_at')
    .eq('id', 'some-widget-id')
    .single();
    
  if (widget) {
    // Test accessing analytics fields
    const analyticsData = widget.analytics;
    const apiUsage = widget.api_usage;
    const viewCount = widget.view_count;
    const lastViewedAt = widget.last_viewed_at;
    
    console.log({
      analyticsData,
      apiUsage,
      viewCount,
      lastViewedAt
    });
  }
}

// Function to test api_calls table
async function testApiCallsTable() {
  // Create a typed Supabase client
  const supabase = createClient<Database>(
    'https://example.supabase.co',
    'your-anon-key',
    {
      auth: {
        persistSession: false
      }
    }
  );
  
  // Test querying api_calls table
  const { data: apiCalls } = await supabase
    .from('api_calls')
    .select('id, endpoint, created_at, response_code, widget_id')
    .eq('widget_id', 'some-widget-id')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (apiCalls && apiCalls.length > 0) {
    // Test accessing api_calls fields
    const firstCall = apiCalls[0];
    const callId = firstCall.id;
    const endpoint = firstCall.endpoint;
    const responseCode = firstCall.response_code;
    const widgetId = firstCall.widget_id;
    
    console.log({
      callId,
      endpoint,
      responseCode,
      widgetId
    });
  }
  
  // Test inserting into api_calls table
  const { data: newCall } = await supabase
    .from('api_calls')
    .insert({
      endpoint: '/api/reviews',
      response_code: 200,
      widget_id: 'some-widget-id',
      ip_address: '127.0.0.1',
      user_agent: 'Test Agent'
    })
    .select()
    .single();
}

// These functions are just for type checking and won't be executed
export { testWidgetAnalyticsFields, testApiCallsTable };

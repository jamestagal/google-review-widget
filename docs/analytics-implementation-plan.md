# Google Reviews Widget: Analytics Implementation Plan

This document outlines the strategy for implementing analytics tracking and reporting for the Google Reviews Widget project, following the Supabase integration best practices.

## Overview

The analytics system will track widget usage, performance metrics, and user interactions to provide valuable insights to widget owners. This data will help users understand how their widgets are performing and make informed decisions about their configuration.

## Database Schema

### Tables and Migrations

We've already created the migration file `20250410152909_add_widget_analytics.sql` which includes:

1. **Analytics JSON Field**: Added to `widget_projects` table to store impression and click metrics
2. **API Usage Tracking**: Added `api_usage` column to track API requests
3. **API Calls Table**: Created `api_calls` table to track detailed API usage
4. **Tracking Functions**: Created database functions to increment usage counters

### Row Level Security (RLS)

Following our Supabase integration rules, we've implemented RLS policies for the `api_calls` table:

```sql
-- Enable Row Level Security on api_calls
ALTER TABLE public.api_calls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_calls
CREATE POLICY "Users can view their own API calls" ON public.api_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.widget_projects
      WHERE widget_projects.id = api_calls.widget_id
      AND widget_projects.user_id = auth.uid()
    )
  );
```

## Frontend Implementation

### Analytics Dashboard Component

The analytics dashboard component has been added to the widget editor page with the following features:

1. **Impressions Tracking**: Shows the number of times the widget has been viewed
2. **Click Tracking**: Shows the number of times users have clicked on the widget
3. **Click-through Rate**: Calculated based on impressions and clicks
4. **API Usage**: Shows the number of API requests and the monthly limit

### Data Visualization

To enhance the analytics dashboard, we'll implement:

1. **Progress Bars**: Visual representation of usage against limits
2. **Time-based Charts**: Show trends over time (daily, weekly, monthly)
3. **Exportable Reports**: Allow users to download their analytics data

## Backend Implementation

### Tracking Endpoints

We need to create the following API endpoints:

1. **Track Impression**: Record when a widget is viewed
   ```typescript
   // POST /api/track/impression
   export async function POST({ request }) {
     const { widget_id, domain } = await request.json();
     
     // Call the track_widget_impression function
     const { data, error } = await supabase.rpc('track_widget_impression', {
       widget_id,
       domain
     });
     
     if (error) return json({ success: false, error: error.message }, { status: 500 });
     return json({ success: true, data });
   }
   ```

2. **Track Click**: Record when a user clicks on the widget
   ```typescript
   // POST /api/track/click
   export async function POST({ request }) {
     const { widget_id, domain } = await request.json();
     
     // Call the track_widget_click function
     const { data, error } = await supabase.rpc('track_widget_click', {
       widget_id,
       domain
     });
     
     if (error) return json({ success: false, error: error.message }, { status: 500 });
     return json({ success: true, data });
   }
   ```

### Widget Script Integration

The widget embed script needs to be updated to include tracking calls:

```javascript
// In the widget embed script
function trackImpression(widgetId) {
  fetch('/api/track/impression', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widget_id: widgetId, domain: window.location.hostname })
  });
}

function trackClick(widgetId) {
  fetch('/api/track/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widget_id: widgetId, domain: window.location.hostname })
  });
}

// Add event listeners to track interactions
widgetElement.addEventListener('load', () => trackImpression(widgetId));
widgetElement.addEventListener('click', () => trackClick(widgetId));
```

## Rate Limiting and Subscription Tiers

We've implemented rate limiting based on subscription tiers:

```sql
-- Add rate_limit column with default based on subscription tier
ALTER TABLE public.widget_projects
ADD COLUMN IF NOT EXISTS rate_limit INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN subscription_tier = 'FREE' THEN 10000
    WHEN subscription_tier = 'PRO' THEN 50000
    WHEN subscription_tier = 'BUSINESS' THEN 200000
    WHEN subscription_tier = 'ENTERPRISE' THEN 1000000
    ELSE 10000
  END
) STORED;
```

## Implementation Steps

1. **Apply Database Migration**: Run `npx supabase migration up` to apply the analytics schema changes
2. **Create API Endpoints**: Implement the tracking API endpoints
3. **Update Widget Script**: Add tracking calls to the widget embed script
4. **Enhance UI Components**: Connect the analytics dashboard to real data
5. **Test Tracking**: Verify that impressions and clicks are being tracked correctly
6. **Add Data Visualization**: Implement charts and graphs for better data presentation

## Testing Plan

1. **Unit Tests**: Create tests for the tracking functions and API endpoints
2. **Integration Tests**: Test the complete tracking flow from widget to database
3. **Load Tests**: Verify that the system can handle high volumes of tracking requests
4. **Security Tests**: Ensure that RLS policies are properly protecting data

## Monitoring and Maintenance

1. **Usage Alerts**: Set up notifications for when users approach their usage limits
2. **Performance Monitoring**: Track query performance and optimize as needed
3. **Regular Backups**: Ensure analytics data is included in backup procedures

## Conclusion

This analytics implementation plan provides a comprehensive approach to tracking and reporting widget performance. By following Supabase integration best practices, we ensure that the analytics system is secure, scalable, and provides valuable insights to widget owners.

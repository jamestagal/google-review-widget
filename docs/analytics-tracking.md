# Google Reviews Widget Analytics Tracking

This document explains how the analytics tracking system works in the Google Reviews Widget project and how to use it.

## Overview

The analytics tracking system allows widget owners to track impressions and interactions with their Google Reviews widgets. This data is stored in the Supabase database and can be viewed in the analytics dashboard.

## Database Schema

The analytics tracking system uses the following database tables:

1. **widget_projects** - Contains the `analytics` field which stores aggregate analytics data for each widget.
2. **api_calls** - Tracks API usage for each widget.
3. **widget_usage_stats** - Stores detailed usage statistics for each widget, including impressions, interactions, and visitor information.

## Tracking Endpoints

The following API endpoints are available for tracking:

1. **POST /api/track/impression** - Tracks widget impressions (views)
2. **POST /api/track/interaction** - Tracks widget interactions (clicks)
3. **GET /api/track/pixel** - Unified pixel tracking endpoint for both impressions and interactions

## How Tracking Works

The tracking system uses a two-pronged approach:

1. **Client-side tracking** - JavaScript code embedded in the widget tracks impressions and interactions and sends them to the tracking endpoints.
2. **Server-side processing** - The tracking endpoints validate the requests and store the data in the database.

### Impression Tracking

An impression is recorded when a widget is loaded and displayed on a page. The tracking code automatically sends an impression event when the widget loads.

### Interaction Tracking

Interactions are recorded when a user interacts with the widget, such as:

- Clicking on a review
- Navigating through reviews (prev/next buttons)
- Clicking on the "View all reviews" link

## Implementation

### Server-Side Components

1. **Database Functions**:
   - `track_widget_impression(p_widget_id, p_visitor_id)` - Increments impression count
   - `track_widget_click(p_widget_id, p_visitor_id)` - Increments interaction count

2. **API Endpoints**:
   - `/api/track/impression` - POST endpoint for tracking impressions
   - `/api/track/interaction` - POST endpoint for tracking interactions
   - `/api/track/pixel` - GET endpoint for pixel-based tracking (fallback)

3. **Analytics API**:
   - `/api/analytics` - GET endpoint for retrieving analytics data

### Client-Side Components

1. **Analytics Tracker Module** (`/src/lib/tracking/analytics-tracker.ts`):
   - `trackImpression(widgetId, apiKey)` - Tracks a widget impression
   - `trackInteraction(widgetId, apiKey, interactionType, elementId)` - Tracks a widget interaction

2. **Tracking Script** (`/src/lib/tracking/tracking-snippet.js`):
   - Standalone script that can be included in any widget embed to enable tracking
   - Handles both impression and interaction tracking
   - Includes fallback mechanisms for browsers with limited capabilities

## Using the Tracking System

### Automatic Tracking

The tracking system is automatically integrated into the widget preview component. When a widget is loaded, it will automatically track impressions and interactions.

### Manual Tracking

You can manually track impressions and interactions using the `trackImpression` and `trackInteraction` functions from the `analytics-tracker.ts` module:

```typescript
import { trackImpression, trackInteraction } from '$lib/tracking/analytics-tracker';

// Track an impression
trackImpression(widgetId, apiKey);

// Track an interaction
trackInteraction(widgetId, apiKey, 'button-click', 'submit-button');
```

### Embedding Tracking in Custom Widgets

For custom widget implementations, you can include the tracking snippet in your embed code:

1. Copy the tracking snippet from `/src/lib/tracking/tracking-snippet.js`
2. Update the configuration with your widget ID and API key
3. Include the snippet in your widget embed code

## Analytics Dashboard

The analytics dashboard provides a visual representation of the tracking data. It shows:

- Total impressions and interactions
- Unique visitors
- Interaction rate
- Time series data for impressions and interactions
- Referrer domains
- Device and browser information

## Privacy Considerations

The tracking system collects the following information:

- Widget ID and API key
- Visitor ID (randomly generated)
- Referrer URL and domain
- User agent (browser and device information)
- Screen size

No personally identifiable information (PII) is collected. The visitor ID is a randomly generated string that does not contain any personal information.

## Troubleshooting

If tracking is not working as expected, check the following:

1. Ensure the widget ID and API key are correct
2. Check that the tracking endpoints are accessible from the client
3. Look for errors in the browser console
4. Verify that the database functions and tables exist
5. Check that Row Level Security (RLS) policies are correctly configured

## Future Enhancements

Planned enhancements for the tracking system include:

1. More detailed interaction tracking (e.g., time spent viewing each review)
2. Heatmap visualization of interactions
3. A/B testing capabilities
4. Export functionality for analytics data
5. Custom event tracking

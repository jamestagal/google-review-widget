/**
 * Analytics tracking module for Google Review Widget
 * 
 * This module provides functions to track widget impressions and interactions
 * by making API calls to the Supabase database functions.
 */

/**
 * Track a widget impression (view)
 * @param widgetId The ID of the widget being viewed
 * @param apiKey The API key for the widget
 */
export async function trackImpression(widgetId: string, apiKey: string): Promise<void> {
  try {
    // Get visitor information
    const visitorId = getOrCreateVisitorId();
    const referrer = document.referrer || window.location.href;
    const referrerDomain = extractDomain(referrer);
    const userAgent = navigator.userAgent;
    const screenSize = `${window.innerWidth}x${window.innerHeight}`;
    
    // Create payload
    const payload = {
      widget_id: widgetId,
      api_key: apiKey,
      visitor_id: visitorId,
      referrer,
      referrer_domain: referrerDomain,
      user_agent: userAgent,
      screen_size: screenSize
    };
    
    // Send tracking data to the server
    await sendTrackingData('impression', payload);
    
    // Log success in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Tracked impression:', payload);
    }
  } catch (error) {
    console.error('Error tracking impression:', error);
  }
}

/**
 * Track a widget interaction (click)
 * @param widgetId The ID of the widget being interacted with
 * @param apiKey The API key for the widget
 * @param interactionType The type of interaction (e.g., 'click', 'hover')
 * @param elementId Optional ID of the element that was interacted with
 */
export async function trackInteraction(
  widgetId: string, 
  apiKey: string, 
  interactionType: string = 'click',
  elementId?: string
): Promise<void> {
  try {
    // Get visitor information
    const visitorId = getOrCreateVisitorId();
    const referrer = document.referrer || window.location.href;
    const referrerDomain = extractDomain(referrer);
    
    // Create payload
    const payload = {
      widget_id: widgetId,
      api_key: apiKey,
      visitor_id: visitorId,
      interaction_type: interactionType,
      element_id: elementId,
      referrer,
      referrer_domain: referrerDomain
    };
    
    // Send tracking data to the server
    await sendTrackingData('interaction', payload);
    
    // Log success in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Tracked interaction:', payload);
    }
  } catch (error) {
    console.error('Error tracking interaction:', error);
  }
}

/**
 * Send tracking data to the server
 * @param eventType The type of event ('impression' or 'interaction')
 * @param payload The data to send
 */
async function sendTrackingData(eventType: string, payload: Record<string, any>): Promise<void> {
  // Determine the endpoint based on the event type
  const endpoint = eventType === 'impression' 
    ? '/api/track/impression' 
    : '/api/track/interaction';
  
  try {
    // Use fetch API to send the data
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      // Don't send cookies for cross-origin requests
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    // Use a fallback method for cross-origin tracking if fetch fails
    sendFallbackTracking(eventType, payload);
  }
}

/**
 * Fallback method for tracking when fetch fails (e.g., due to CORS)
 * Uses image pixel tracking technique
 * @param eventType The type of event
 * @param payload The data to send
 */
function sendFallbackTracking(eventType: string, payload: Record<string, any>): void {
  try {
    // Create a tracking pixel
    const img = new Image();
    
    // Build query string from payload
    const params = new URLSearchParams();
    params.append('event', eventType);
    
    // Add all payload properties to query string
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    // Set the image source to the tracking endpoint with query parameters
    img.src = `/api/track/pixel?${params.toString()}`;
    
    // Handle errors
    img.onerror = () => {
      console.error('Fallback tracking failed');
    };
  } catch (error) {
    console.error('Error in fallback tracking:', error);
  }
}

/**
 * Get or create a unique visitor ID
 * Uses localStorage if available, otherwise generates a new ID
 */
function getOrCreateVisitorId(): string {
  const storageKey = 'gr_visitor_id';
  
  try {
    // Try to get existing ID from localStorage
    let visitorId = localStorage.getItem(storageKey);
    
    // If no ID exists, create a new one
    if (!visitorId) {
      visitorId = generateUniqueId();
      localStorage.setItem(storageKey, visitorId);
    }
    
    return visitorId;
  } catch (e) {
    // If localStorage is not available (e.g., in private browsing mode)
    // Generate a temporary ID for this session
    return generateUniqueId();
  }
}

/**
 * Generate a unique ID
 */
function generateUniqueId(): string {
  return 'v_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Extract domain from URL
 * @param url The URL to extract domain from
 */
function extractDomain(url: string): string {
  try {
    // Create URL object to parse the URL
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    // If URL parsing fails, return the original URL
    return url;
  }
}

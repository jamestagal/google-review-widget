/**
 * React Component Generator
 * 
 * Generates React component code for the Google Reviews Widget
 */

import { type EmbedOptions } from './html-embed';

/**
 * Generate React component code
 */
export function generateReactEmbed(options: EmbedOptions): string {
  const {
    widgetId,
    apiKey,
    widgetConfig,
    baseUrl,
    trackingEndpoint,
    pixelEndpoint,
    isResponsive = true,
    width = '100%',
    height = '600px'
  } = options;

  const widgetScriptUrl = `${baseUrl}/widget.js`;
  const trackingScriptUrl = `${baseUrl}/tracking.js`;

  return `import React, { useEffect, useRef } from 'react';

/**
 * Google Reviews Widget Component
 */
const GoogleReviewsWidget = () => {
  const widgetContainerId = 'google-reviews-widget-${widgetId}';
  const widgetLoaded = useRef(false);
  
  useEffect(() => {
    // Skip if already loaded
    if (widgetLoaded.current) return;
    
    // Set widget configuration
    window.googleReviewsWidgetConfig = {
      placeId: '${widgetConfig.placeId || ''}',
      apiKey: '${apiKey}',
      theme: '${widgetConfig.theme || 'light'}',
      displayMode: '${widgetConfig.displayMode || 'carousel'}',
      maxReviews: ${widgetConfig.maxReviews || 5},
      minRating: ${widgetConfig.minRating || 0},
      showRatings: ${widgetConfig.showRatings !== false},
      showPhotos: ${widgetConfig.showPhotos !== false},
      autoplaySpeed: ${widgetConfig.autoplaySpeed || 5000}
    };
    
    // Set tracking configuration
    window.googleReviewsWidgetTracking = {
      widgetId: '${widgetId}',
      apiKey: '${apiKey}',
      trackingEndpoint: '${trackingEndpoint}',
      pixelEndpoint: '${pixelEndpoint}'
    };
    
    // Load widget script
    const widgetScript = document.createElement('script');
    widgetScript.src = '${widgetScriptUrl}';
    widgetScript.async = true;
    document.body.appendChild(widgetScript);
    
    // Load tracking script
    const trackingScript = document.createElement('script');
    trackingScript.src = '${trackingScriptUrl}';
    trackingScript.async = true;
    document.body.appendChild(trackingScript);
    
    widgetLoaded.current = true;
    
    // Cleanup function
    return () => {
      document.body.removeChild(widgetScript);
      document.body.removeChild(trackingScript);
    };
  }, []); // Empty dependency array ensures this runs once on mount
  
  return <div id={widgetContainerId} style={{ ${isResponsive ? 
    "width: '100%', maxWidth: '100%', height: 'auto', minHeight: '400px'" : 
    `width: '${width}', height: '${height}'`} }}></div>;
};

export default GoogleReviewsWidget;`;
}

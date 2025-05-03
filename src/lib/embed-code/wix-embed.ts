/**
 * Wix Embed Code Generator
 * 
 * Generates Wix-specific embed code for the Google Reviews Widget
 */

import { type EmbedOptions } from './html-embed';

/**
 * Generate Wix embed code
 */
export function generateWixEmbed(options: EmbedOptions): string {
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
  
  // Set the style attribute based on responsive setting
  const styleAttr = isResponsive 
    ? 'width: 100%; max-width: 100%; height: auto; min-height: 400px;' 
    : `width: ${width}; height: ${height};`;

  return `<!-- Add this HTML code to your Wix site using the HTML Code element -->
<div>
  <script src="${widgetScriptUrl}"></script>
  <div id="google-reviews-widget-${widgetId}" style="${styleAttr}"></div>
  <script>
    window.googleReviewsWidgetConfig = {
      placeId: "${widgetConfig.placeId || ''}",
      apiKey: "${apiKey}",
      theme: "${widgetConfig.theme || 'light'}",
      displayMode: "${widgetConfig.displayMode || 'carousel'}",
      maxReviews: ${widgetConfig.maxReviews || 5},
      minRating: ${widgetConfig.minRating || 0},
      showRatings: ${widgetConfig.showRatings !== false},
      showPhotos: ${widgetConfig.showPhotos !== false},
      autoplaySpeed: ${widgetConfig.autoplaySpeed || 5000}
    };
  </script>
  
  <script>
    window.googleReviewsWidgetTracking = {
      widgetId: "${widgetId}",
      apiKey: "${apiKey}",
      trackingEndpoint: "${trackingEndpoint}",
      pixelEndpoint: "${pixelEndpoint}"
    };
  </script>
  <script src="${trackingScriptUrl}"></script>
</div>`;
}

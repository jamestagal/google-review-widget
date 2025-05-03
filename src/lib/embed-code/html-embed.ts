/**
 * HTML Embed Code Generator
 * 
 * Generates HTML embed code for the Google Reviews Widget
 */

export interface WidgetConfig {
  placeId?: string;
  theme?: string;
  displayMode?: string;
  maxReviews?: number;
  minRating?: number;
  showRatings?: boolean;
  showPhotos?: boolean;
  autoplaySpeed?: number;
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
}

export interface EmbedOptions {
  widgetId: string;
  apiKey: string;
  widgetConfig: WidgetConfig;
  baseUrl: string;
  trackingEndpoint: string;
  pixelEndpoint: string;
  isResponsive?: boolean;
  width?: string;
  height?: string;
}

/**
 * Generate HTML embed code
 */
export function generateHtmlEmbed(options: EmbedOptions): string {
  const {
    widgetId,
    apiKey,
    widgetConfig,
    baseUrl,
    trackingEndpoint,
    pixelEndpoint,
    isResponsive = false,
    width = '100%',
    height = '500px'
  } = options;

  const widgetScriptUrl = `${baseUrl}/widget.js`;
  const trackingScriptUrl = `${baseUrl}/tracking.js`;

  // Create config object as a string with proper fallbacks for all values
  const configObject = `{
    placeId: "${widgetConfig.placeId || ''}",
    apiKey: "${apiKey}",
    theme: "${widgetConfig.theme || 'light'}",
    displayMode: "${widgetConfig.displayMode || 'carousel'}",
    maxReviews: ${widgetConfig.maxReviews || 5},
    minRating: ${widgetConfig.minRating || 0},
    showRatings: ${widgetConfig.showRatings !== false},
    showPhotos: ${widgetConfig.showPhotos !== false},
    autoplaySpeed: ${widgetConfig.autoplaySpeed || 5000}
  }`;

  // Create tracking config object as a string
  const trackingObject = `{
    widgetId: "${widgetId}",
    apiKey: "${apiKey}",
    trackingEndpoint: "${trackingEndpoint}",
    pixelEndpoint: "${pixelEndpoint}"
  }`;

  // Build the HTML embed code
  return `<!-- Google Reviews Widget -->
<div id="google-reviews-widget-${widgetId}" style="width: ${width}; height: ${height}; ${isResponsive ? 'max-width: 100%;' : ''}"></div>

<!-- Widget Configuration -->
<script>
  window.googleReviewsWidgetConfig = ${configObject};
</script>

<!-- Widget Script -->
<script src="${widgetScriptUrl}"></script>

<!-- Analytics Tracking Script -->
<script>
  window.googleReviewsWidgetTracking = ${trackingObject};
</script>
<script src="${trackingScriptUrl}"></script>`;
}

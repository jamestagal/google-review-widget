/**
 * Vue Component Generator
 * 
 * Generates Vue component code for the Google Reviews Widget
 */

import { type EmbedOptions } from './html-embed';

/**
 * Generate Vue component code
 */
export function generateVueEmbed(options: EmbedOptions): string {
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

  return `<template>
  <div :id="widgetContainerId" :style="containerStyle"></div>
</template>

<script>
export default {
  name: 'GoogleReviewsWidget',
  data() {
    return {
      widgetContainerId: 'google-reviews-widget-${widgetId}',
      widgetLoaded: false,
      isResponsive: ${isResponsive},
      width: '${width}',
      height: '${height}'
    };
  },
  computed: {
    containerStyle() {
      return this.isResponsive
        ? { width: '100%', maxWidth: '100%', height: 'auto', minHeight: '400px' }
        : { width: this.width, height: this.height };
    }
  },
  mounted() {
    // Skip if already loaded
    if (this.widgetLoaded) return;
    
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
    
    this.widgetLoaded = true;
  },
  beforeDestroy() {
    // Cleanup scripts
    const widgetScript = document.querySelector(\`script[src="${widgetScriptUrl}"]\`);
    const trackingScript = document.querySelector(\`script[src="${trackingScriptUrl}"]\`);
    
    if (widgetScript) document.body.removeChild(widgetScript);
    if (trackingScript) document.body.removeChild(trackingScript);
  }
};
</script>`;
}

/**
 * WordPress Shortcode Generator
 * 
 * Generates WordPress shortcode and PHP code for the Google Reviews Widget
 */

import { type EmbedOptions } from './html-embed';

/**
 * Generate WordPress shortcode and PHP code
 */
export function generateWordPressEmbed(options: EmbedOptions): string {
  const {
    widgetId,
    apiKey,
    widgetConfig,
    baseUrl,
    trackingEndpoint,
    pixelEndpoint
  } = options;

  const widgetScriptUrl = `${baseUrl}/widget.js`;
  const trackingScriptUrl = `${baseUrl}/tracking.js`;

  return `<?php
/**
 * Google Reviews Widget Shortcode
 * 
 * Add this code to your theme's functions.php file or in a custom plugin
 */
function google_reviews_widget_shortcode($atts) {
  // Default attributes
  $attributes = shortcode_atts(array(
    'widget_id' => '${widgetId}',
    'api_key' => '${apiKey}',
    'place_id' => '${widgetConfig.placeId || ''}',
    'theme' => '${widgetConfig.theme || 'light'}',
    'display_mode' => '${widgetConfig.displayMode || 'carousel'}',
    'max_reviews' => ${widgetConfig.maxReviews || 5},
    'min_rating' => ${widgetConfig.minRating || 0},
    'show_ratings' => ${widgetConfig.showRatings !== false ? 'true' : 'false'},
    'show_photos' => ${widgetConfig.showPhotos !== false ? 'true' : 'false'},
    'autoplay_speed' => ${widgetConfig.autoplaySpeed || 5000}
  ), $atts);
  
  // Extract attributes
  $widget_id = esc_attr($attributes['widget_id']);
  $api_key = esc_attr($attributes['api_key']);
  $place_id = esc_attr($attributes['place_id']);
  $theme = esc_attr($attributes['theme']);
  $display_mode = esc_attr($attributes['display_mode']);
  $max_reviews = intval($attributes['max_reviews']);
  $min_rating = intval($attributes['min_rating']);
  $show_ratings = $attributes['show_ratings'] === 'true' ? 'true' : 'false';
  $show_photos = $attributes['show_photos'] === 'true' ? 'true' : 'false';
  $autoplay_speed = intval($attributes['autoplay_speed']);
  
  // Widget configuration
  $widget_config = json_encode(array(
    'placeId' => $place_id,
    'apiKey' => $api_key,
    'theme' => $theme,
    'displayMode' => $display_mode,
    'maxReviews' => $max_reviews,
    'minRating' => $min_rating,
    'showRatings' => $show_ratings === 'true',
    'showPhotos' => $show_photos === 'true',
    'autoplaySpeed' => $autoplay_speed
  ));
  
  // Tracking configuration
  $tracking_config = json_encode(array(
    'widgetId' => $widget_id,
    'apiKey' => $api_key,
    'trackingEndpoint' => '${trackingEndpoint}',
    'pixelEndpoint' => '${pixelEndpoint}'
  ));
  
  // Generate the HTML output
  $output = '';
  $output .= '<!-- Google Reviews Widget -->';
  $output .= '<div id="google-reviews-widget-' . $widget_id . '"></div>';
  
  $output .= '<script>';
  $output .= 'window.googleReviewsWidgetConfig = ' . $widget_config . ';';
  $output .= '</script>';
  
  $output .= '<script src="${widgetScriptUrl}"></script>';
  
  $output .= '<script>';
  $output .= 'window.googleReviewsWidgetTracking = ' . $tracking_config . ';';
  $output .= '</script>';
  
  $output .= '<script src="${trackingScriptUrl}"></script>';
  
  return $output;
}
add_shortcode('google_reviews_widget', 'google_reviews_widget_shortcode');
?>

<!-- Usage Example -->
[google_reviews_widget]`;
}

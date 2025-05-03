/**
 * Google Reviews Widget Analytics Tracking Script
 * 
 * This script automatically tracks widget impressions and interactions.
 * It should be included in the widget embed code.
 */

(function() {
  // Configuration
  const config = {
    // Will be replaced with actual values when generating embed code
    widgetId: '{{widget_id}}',
    apiKey: '{{api_key}}',
    trackingEndpoint: '{{tracking_endpoint}}',
    pixelEndpoint: '{{pixel_endpoint}}'
  };

  // Generate a unique visitor ID or retrieve from storage
  function getVisitorId() {
    const storageKey = `grw_visitor_${config.widgetId}`;
    let visitorId = localStorage.getItem(storageKey);
    
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
      localStorage.setItem(storageKey, visitorId);
    }
    
    return visitorId;
  }

  // Get referrer information
  function getReferrerInfo() {
    const referrer = document.referrer || '';
    let referrerDomain = '';
    
    if (referrer) {
      try {
        referrerDomain = new URL(referrer).hostname;
      } catch (e) {
        console.error('Error parsing referrer:', e);
      }
    }
    
    return { referrer, referrerDomain };
  }

  // Track impression via fetch API
  function trackImpression() {
    const visitorId = getVisitorId();
    const { referrer, referrerDomain } = getReferrerInfo();
    const userAgent = navigator.userAgent;
    const screenSize = `${window.innerWidth}x${window.innerHeight}`;
    
    // Try to use fetch API first
    if (window.fetch) {
      fetch(`${config.trackingEndpoint}/impression`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          widget_id: config.widgetId,
          api_key: config.apiKey,
          visitor_id: visitorId,
          referrer,
          referrer_domain: referrerDomain,
          user_agent: userAgent,
          screen_size: screenSize
        }),
        // Use no-cors mode to avoid CORS issues
        mode: 'no-cors'
      }).catch(err => {
        console.error('Error tracking impression, falling back to pixel:', err);
        trackImpressionViaPixel();
      });
    } else {
      // Fallback to pixel tracking if fetch is not available
      trackImpressionViaPixel();
    }
  }

  // Track impression via pixel image (fallback method)
  function trackImpressionViaPixel() {
    const visitorId = getVisitorId();
    const { referrer, referrerDomain } = getReferrerInfo();
    const userAgent = navigator.userAgent;
    const screenSize = `${window.innerWidth}x${window.innerHeight}`;
    
    const pixelUrl = `${config.pixelEndpoint}?` + new URLSearchParams({
      event: 'impression',
      widget_id: config.widgetId,
      api_key: config.apiKey,
      visitor_id: visitorId,
      referrer: referrer.substring(0, 255), // Limit length
      referrer_domain: referrerDomain,
      user_agent: userAgent.substring(0, 255), // Limit length
      screen_size: screenSize,
      cache_bust: Date.now() // Prevent caching
    }).toString();
    
    const img = new Image();
    img.src = pixelUrl;
    img.style.display = 'none';
    document.body.appendChild(img);
  }

  // Track interaction via fetch API
  function trackInteraction(interactionType, elementId) {
    const visitorId = getVisitorId();
    const { referrer, referrerDomain } = getReferrerInfo();
    
    // Try to use fetch API first
    if (window.fetch) {
      fetch(`${config.trackingEndpoint}/interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          widget_id: config.widgetId,
          api_key: config.apiKey,
          visitor_id: visitorId,
          interaction_type: interactionType,
          element_id: elementId,
          referrer,
          referrer_domain: referrerDomain
        }),
        // Use no-cors mode to avoid CORS issues
        mode: 'no-cors'
      }).catch(err => {
        console.error('Error tracking interaction, falling back to pixel:', err);
        trackInteractionViaPixel(interactionType, elementId);
      });
    } else {
      // Fallback to pixel tracking if fetch is not available
      trackInteractionViaPixel(interactionType, elementId);
    }
  }

  // Track interaction via pixel image (fallback method)
  function trackInteractionViaPixel(interactionType, elementId) {
    const visitorId = getVisitorId();
    const { referrer, referrerDomain } = getReferrerInfo();
    
    const pixelUrl = `${config.pixelEndpoint}?` + new URLSearchParams({
      event: 'interaction',
      widget_id: config.widgetId,
      api_key: config.apiKey,
      visitor_id: visitorId,
      interaction_type: interactionType,
      element_id: elementId,
      referrer: referrer.substring(0, 255), // Limit length
      referrer_domain: referrerDomain,
      cache_bust: Date.now() // Prevent caching
    }).toString();
    
    const img = new Image();
    img.src = pixelUrl;
    img.style.display = 'none';
    document.body.appendChild(img);
  }

  // Setup click tracking on the widget
  function setupClickTracking() {
    // Find the widget container
    const widgetContainer = document.querySelector('.google-reviews-widget');
    if (!widgetContainer) return;
    
    // Track clicks on review cards
    widgetContainer.addEventListener('click', function(e) {
      // Find closest review card
      const reviewCard = e.target.closest('.review-card');
      if (reviewCard) {
        trackInteraction('review-click', reviewCard.dataset.reviewId || 'unknown');
        return;
      }
      
      // Track clicks on carousel navigation
      if (e.target.closest('.carousel-control.prev')) {
        trackInteraction('navigation', 'prev-button');
        return;
      }
      
      if (e.target.closest('.carousel-control.next')) {
        trackInteraction('navigation', 'next-button');
        return;
      }
      
      // Track clicks on "View all reviews" link
      if (e.target.closest('.widget-footer a')) {
        trackInteraction('view-all-click');
        return;
      }
    });
  }

  // Initialize tracking
  function init() {
    // Wait for the DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDOMReady);
    } else {
      onDOMReady();
    }
    
    function onDOMReady() {
      // Track impression
      trackImpression();
      
      // Setup click tracking
      setupClickTracking();
    }
  }

  // Start tracking
  init();
})();

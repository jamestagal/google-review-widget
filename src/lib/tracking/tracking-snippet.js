/**
 * Google Reviews Widget Analytics Tracking Snippet
 * 
 * This snippet can be added to any widget embed to enable analytics tracking.
 * Copy and paste this code before the closing </body> tag.
 */

(function() {
  // Configuration - replace with your widget ID and API key
  const config = {
    widgetId: "YOUR_WIDGET_ID",
    apiKey: "YOUR_API_KEY",
    trackingEndpoint: "https://your-widget-domain.com/api/track",
    pixelEndpoint: "https://your-widget-domain.com/api/track/pixel"
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
    if (typeof window.fetch === 'function') {
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
    
    const params = {
      event: 'impression',
      widget_id: config.widgetId,
      api_key: config.apiKey,
      visitor_id: visitorId,
      referrer: referrer.substring(0, 255), // Limit length
      referrer_domain: referrerDomain,
      user_agent: userAgent.substring(0, 255), // Limit length
      screen_size: screenSize,
      cache_bust: String(Date.now()) // Prevent caching, convert to string
    };
    
    const pixelUrl = `${config.pixelEndpoint}?` + new URLSearchParams(params).toString();
    
    const img = new Image();
    img.src = pixelUrl;
    img.style.display = 'none';
    document.body.appendChild(img);
  }

  /**
   * Track interaction via fetch API
   * 
   * @param {string} interactionType - Type of interaction (e.g. 'review-click', 'navigation', etc.)
   * @param {string} elementId - ID of the element that triggered the interaction
   */
  function trackInteraction(interactionType, elementId) {
    const visitorId = getVisitorId();
    const { referrer, referrerDomain } = getReferrerInfo();
    
    // Try to use fetch API first
    if (typeof window.fetch === 'function') {
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

  /**
   * Track interaction via pixel image (fallback method)
   * 
   * @param {string} interactionType - Type of interaction (e.g. 'review-click', 'navigation', etc.)
   * @param {string} elementId - ID of the element that triggered the interaction
   */
  function trackInteractionViaPixel(interactionType, elementId) {
    const visitorId = getVisitorId();
    const { referrer, referrerDomain } = getReferrerInfo();
    
    const params = {
      event: 'interaction',
      widget_id: config.widgetId,
      api_key: config.apiKey,
      visitor_id: visitorId,
      interaction_type: String(interactionType),
      element_id: String(elementId || ''),
      referrer: referrer.substring(0, 255), // Limit length
      referrer_domain: referrerDomain,
      cache_bust: String(Date.now()) // Prevent caching, convert to string
    };
    
    const pixelUrl = `${config.pixelEndpoint}?` + new URLSearchParams(params).toString();
    
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
      const target = e.target;
      if (!target) return;
      
      // Find closest review card
      const reviewCard = target instanceof Element ? target.closest('.review-card') : null;
      if (reviewCard) {
        trackInteraction('review-click', reviewCard.getAttribute('data-review-id') || 'unknown');
        return;
      }
      
      // Track clicks on carousel navigation
      const prevButton = target instanceof Element ? target.closest('.carousel-control.prev') : null;
      if (prevButton) {
        trackInteraction('navigation', 'prev-button');
        return;
      }
      
      const nextButton = target instanceof Element ? target.closest('.carousel-control.next') : null;
      if (nextButton) {
        trackInteraction('navigation', 'next-button');
        return;
      }
      
      // Track clicks on "View all reviews" link
      const viewAllLink = target instanceof Element ? target.closest('.widget-footer a') : null;
      if (viewAllLink) {
        trackInteraction('view-all-click');
        return;
      }
    });
  }

  // Setup tracking
  function setupTracking() {
    // Track impression when the widget loads
    trackImpression();
    
    // Setup click tracking
    setupClickTracking();
  }

  // Initialize when the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setupTracking());
  } else {
    setupTracking();
  }
})();

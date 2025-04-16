// /api/reviews/widget.ts (Cloudflare Worker or SvelteKit endpoint)
export async function onRequest(context) {
    const { request, env } = context;
    
    // Get API key from query parameter
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('apiKey');
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API key' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      // Look up the API key to get widget configuration
      const { data: widgetApiKey, error: keyError } = await env.SUPABASE.from('widget_api_keys')
        .select('*')
        .eq('api_key', apiKey)
        .single();
      
      if (keyError || !widgetApiKey) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Check if the domain is authorized
      const referer = request.headers.get('Referer');
      if (referer) {
        const refererDomain = new URL(referer).hostname;
        const allowedDomains = widgetApiKey.allowed_domains || ['*'];
        
        if (!allowedDomains.includes('*') && !allowedDomains.includes(refererDomain)) {
          return new Response(JSON.stringify({ error: 'Unauthorized domain' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Get the associated widget project to retrieve place ID
      const { data: widgetProject, error: projectError } = await env.SUPABASE.from('widget_projects')
        .select('*, business_profiles(*)')
        .eq('api_key', apiKey)
        .single();
      
      if (projectError || !widgetProject) {
        return new Response(JSON.stringify({ error: 'Widget configuration not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const placeId = widgetProject.business_profiles.google_place_id;
      
      // Get place details and reviews
      const placeDetails = await getPlaceDetails(placeId, env.PRIVATE_GOOGLE_PLACES_API_KEY);
      
      // Return the combined data needed for the widget
      return new Response(JSON.stringify({
        reviews: placeDetails.reviews || [],
        placeData: {
          name: placeDetails.name,
          rating: placeDetails.rating,
          user_ratings_total: placeDetails.user_ratings_total,
          url: `https://search.google.com/local/reviews?placeid=${placeId}`,
        },
        config: {
          displayMode: widgetProject.display_type,
          theme: widgetProject.theme,
          filters: widgetProject.filters
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  async function getPlaceDetails(placeId, apiKey) {
    // Implement the same place details fetching logic you've already created
    // with caching and proper error handling
  }
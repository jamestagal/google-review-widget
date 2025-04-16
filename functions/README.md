# Cloudflare Pages Functions for Google Reviews Widget

This directory contains serverless functions that power the Google Reviews Widget API. These functions are deployed as Cloudflare Workers through Cloudflare Pages.

## Structure

- `_middleware.js` - Global middleware that runs before all functions
- `_routes.json` - Controls which routes are handled by functions vs. the static site
- `api/` - API endpoints
  - `reviews.js` - General reviews API endpoint
  - `google-reviews/[placeId].js` - Dynamic route for fetching reviews by Place ID

## KV Usage

The API uses Cloudflare KV for caching Google review data:

- Cache keys follow the format: `reviews:{placeId}`
- TTL varies by subscription tier:
  - Free: 24 hours
  - Basic: 12 hours
  - Pro: 6 hours
  - Premium: 3 hours

## Local Development

To develop locally:

1. Install dependencies: `npm install`
2. Run the development server with KV: `npm run dev:cf`
3. Test the API: Visit `http://localhost:8788/api/reviews` or `http://localhost:8788/api/google-reviews/{placeId}`

## Deployment

Deployment to Cloudflare Pages happens automatically via CI/CD when code is pushed to the main branch.

To deploy manually (requires Cloudflare authentication):

```bash
npm run wrangler:deploy
```

## Environment Variables

The following environment variables must be set in your Cloudflare Pages project:

- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `GOOGLE_PLACES_API_KEY` - Google Places API key (required for production)

## KV Namespace

The KV namespace `REVIEWS_KV` must be created in Cloudflare and bound to the Pages Functions.

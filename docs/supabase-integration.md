# Supabase Integration for Google Reviews Widget

This document outlines how the Google Reviews Widget connects to Supabase for subscription management and usage tracking.

## Overview

The Google Reviews Widget uses Supabase as its backend database for:

1. **Subscription Management**: Storing widget API keys and their associated subscription tiers
2. **Usage Tracking**: Recording API requests and analytics
3. **Authentication**: Verifying that widget API keys are valid and active

## Database Schema

The integration uses two main tables:

### `widget_api_keys`

Stores all widget API keys and their subscription information:

```sql
CREATE TABLE IF NOT EXISTS public.widget_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    subscription_tier TEXT NOT NULL DEFAULT 'FREE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    rate_limit INTEGER NOT NULL DEFAULT 10,
    cache_duration INTEGER NOT NULL DEFAULT 86400, -- 24 hours in seconds
    max_reviews INTEGER NOT NULL DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT true,
    allowed_domains TEXT[] DEFAULT '{*}',
    custom_settings JSONB DEFAULT '{}'::jsonb
);
```

### `widget_usage_stats`

Tracks usage statistics for each API key:

```sql
CREATE TABLE IF NOT EXISTS public.widget_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.widget_api_keys(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    requests_count INTEGER NOT NULL DEFAULT 0,
    unique_place_ids INTEGER NOT NULL DEFAULT 0,
    unique_visitors INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Subscription Tiers

The system supports four subscription tiers with different limits:

| Tier      | Cache Duration | Rate Limit (req/min) | Max Reviews |
|-----------|----------------|----------------------|-------------|
| FREE      | 24 hours       | 10                   | 3           |
| BASIC     | 12 hours       | 30                   | 5           |
| PRO       | 6 hours        | 60                   | 7           |
| PREMIUM   | 3 hours        | 100                  | 10          |

## Integration Flow

1. When the Reviews API receives a request, it extracts the widget API key from:
   - `X-Widget-API-Key` header 
   - `api_key` query parameter

2. The API then calls `determineSubscriptionTier()` which:
   - First checks for cached tier data in KV (to reduce database calls)
   - If not in cache, queries Supabase for the API key's subscription data
   - Falls back to pattern-based tier detection if Supabase is unavailable
   - Caches the result for 5 minutes

3. For each successful request, the API updates usage statistics in Supabase:
   - Increments the request count for the current day
   - Creates a new record if one doesn't exist for today

## Security Features

The integration includes several security features:

1. **Domain Restrictions**: API keys can be restricted to specific domains
2. **Rate Limiting**: Prevents abuse by limiting requests per minute based on tier
3. **Key Activation Status**: Keys can be deactivated without deleting them

## Implementation in Cloudflare Workers

The Supabase integration uses a lightweight client for Cloudflare Workers, which:

1. Makes REST API calls instead of relying on the full Supabase JS client
2. Uses environment variables to securely store credentials
3. Implements caching to reduce database load

## Required Environment Variables

Add these to your Cloudflare Worker:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Fallback Mechanisms

If Supabase is unavailable, the system falls back to:

1. Using cached subscription data in KV if available
2. Pattern-based tier detection (e.g., `grw_premium_` prefix indicates PREMIUM tier)
3. Default FREE tier settings if all else fails

This ensures the API remains operational even during database outages.

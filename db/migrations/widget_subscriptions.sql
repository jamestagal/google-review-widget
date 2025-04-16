-- Widget Subscriptions Schema
-- This schema defines the tables needed for the Google Reviews Widget subscription system

-- Widget API Keys table
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

-- Create an index for faster API key lookups
CREATE INDEX IF NOT EXISTS idx_widget_api_keys_api_key ON public.widget_api_keys(api_key);

-- Widget usage statistics table
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

-- Create a composite index for faster lookups by API key and date
CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_usage_stats_key_date 
ON public.widget_usage_stats(api_key_id, date);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
DROP TRIGGER IF EXISTS set_widget_api_keys_updated_at ON public.widget_api_keys;
CREATE TRIGGER set_widget_api_keys_updated_at
BEFORE UPDATE ON public.widget_api_keys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_widget_usage_stats_updated_at ON public.widget_usage_stats;
CREATE TRIGGER set_widget_usage_stats_updated_at
BEFORE UPDATE ON public.widget_usage_stats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add some example subscription tiers for testing
INSERT INTO public.widget_api_keys (api_key, subscription_tier, rate_limit, cache_duration, max_reviews)
VALUES 
    ('grw_free_test', 'FREE', 10, 86400, 3),
    ('grw_basic_test', 'BASIC', 30, 43200, 5),
    ('grw_pro_test', 'PRO', 60, 21600, 7),
    ('grw_premium_test', 'PREMIUM', 100, 10800, 10)
ON CONFLICT (api_key) DO NOTHING;

-- Add RLS policies for security
ALTER TABLE public.widget_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_usage_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for widget_api_keys
CREATE POLICY "Users can view their own API keys" 
    ON public.widget_api_keys FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" 
    ON public.widget_api_keys FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
    ON public.widget_api_keys FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create policies for widget_usage_stats
CREATE POLICY "Users can view usage stats for their API keys" 
    ON public.widget_usage_stats FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.widget_api_keys 
        WHERE id = widget_usage_stats.api_key_id AND user_id = auth.uid()
    ));

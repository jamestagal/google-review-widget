-- Migration to add widget_api_keys table and subscription_tier to widget_projects
-- Created on 2025-04-03

-- Create widget_api_keys table
CREATE TABLE IF NOT EXISTS public.widget_api_keys (
  api_key TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'BASIC', 'PRO', 'PREMIUM')),
  rate_limit INTEGER NOT NULL DEFAULT 10,
  cache_duration INTEGER NOT NULL DEFAULT 86400,
  max_reviews INTEGER NOT NULL DEFAULT 3,
  allowed_domains TEXT[] NOT NULL DEFAULT ARRAY['*']::TEXT[],
  custom_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for widget_api_keys
CREATE INDEX IF NOT EXISTS widget_api_keys_user_id_idx ON widget_api_keys(user_id);

-- Enable RLS on widget_api_keys
ALTER TABLE public.widget_api_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for widget_api_keys
CREATE POLICY "Users can view their own API keys" 
  ON public.widget_api_keys FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" 
  ON public.widget_api_keys FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
  ON public.widget_api_keys FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
  ON public.widget_api_keys FOR DELETE 
  USING (auth.uid() = user_id);

-- Add subscription_tier to widget_projects table
ALTER TABLE public.widget_projects 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'FREE' 
CHECK (subscription_tier IN ('FREE', 'BASIC', 'PRO', 'PREMIUM'));

-- Create trigger function for setting updated_at if it doesn't exist
DO $do$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    CREATE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $do$;

-- Create trigger for widget_api_keys updated_at
CREATE TRIGGER handle_updated_at_widget_api_keys
BEFORE UPDATE ON public.widget_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
-- Migration to add analytics tracking to widget_projects table
-- This migration adds JSON fields for analytics tracking and enhances the widget_projects table

-- Add analytics JSON field to widget_projects table
ALTER TABLE public.widget_projects 
ADD COLUMN IF NOT EXISTS analytics JSONB NOT NULL DEFAULT '{"impressions": 0, "clicks": 0, "last_updated": null}';

-- Add API usage tracking fields
ALTER TABLE public.widget_projects 
ADD COLUMN IF NOT EXISTS api_usage INTEGER NOT NULL DEFAULT 0;

-- Create function to increment API usage
CREATE OR REPLACE FUNCTION public.increment_api_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment the api_usage counter
  UPDATE public.widget_projects
  SET api_usage = api_usage + 1
  WHERE id = NEW.widget_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a table to track API calls
CREATE TABLE IF NOT EXISTS public.api_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID NOT NULL REFERENCES public.widget_projects(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  domain TEXT,
  endpoint TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger for created_at and updated_at
CREATE TRIGGER handle_api_calls_timestamps
BEFORE INSERT OR UPDATE ON public.api_calls
FOR EACH ROW EXECUTE FUNCTION public.handle_timestamps();

-- Add trigger to increment api_usage when a new API call is recorded
CREATE TRIGGER increment_widget_api_usage
AFTER INSERT ON public.api_calls
FOR EACH ROW EXECUTE FUNCTION public.increment_api_usage();

-- Enable Row Level Security on api_calls
ALTER TABLE public.api_calls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_calls
CREATE POLICY "Users can view their own API calls" ON public.api_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.widget_projects
      WHERE widget_projects.id = api_calls.widget_id
      AND widget_projects.user_id = auth.uid()
    )
  );

-- Create function to track widget impressions
CREATE OR REPLACE FUNCTION public.track_widget_impression(
  widget_id UUID,
  domain TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  current_analytics JSONB;
BEGIN
  -- Get current analytics
  SELECT analytics INTO current_analytics
  FROM public.widget_projects
  WHERE id = widget_id;
  
  -- Update analytics
  UPDATE public.widget_projects
  SET 
    analytics = jsonb_set(
      jsonb_set(
        analytics, 
        '{impressions}', 
        to_jsonb(COALESCE((analytics->>'impressions')::integer, 0) + 1)
      ),
      '{last_updated}',
      to_jsonb(NOW())
    )
  WHERE id = widget_id
  RETURNING analytics INTO result;
  
  -- Insert record in api_calls
  INSERT INTO public.api_calls (
    widget_id, 
    endpoint, 
    domain
  ) VALUES (
    widget_id,
    'impression',
    domain
  );
  
  RETURN result;
END;
$$;

-- Create function to track widget clicks
CREATE OR REPLACE FUNCTION public.track_widget_click(
  widget_id UUID,
  domain TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  current_analytics JSONB;
BEGIN
  -- Get current analytics
  SELECT analytics INTO current_analytics
  FROM public.widget_projects
  WHERE id = widget_id;
  
  -- Update analytics
  UPDATE public.widget_projects
  SET 
    analytics = jsonb_set(
      jsonb_set(
        analytics, 
        '{clicks}', 
        to_jsonb(COALESCE((analytics->>'clicks')::integer, 0) + 1)
      ),
      '{last_updated}',
      to_jsonb(NOW())
    )
  WHERE id = widget_id
  RETURNING analytics INTO result;
  
  -- Insert record in api_calls
  INSERT INTO public.api_calls (
    widget_id, 
    endpoint, 
    domain
  ) VALUES (
    widget_id,
    'click',
    domain
  );
  
  RETURN result;
END;
$$;

-- Add rate_limit column with default based on subscription tier
ALTER TABLE public.widget_projects
ADD COLUMN IF NOT EXISTS rate_limit INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN subscription_tier = 'FREE' THEN 10000
    WHEN subscription_tier = 'PRO' THEN 50000
    WHEN subscription_tier = 'BUSINESS' THEN 200000
    WHEN subscription_tier = 'ENTERPRISE' THEN 1000000
    ELSE 10000
  END
) STORED;

-- Update the database types
COMMENT ON TABLE public.widget_projects IS 'Stores widget configuration and analytics data';
COMMENT ON TABLE public.api_calls IS 'Tracks API usage for widgets';

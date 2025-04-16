-- Migration to create the widget_usage_stats table for analytics tracking
-- Following all Supabase integration rules for schema, RLS, and timestamps

-- Create widget_usage_stats table
CREATE TABLE IF NOT EXISTS public.widget_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID REFERENCES public.widget_projects(id) ON DELETE CASCADE,
  api_key TEXT REFERENCES public.widget_api_keys(api_key) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date_hour TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', NOW()),
  views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  interactions INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  avg_load_time NUMERIC(10,2),
  domains JSONB DEFAULT '[]'::jsonb,
  referrers JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(widget_id, date_hour)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS widget_usage_stats_widget_id_idx ON public.widget_usage_stats(widget_id);
CREATE INDEX IF NOT EXISTS widget_usage_stats_api_key_idx ON public.widget_usage_stats(api_key);
CREATE INDEX IF NOT EXISTS widget_usage_stats_user_id_idx ON public.widget_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS widget_usage_stats_date_hour_idx ON public.widget_usage_stats(date_hour);

-- Create trigger for created_at
CREATE TRIGGER set_widget_usage_stats_created_at
  BEFORE INSERT ON public.widget_usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_at();

-- Create trigger for updated_at
CREATE TRIGGER set_widget_usage_stats_updated_at
  BEFORE UPDATE ON public.widget_usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.widget_usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow users to view only their own widget usage stats
CREATE POLICY "Users can view their own widget usage stats" 
  ON public.widget_usage_stats 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own widget usage stats
CREATE POLICY "Users can insert their own widget usage stats" 
  ON public.widget_usage_stats 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own widget usage stats
CREATE POLICY "Users can update their own widget usage stats" 
  ON public.widget_usage_stats 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own widget usage stats
CREATE POLICY "Users can delete their own widget usage stats" 
  ON public.widget_usage_stats 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Helper function to increment widget usage stats
CREATE OR REPLACE FUNCTION public.increment_widget_usage(
  p_widget_id UUID,
  p_api_key TEXT,
  p_view_count INTEGER DEFAULT 1,
  p_visitor_count INTEGER DEFAULT 0,
  p_interaction_count INTEGER DEFAULT 0,
  p_error_count INTEGER DEFAULT 0,
  p_load_time NUMERIC DEFAULT NULL,
  p_domain TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_date_hour TIMESTAMPTZ := date_trunc('hour', NOW());
  v_user_id UUID;
  v_found INTEGER;
  v_domains JSONB;
  v_referrers JSONB;
BEGIN
  -- Get user_id from widget_projects
  SELECT user_id INTO v_user_id FROM public.widget_projects WHERE id = p_widget_id;
  
  -- Check if record exists for this widget and hour
  SELECT COUNT(*) INTO v_found FROM public.widget_usage_stats 
    WHERE widget_id = p_widget_id AND date_hour = v_date_hour;
  
  IF v_found > 0 THEN
    -- Update existing record
    UPDATE public.widget_usage_stats
    SET 
      views = views + p_view_count,
      unique_visitors = unique_visitors + p_visitor_count,
      interactions = interactions + p_interaction_count,
      error_count = error_count + p_error_count,
      avg_load_time = CASE 
          WHEN p_load_time IS NOT NULL THEN ((avg_load_time * views) + p_load_time) / (views + 1)
          ELSE avg_load_time
        END,
      domains = CASE 
          WHEN p_domain IS NOT NULL THEN 
            jsonb_set(domains, 
              CASE 
                WHEN domains ? p_domain THEN ARRAY[p_domain]
                ELSE ARRAY[domains::text || '1']
              END, 
              CASE 
                WHEN domains ? p_domain THEN (domains->>p_domain)::integer + 1
                ELSE '1'  
              END)
          ELSE domains
        END,
      referrers = CASE 
          WHEN p_referrer IS NOT NULL THEN 
            jsonb_set(referrers, 
              CASE 
                WHEN referrers ? p_referrer THEN ARRAY[p_referrer]
                ELSE ARRAY[referrers::text || '1']
              END, 
              CASE 
                WHEN referrers ? p_referrer THEN (referrers->>p_referrer)::integer + 1
                ELSE '1'  
              END)
          ELSE referrers
        END,
      metadata = CASE 
          WHEN p_metadata IS NOT NULL THEN metadata || p_metadata
          ELSE metadata
        END
    WHERE widget_id = p_widget_id AND date_hour = v_date_hour;
  ELSE
    -- Create new record
    v_domains := CASE WHEN p_domain IS NOT NULL THEN jsonb_build_object(p_domain, 1) ELSE '[]'::jsonb END;
    v_referrers := CASE WHEN p_referrer IS NOT NULL THEN jsonb_build_object(p_referrer, 1) ELSE '[]'::jsonb END;
    
    INSERT INTO public.widget_usage_stats (
      widget_id, api_key, user_id, date_hour, views, unique_visitors, 
      interactions, error_count, avg_load_time, domains, referrers, metadata
    ) VALUES (
      p_widget_id, p_api_key, v_user_id, v_date_hour, p_view_count, p_visitor_count, 
      p_interaction_count, p_error_count, p_load_time, v_domains, v_referrers, 
      COALESCE(p_metadata, '{}'::jsonb)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the widget_api_keys table to add usage_limit field if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'widget_api_keys'
                AND column_name = 'usage_limit') THEN
    ALTER TABLE public.widget_api_keys ADD COLUMN usage_limit INTEGER NOT NULL DEFAULT 1000;
  END IF;
END $$;

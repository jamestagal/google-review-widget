-- Migration to fix widget related trigger functions
-- Created on 2025-04-03

-- First, inspect the current handle_widget_api_key function if it exists
DO $do$
BEGIN
  -- Check if the handle_widget_api_key function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_widget_api_key') THEN
    RAISE NOTICE 'Dropping existing handle_widget_api_key function';
    DROP FUNCTION IF EXISTS public.handle_widget_api_key();
  END IF;
  
  -- Check if there's a trigger on widget_api_keys
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_widget_api_key_trigger') THEN
    RAISE NOTICE 'Dropping existing handle_widget_api_key_trigger';
    DROP TRIGGER IF EXISTS handle_widget_api_key_trigger ON public.widget_api_keys;
  END IF;
END $do$;

-- Create improved handle_widget_api_key function
CREATE OR REPLACE FUNCTION public.handle_widget_api_key()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default values if not provided
  IF NEW.subscription_tier IS NULL THEN
    NEW.subscription_tier := 'FREE';
  END IF;
  
  -- Set appropriate values based on tier
  IF NEW.rate_limit IS NULL THEN
    CASE NEW.subscription_tier
      WHEN 'PREMIUM' THEN NEW.rate_limit := 100;
      WHEN 'PRO' THEN NEW.rate_limit := 60;
      WHEN 'BASIC' THEN NEW.rate_limit := 30;
      ELSE NEW.rate_limit := 10;
    END CASE;
  END IF;
  
  IF NEW.cache_duration IS NULL THEN
    CASE NEW.subscription_tier
      WHEN 'PREMIUM' THEN NEW.cache_duration := 10800;
      WHEN 'PRO' THEN NEW.cache_duration := 21600;
      WHEN 'BASIC' THEN NEW.cache_duration := 43200;
      ELSE NEW.cache_duration := 86400;
    END CASE;
  END IF;
  
  IF NEW.max_reviews IS NULL THEN
    CASE NEW.subscription_tier
      WHEN 'PREMIUM' THEN NEW.max_reviews := 10;
      WHEN 'PRO' THEN NEW.max_reviews := 7;
      WHEN 'BASIC' THEN NEW.max_reviews := 5;
      ELSE NEW.max_reviews := 3;
    END CASE;
  END IF;
  
  -- Ensure allowed_domains has a default value
  IF NEW.allowed_domains IS NULL THEN
    NEW.allowed_domains := ARRAY['*']::TEXT[];
  END IF;
  
  -- Ensure custom_settings has a default value
  IF NEW.custom_settings IS NULL THEN
    NEW.custom_settings := '{}'::JSONB;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on widget_api_keys table
CREATE TRIGGER handle_widget_api_key_trigger
BEFORE INSERT ON public.widget_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.handle_widget_api_key();

-- Now fix the handle_widget_project function if it exists
DO $do$
BEGIN
  -- Check if the handle_widget_project function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_widget_project') THEN
    RAISE NOTICE 'Dropping existing handle_widget_project function';
    DROP FUNCTION IF EXISTS public.handle_widget_project();
  END IF;
  
  -- Check if there's a trigger on widget_projects
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_widget_project_trigger') THEN
    RAISE NOTICE 'Dropping existing handle_widget_project_trigger';
    DROP TRIGGER IF EXISTS handle_widget_project_trigger ON public.widget_projects;
  END IF;
END $do$;

-- Create improved handle_widget_project function
CREATE OR REPLACE FUNCTION public.handle_widget_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure subscription_tier has a default value
  IF NEW.subscription_tier IS NULL THEN
    NEW.subscription_tier := 'FREE';
  END IF;
  
  -- Ensure api_key has a value (will generate one if missing)
  IF NEW.api_key IS NULL THEN
    NEW.api_key := 'grw_' || substring(gen_random_uuid()::text, 1, 16);
  END IF;
  
  -- Set default values for JSON fields if not provided
  IF NEW.colors IS NULL THEN
    NEW.colors := '{"background":"#ffffff","text":"#000000","stars":"#FFD700","links":"#0070f3","buttons":"#0070f3"}'::JSONB;
  END IF;
  
  IF NEW.fonts IS NULL THEN
    NEW.fonts := '{"family":"inherit","titleSize":"1.25rem","bodySize":"1rem","weight":"normal"}'::JSONB;
  END IF;
  
  IF NEW.filters IS NULL THEN
    NEW.filters := '{"minRating":1,"maxAge":365,"sortBy":"newest"}'::JSONB;
  END IF;
  
  IF NEW.display IS NULL THEN
    NEW.display := '{"showHeader":true,"showRating":true,"showPhotos":true,"reviewLimit":10,"width":"100%","height":"auto"}'::JSONB;
  END IF;
  
  -- Set theme default if not provided
  IF NEW.theme IS NULL THEN
    NEW.theme := 'light';
  END IF;
  
  -- Set display_type default if not provided
  IF NEW.display_type IS NULL THEN
    NEW.display_type := 'carousel';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on widget_projects table
CREATE TRIGGER handle_widget_project_trigger
BEFORE INSERT ON public.widget_projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_widget_project();

-- Add public policy to allow widget_api_keys to be accessed by anonymous users
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'widget_api_keys' 
    AND policyname = 'Allow public access to widget_api_keys'
  ) THEN
    CREATE POLICY "Allow public access to widget_api_keys"
    ON public.widget_api_keys FOR SELECT
    TO anon
    USING (true);
    
    RAISE NOTICE 'Created public access policy for widget_api_keys';
  END IF;
END $do$;

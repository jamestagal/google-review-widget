-- Migration to fix the handle_widget_creation trigger
-- Created on 2025-04-03

-- First, check if the handle_widget_creation function exists
DO $do$
BEGIN
  -- Track whether we need to drop the triggers first
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_widget_creation'
  ) THEN
    RAISE NOTICE 'Found handle_widget_creation function, dropping it';
    
    -- Drop any triggers that use this function first
    DROP TRIGGER IF EXISTS handle_widget_creation_trigger ON widget_projects;
    DROP TRIGGER IF EXISTS handle_widget_creation_trigger ON widget_api_keys;
    
    -- Then drop the function
    DROP FUNCTION IF EXISTS public.handle_widget_creation();
  END IF;
END $do$;

-- Create a new version of the function that doesn't try to access rate_limit on widget_projects
CREATE OR REPLACE FUNCTION public.handle_widget_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- This function serves both widget_projects and widget_api_keys tables
  -- Check which table the trigger is running on using TG_TABLE_NAME
  
  -- For widget_api_keys table
  IF TG_TABLE_NAME = 'widget_api_keys' THEN
    -- Ensure subscription_tier has a default value
    IF NEW.subscription_tier IS NULL THEN
      NEW.subscription_tier := 'FREE';
    END IF;
    
    -- Set rate_limit based on tier
    IF NEW.rate_limit IS NULL THEN
      CASE NEW.subscription_tier
        WHEN 'PREMIUM' THEN NEW.rate_limit := 100;
        WHEN 'PRO' THEN NEW.rate_limit := 60;
        WHEN 'BASIC' THEN NEW.rate_limit := 30;
        ELSE NEW.rate_limit := 10;
      END CASE;
    END IF;
    
    -- Set cache_duration based on tier
    IF NEW.cache_duration IS NULL THEN
      CASE NEW.subscription_tier
        WHEN 'PREMIUM' THEN NEW.cache_duration := 10800;
        WHEN 'PRO' THEN NEW.cache_duration := 21600;
        WHEN 'BASIC' THEN NEW.cache_duration := 43200;
        ELSE NEW.cache_duration := 86400;
      END CASE;
    END IF;
    
    -- Set max_reviews based on tier
    IF NEW.max_reviews IS NULL THEN
      CASE NEW.subscription_tier
        WHEN 'PREMIUM' THEN NEW.max_reviews := 10;
        WHEN 'PRO' THEN NEW.max_reviews := 7;
        WHEN 'BASIC' THEN NEW.max_reviews := 5;
        ELSE NEW.max_reviews := 3;
      END CASE;
    END IF;
  
  -- For widget_projects table
  ELSIF TG_TABLE_NAME = 'widget_projects' THEN
    -- Ensure api_key has a value if not provided
    IF NEW.api_key IS NULL THEN
      NEW.api_key := 'grw_' || substring(gen_random_uuid()::text, 1, 16);
    END IF;
    
    -- Set default value for subscription_tier
    IF NEW.subscription_tier IS NULL THEN
      NEW.subscription_tier := 'FREE';
    END IF;
    
    -- Handle other defaults as needed
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to both tables
CREATE TRIGGER handle_widget_creation_trigger
BEFORE INSERT ON widget_projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_widget_creation();

CREATE TRIGGER handle_widget_creation_trigger
BEFORE INSERT ON widget_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.handle_widget_creation();

-- The previous version worked fine without the debug code
-- We don't need the trigger listing for the actual fix

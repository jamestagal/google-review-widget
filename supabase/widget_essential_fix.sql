-- Essential fixes for the "record 'new' has no field 'rate_limit'" error
-- Created on 2025-04-03

-- 1. Ensure the widget_projects table has subscription_tier
ALTER TABLE IF EXISTS public.widget_projects 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'FREE';

-- 2. Ensure widget_api_keys has the necessary fields
ALTER TABLE IF EXISTS public.widget_api_keys 
ADD COLUMN IF NOT EXISTS rate_limit INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS max_reviews INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS cache_duration INTEGER DEFAULT 86400;

-- 3. Drop all potentially problematic triggers
DROP TRIGGER IF EXISTS handle_widget_api_key_trigger ON widget_projects;
DROP TRIGGER IF EXISTS handle_widget_creation_trigger ON widget_projects;
DROP TRIGGER IF EXISTS handle_widget_project_trigger ON widget_projects;
DROP TRIGGER IF EXISTS handle_new_widget_trigger ON widget_projects;

-- 4. Create the improved handle_widget_project function
CREATE OR REPLACE FUNCTION public.handle_widget_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure api_key has a value if not provided
  IF NEW.api_key IS NULL THEN
    NEW.api_key := 'grw_' || substring(gen_random_uuid()::text, 1, 16);
  END IF;
  
  -- Set default value for subscription_tier
  IF NEW.subscription_tier IS NULL THEN
    NEW.subscription_tier := 'FREE';
  END IF;
  
  -- Set display default if not provided
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

-- 5. Add the trigger to the widget_projects table
DROP TRIGGER IF EXISTS handle_widget_project_trigger ON widget_projects;
CREATE TRIGGER handle_widget_project_trigger
BEFORE INSERT ON widget_projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_widget_project();

-- 6. Fix handle_widget_api_key function to set defaults correctly
CREATE OR REPLACE FUNCTION public.handle_widget_api_key()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default values if not provided
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add the trigger to the widget_api_keys table
DROP TRIGGER IF EXISTS handle_widget_api_key_trigger ON widget_api_keys;
CREATE TRIGGER handle_widget_api_key_trigger
BEFORE INSERT ON widget_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.handle_widget_api_key();

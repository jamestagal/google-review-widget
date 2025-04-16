-- Migration to fix all widget triggers causing the 'record "new" has no field "rate_limit"' error
-- Created on 2025-04-03

-- First, let's drop ALL triggers on widget_projects to ensure a clean slate
DROP TRIGGER IF EXISTS handle_widget_api_key_trigger ON widget_projects;
DROP TRIGGER IF EXISTS handle_widget_creation_trigger ON widget_projects;
DROP TRIGGER IF EXISTS handle_widget_project_trigger ON widget_projects;
DROP TRIGGER IF EXISTS handle_new_widget_trigger ON widget_projects;

-- Drop any old trigger functions that we've replaced with better ones
DROP FUNCTION IF EXISTS public.handle_new_widget();

-- Make sure the handle_widget_project function is correct
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
  
  -- Don't try to set rate_limit or other api_key specific fields here
  -- Those should only be handled in the handle_widget_api_key function
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add the trigger to the widget_projects table
CREATE TRIGGER handle_widget_project_trigger
BEFORE INSERT ON widget_projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_widget_project();

-- Also ensure the handle_widget_creation function has the correct behavior
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
    
    -- NO rate_limit or other api_key specific fields here
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset the triggers on both tables to ensure they're properly attached
DROP TRIGGER IF EXISTS handle_widget_creation_trigger ON widget_api_keys;
CREATE TRIGGER handle_widget_creation_trigger
BEFORE INSERT ON widget_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.handle_widget_creation();

-- Check if we need to recreate the trigger on widget_projects
CREATE TRIGGER handle_widget_creation_trigger
BEFORE INSERT ON widget_projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_widget_creation();

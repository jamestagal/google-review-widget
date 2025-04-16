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
EXECUTE FUNCTION public.handle_updated_at();-- Migration to ensure widget_api_keys has all necessary fields
-- Created on 2025-04-03

-- Check and add rate_limit column if it doesn't exist
DO $do$ 
BEGIN
  -- Check for rate_limit column
  IF NOT EXISTS (SELECT 1 
               FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'widget_api_keys' 
               AND column_name = 'rate_limit') THEN
    
    -- Add rate_limit column with appropriate default
    ALTER TABLE public.widget_api_keys 
    ADD COLUMN rate_limit INTEGER NOT NULL DEFAULT 10;
    
    RAISE NOTICE 'Added rate_limit column to widget_api_keys table';
  ELSE
    RAISE NOTICE 'rate_limit column already exists in widget_api_keys table';
  END IF;
  
  -- Check for max_reviews column
  IF NOT EXISTS (SELECT 1 
               FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'widget_api_keys' 
               AND column_name = 'max_reviews') THEN
    
    -- Add max_reviews column with appropriate default
    ALTER TABLE public.widget_api_keys 
    ADD COLUMN max_reviews INTEGER NOT NULL DEFAULT 3;
    
    RAISE NOTICE 'Added max_reviews column to widget_api_keys table';
  ELSE
    RAISE NOTICE 'max_reviews column already exists in widget_api_keys table';
  END IF;
  
  -- Check for cache_duration column
  IF NOT EXISTS (SELECT 1 
               FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'widget_api_keys' 
               AND column_name = 'cache_duration') THEN
    
    -- Add cache_duration column with appropriate default
    ALTER TABLE public.widget_api_keys 
    ADD COLUMN cache_duration INTEGER NOT NULL DEFAULT 86400;
    
    RAISE NOTICE 'Added cache_duration column to widget_api_keys table';
  ELSE
    RAISE NOTICE 'cache_duration column already exists in widget_api_keys table';
  END IF;
END $do$;

-- Verify changes
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' AND
  table_name = 'widget_api_keys' AND
  column_name IN ('rate_limit', 'max_reviews', 'cache_duration')
ORDER BY 
  table_name, ordinal_position;-- Migration to fix widget related trigger functions
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

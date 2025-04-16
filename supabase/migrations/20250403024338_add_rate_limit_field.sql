-- Migration to ensure widget_api_keys has all necessary fields
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
  table_name, ordinal_position;
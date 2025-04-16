-- Focused SQL script to fix widget tables foreign keys and RLS policies

-- Create or replace timestamp handling functions
CREATE OR REPLACE FUNCTION public.handle_created_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Fix widget_api_keys table
DO $$ 
BEGIN
    -- Add subscription_tier with default value if missing
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'widget_api_keys'
        AND column_name = 'subscription_tier'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.widget_api_keys 
        ALTER COLUMN subscription_tier SET NOT NULL,
        ALTER COLUMN subscription_tier SET DEFAULT 'FREE';
    END IF;
    
    -- Create timestamp triggers if needed
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'set_widget_api_keys_updated_at'
    ) THEN
        CREATE TRIGGER set_widget_api_keys_updated_at
        BEFORE UPDATE ON public.widget_api_keys
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'set_widget_api_keys_created_at'
    ) THEN
        CREATE TRIGGER set_widget_api_keys_created_at
        BEFORE INSERT ON public.widget_api_keys
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_created_at();
    END IF;
END $$;

-- 2. Fix widget_projects table
DO $$ 
BEGIN
    -- Add subscription_tier with default value if missing
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'widget_projects'
        AND column_name = 'subscription_tier'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.widget_projects 
        ALTER COLUMN subscription_tier SET NOT NULL,
        ALTER COLUMN subscription_tier SET DEFAULT 'FREE';
    END IF;
    
    -- Ensure API key relationship exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'widget_projects'
        AND column_name = 'api_key'
    ) THEN
        ALTER TABLE public.widget_projects 
        ADD COLUMN api_key TEXT REFERENCES public.widget_api_keys(api_key);
    END IF;
    
    -- Create timestamp triggers if needed
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'set_widget_projects_updated_at'
    ) THEN
        CREATE TRIGGER set_widget_projects_updated_at
        BEFORE UPDATE ON public.widget_projects
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'set_widget_projects_created_at'
    ) THEN
        CREATE TRIGGER set_widget_projects_created_at
        BEFORE INSERT ON public.widget_projects
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_created_at();
    END IF;
END $$;

-- 3. Fix business_profiles table
DO $$ 
BEGIN
    -- Create timestamp triggers if needed
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'set_business_profiles_updated_at'
    ) THEN
        CREATE TRIGGER set_business_profiles_updated_at
        BEFORE UPDATE ON public.business_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'set_business_profiles_created_at'
    ) THEN
        CREATE TRIGGER set_business_profiles_created_at
        BEFORE INSERT ON public.business_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_created_at();
    END IF;
END $$;

-- 4. Fix or create proper RLS policies (drop and recreate to ensure they're correct)
-- Fix widget_projects RLS policies
DO $$ 
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE public.widget_projects ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies to avoid duplicates
    DROP POLICY IF EXISTS "Users can view their own widget projects" ON public.widget_projects;
    DROP POLICY IF EXISTS "Users can insert their own widget projects" ON public.widget_projects;
    DROP POLICY IF EXISTS "Users can update their own widget projects" ON public.widget_projects;
    DROP POLICY IF EXISTS "Users can delete their own widget projects" ON public.widget_projects;
    DROP POLICY IF EXISTS "Users can view own data" ON public.widget_projects;
    DROP POLICY IF EXISTS "Users can insert own data" ON public.widget_projects;
    DROP POLICY IF EXISTS "Users can update own data" ON public.widget_projects;
    DROP POLICY IF EXISTS "Users can delete own data" ON public.widget_projects;
    DROP POLICY IF EXISTS "Public widget access" ON public.widget_projects;
    
    -- Create standard policies per Supabase integration rules
    CREATE POLICY "Users can view own data" ON public.widget_projects
      FOR SELECT USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert own data" ON public.widget_projects
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update own data" ON public.widget_projects
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete own data" ON public.widget_projects
      FOR DELETE USING (auth.uid() = user_id);
    
    -- Special policy for public widget access via API key
    CREATE POLICY "Public widget access" ON public.widget_projects
      FOR SELECT USING (api_key IS NOT NULL);
END $$;

-- Fix widget_api_keys RLS policies
DO $$ 
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE public.widget_api_keys ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies to avoid duplicates
    DROP POLICY IF EXISTS "Users can view their own API keys" ON public.widget_api_keys;
    DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.widget_api_keys;
    DROP POLICY IF EXISTS "Users can update their own API keys" ON public.widget_api_keys;
    DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.widget_api_keys;
    DROP POLICY IF EXISTS "Users can view own data" ON public.widget_api_keys;
    DROP POLICY IF EXISTS "Users can insert own data" ON public.widget_api_keys;
    DROP POLICY IF EXISTS "Users can update own data" ON public.widget_api_keys;
    DROP POLICY IF EXISTS "Users can delete own data" ON public.widget_api_keys;
    DROP POLICY IF EXISTS "Public API key lookup" ON public.widget_api_keys;
    
    -- Create standard policies per Supabase integration rules
    CREATE POLICY "Users can view own data" ON public.widget_api_keys
      FOR SELECT USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert own data" ON public.widget_api_keys
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update own data" ON public.widget_api_keys
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete own data" ON public.widget_api_keys
      FOR DELETE USING (auth.uid() = user_id);
    
    -- Special policy for public API key lookup
    CREATE POLICY "Public API key lookup" ON public.widget_api_keys
      FOR SELECT USING (true);
END $$;

-- Fix business_profiles RLS policies
DO $$ 
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies to avoid duplicates
    DROP POLICY IF EXISTS "Users can view their own business profiles" ON public.business_profiles;
    DROP POLICY IF EXISTS "Users can insert their own business profiles" ON public.business_profiles;
    DROP POLICY IF EXISTS "Users can update their own business profiles" ON public.business_profiles;
    DROP POLICY IF EXISTS "Users can delete their own business profiles" ON public.business_profiles;
    DROP POLICY IF EXISTS "Users can view own data" ON public.business_profiles;
    DROP POLICY IF EXISTS "Users can insert own data" ON public.business_profiles;
    DROP POLICY IF EXISTS "Users can update own data" ON public.business_profiles;
    DROP POLICY IF EXISTS "Users can delete own data" ON public.business_profiles;
    
    -- Create standard policies per Supabase integration rules
    CREATE POLICY "Users can view own data" ON public.business_profiles
      FOR SELECT USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert own data" ON public.business_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update own data" ON public.business_profiles
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete own data" ON public.business_profiles
      FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Service role bypass policies for testing
DO $$
BEGIN
    -- Add service role bypass policy for business_profiles if it doesn't exist
    DROP POLICY IF EXISTS "service_role_bypass" ON public.business_profiles;
    CREATE POLICY "service_role_bypass" ON public.business_profiles 
      USING (true) 
      WITH CHECK (true);

    -- Add service role bypass policy for widget_projects if it doesn't exist
    DROP POLICY IF EXISTS "service_role_bypass" ON public.widget_projects;
    CREATE POLICY "service_role_bypass" ON public.widget_projects 
      USING (true) 
      WITH CHECK (true);

    -- Add service role bypass policy for widget_api_keys if it doesn't exist
    DROP POLICY IF EXISTS "service_role_bypass" ON public.widget_api_keys;
    CREATE POLICY "service_role_bypass" ON public.widget_api_keys 
      USING (true) 
      WITH CHECK (true);
END $$;

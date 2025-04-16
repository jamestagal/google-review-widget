-- Migration to enhance widget schema and apply proper RLS policies
-- This migration ensures proper triggers for created_at/updated_at fields
-- and sets up comprehensive RLS policies for all widget-related tables

-- First, let's ensure we have the timestamp management functions
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

-- Next, let's update the widget_api_keys table to ensure proper structure
DO $$ 
BEGIN
    -- If the table exists, check and modify it
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_api_keys') THEN
        -- Add any missing columns
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'widget_api_keys'
                      AND column_name = 'created_at') THEN
            ALTER TABLE public.widget_api_keys ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        END IF;

        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'widget_api_keys'
                      AND column_name = 'updated_at') THEN
            ALTER TABLE public.widget_api_keys ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        END IF;
        
        -- Add any new columns needed for widget functionality
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'widget_api_keys'
                      AND column_name = 'use_count') THEN
            ALTER TABLE public.widget_api_keys ADD COLUMN use_count INTEGER NOT NULL DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'widget_api_keys'
                      AND column_name = 'last_used_at') THEN
            ALTER TABLE public.widget_api_keys ADD COLUMN last_used_at TIMESTAMPTZ;
        END IF;
        
    ELSE
        -- If the table doesn't exist, create it with all fields
        CREATE TABLE public.widget_api_keys (
            api_key TEXT PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            subscription_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'BASIC', 'PRO', 'PREMIUM')),
            rate_limit INTEGER NOT NULL DEFAULT 10,
            cache_duration INTEGER NOT NULL DEFAULT 86400,
            max_reviews INTEGER NOT NULL DEFAULT 3,
            allowed_domains TEXT[] NOT NULL DEFAULT ARRAY['*']::TEXT[],
            custom_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
            use_count INTEGER NOT NULL DEFAULT 0,
            last_used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    END IF;
    
    -- Enable RLS on the table
    ALTER TABLE public.widget_api_keys ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS set_widget_api_keys_created_at ON public.widget_api_keys;
    DROP TRIGGER IF EXISTS set_widget_api_keys_updated_at ON public.widget_api_keys;
    
    -- Create triggers for created_at and updated_at
    CREATE TRIGGER set_widget_api_keys_created_at
      BEFORE INSERT ON public.widget_api_keys
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_created_at();
      
    CREATE TRIGGER set_widget_api_keys_updated_at
      BEFORE UPDATE ON public.widget_api_keys
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
END $$;

-- Next, update or create the widget_projects table
DO $$
BEGIN
    -- If the table exists, check and modify it
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_projects') THEN
        -- Add any missing columns
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'widget_projects'
                       AND column_name = 'created_at') THEN
            ALTER TABLE public.widget_projects ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        END IF;

        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'widget_projects'
                       AND column_name = 'updated_at') THEN
            ALTER TABLE public.widget_projects ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        END IF;
        
        -- Add api_key column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'widget_projects'
                       AND column_name = 'api_key') THEN
            ALTER TABLE public.widget_projects ADD COLUMN api_key TEXT REFERENCES public.widget_api_keys(api_key);
        END IF;
        
        -- Add new analytics columns
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'widget_projects'
                       AND column_name = 'view_count') THEN
            ALTER TABLE public.widget_projects ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'widget_projects'
                       AND column_name = 'last_viewed_at') THEN
            ALTER TABLE public.widget_projects ADD COLUMN last_viewed_at TIMESTAMPTZ;
        END IF;
    ELSE
        -- If the table doesn't exist, create it with all fields
        CREATE TABLE public.widget_projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            business_profile_id UUID,
            api_key TEXT REFERENCES public.widget_api_keys(api_key),
            name TEXT NOT NULL,
            display_type TEXT NOT NULL CHECK (display_type IN ('carousel', 'grid', 'list', 'badge', 'slider', 'floating-badge', 'review-wall')),
            theme TEXT NOT NULL DEFAULT 'light',
            subscription_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'BASIC', 'PRO', 'PREMIUM')),
            colors JSONB NOT NULL DEFAULT '{"background":"#ffffff","text":"#000000","stars":"#FFD700","links":"#0070f3","buttons":"#0070f3"}'::jsonb,
            fonts JSONB NOT NULL DEFAULT '{"family":"inherit","titleSize":"1.25rem","bodySize":"1rem","weight":"normal"}'::jsonb,
            filters JSONB NOT NULL DEFAULT '{"minRating":1,"maxAge":365,"sortBy":"newest"}'::jsonb,
            display JSONB NOT NULL DEFAULT '{"showHeader":true,"showRating":true,"showPhotos":true,"reviewLimit":10,"width":"100%","height":"auto"}'::jsonb,
            view_count INTEGER NOT NULL DEFAULT 0,
            last_viewed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    END IF;
    
    -- Enable RLS on the table
    ALTER TABLE public.widget_projects ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS set_widget_projects_created_at ON public.widget_projects;
    DROP TRIGGER IF EXISTS set_widget_projects_updated_at ON public.widget_projects;
    
    -- Create triggers for created_at and updated_at
    CREATE TRIGGER set_widget_projects_created_at
      BEFORE INSERT ON public.widget_projects
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_created_at();
      
    CREATE TRIGGER set_widget_projects_updated_at
      BEFORE UPDATE ON public.widget_projects
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
END $$;

-- Make sure business_profiles exists and update it if needed
DO $$
BEGIN
    -- If the table exists, check and modify it
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'business_profiles') THEN
        -- Add any missing columns
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'business_profiles'
                       AND column_name = 'created_at') THEN
            ALTER TABLE public.business_profiles ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        END IF;

        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'business_profiles'
                       AND column_name = 'updated_at') THEN
            ALTER TABLE public.business_profiles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        END IF;
        
        -- Add rating and review columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'business_profiles'
                       AND column_name = 'average_rating') THEN
            ALTER TABLE public.business_profiles ADD COLUMN average_rating NUMERIC(3,2);
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'business_profiles'
                       AND column_name = 'review_count') THEN
            ALTER TABLE public.business_profiles ADD COLUMN review_count INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'business_profiles'
                       AND column_name = 'last_review_fetch') THEN
            ALTER TABLE public.business_profiles ADD COLUMN last_review_fetch TIMESTAMPTZ;
        END IF;
    ELSE
        -- If the table doesn't exist, create it with all fields
        CREATE TABLE public.business_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            google_place_id TEXT NOT NULL,
            business_name TEXT NOT NULL,
            business_address TEXT,
            logo_url TEXT,
            average_rating NUMERIC(3,2),
            review_count INTEGER,
            last_review_fetch TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    END IF;
    
    -- Enable RLS on the table
    ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS set_business_profiles_created_at ON public.business_profiles;
    DROP TRIGGER IF EXISTS set_business_profiles_updated_at ON public.business_profiles;
    
    -- Create triggers for created_at and updated_at
    CREATE TRIGGER set_business_profiles_created_at
      BEFORE INSERT ON public.business_profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_created_at();
      
    CREATE TRIGGER set_business_profiles_updated_at
      BEFORE UPDATE ON public.business_profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
END $$;

-- Make sure FK from widget_projects to business_profiles exists
DO $$
BEGIN
    -- Add foreign key from widget_projects to business_profiles if needed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'widget_projects_business_profile_id_fkey' 
        AND table_name = 'widget_projects'
    ) THEN
        ALTER TABLE public.widget_projects 
        ADD CONSTRAINT widget_projects_business_profile_id_fkey 
        FOREIGN KEY (business_profile_id) 
        REFERENCES public.business_profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Create or update RLS policies for business_profiles
DO $$
BEGIN
    -- Drop existing policies to be replaced
    DROP POLICY IF EXISTS "Users can view their own business profiles" ON public.business_profiles;
    DROP POLICY IF EXISTS "Users can insert their own business profiles" ON public.business_profiles;
    DROP POLICY IF EXISTS "Users can update their own business profiles" ON public.business_profiles;
    DROP POLICY IF EXISTS "Users can delete their own business profiles" ON public.business_profiles;
    
    -- Create updated policies
    CREATE POLICY "Users can view own data" ON public.business_profiles
      FOR SELECT USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert own data" ON public.business_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update own data" ON public.business_profiles
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete own data" ON public.business_profiles
      FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Create or update RLS policies for widget_projects
DO $$
BEGIN
    -- Drop existing policies to be replaced
    DROP POLICY IF EXISTS "Users can view their own widget projects" ON public.widget_projects;
    DROP POLICY IF EXISTS "Users can insert their own widget projects" ON public.widget_projects;
    DROP POLICY IF EXISTS "Users can update their own widget projects" ON public.widget_projects;
    DROP POLICY IF EXISTS "Users can delete their own widget projects" ON public.widget_projects;
    
    -- Create updated policies
    CREATE POLICY "Users can view own data" ON public.widget_projects
      FOR SELECT USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert own data" ON public.widget_projects
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update own data" ON public.widget_projects
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete own data" ON public.widget_projects
      FOR DELETE USING (auth.uid() = user_id);
      
    -- Allow public access to widgets via API key - this makes widgets publicly viewable
    CREATE POLICY "Public widget access" ON public.widget_projects
      FOR SELECT USING (api_key IS NOT NULL);
END $$;

-- Create or update RLS policies for widget_api_keys
DO $$
BEGIN
    -- Drop existing policies to be replaced
    DROP POLICY IF EXISTS "Users can view their own API keys" ON public.widget_api_keys;
    DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.widget_api_keys;
    DROP POLICY IF EXISTS "Users can update their own API keys" ON public.widget_api_keys;
    DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.widget_api_keys;
    
    -- Create updated policies
    CREATE POLICY "Users can view own data" ON public.widget_api_keys
      FOR SELECT USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert own data" ON public.widget_api_keys
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update own data" ON public.widget_api_keys
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete own data" ON public.widget_api_keys
      FOR DELETE USING (auth.uid() = user_id);
      
    -- Allow public access by API key for authentication from widgets
    CREATE POLICY "Public API key lookup" ON public.widget_api_keys
      FOR SELECT USING (true);
END $$;

-- Create a function to track widget views and API key usage
CREATE OR REPLACE FUNCTION public.track_widget_view(
    widget_id UUID,
    key TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Update widget view statistics
    UPDATE public.widget_projects
    SET 
        view_count = view_count + 1,
        last_viewed_at = NOW()
    WHERE id = widget_id;
    
    -- Update API key usage statistics
    UPDATE public.widget_api_keys
    SET 
        use_count = use_count + 1,
        last_used_at = NOW()
    WHERE api_key = key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

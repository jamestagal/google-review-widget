-- Migration to fix widget creation issues and ensure proper foreign key constraints

-- First ensure the widget_api_keys table exists with proper structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_api_keys') THEN
        CREATE TABLE public.widget_api_keys (
            api_key TEXT PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            subscription_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'BASIC', 'PRO', 'PREMIUM')),
            rate_limit INTEGER NOT NULL DEFAULT 10,
            cache_duration INTEGER NOT NULL DEFAULT 86400,
            max_reviews INTEGER NOT NULL DEFAULT 3,
            allowed_domains TEXT[] NOT NULL DEFAULT ARRAY['*']::TEXT[],
            custom_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

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
    END IF;
END $$;

-- Make sure the widget_projects table includes api_key reference if it exists
DO $$
BEGIN
    -- Check if widget_projects table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_projects') THEN
        -- Check if api_key column already exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'widget_projects' 
            AND column_name = 'api_key'
        ) THEN
            -- Add api_key column to widget_projects
            ALTER TABLE public.widget_projects ADD COLUMN api_key TEXT REFERENCES public.widget_api_keys(api_key);
        END IF;
    ELSE
        -- If widget_projects doesn't exist, create it with all necessary fields
        CREATE TABLE public.widget_projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            business_profile_id UUID NOT NULL, -- Will add FK constraint after ensuring business_profiles exists
            api_key TEXT REFERENCES public.widget_api_keys(api_key),
            name TEXT NOT NULL,
            display_type TEXT NOT NULL CHECK (display_type IN ('carousel', 'grid', 'list', 'badge', 'slider', 'floating-badge', 'review-wall')),
            theme TEXT NOT NULL DEFAULT 'light',
            subscription_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'BASIC', 'PRO', 'PREMIUM')),
            colors JSONB NOT NULL DEFAULT '{"background":"#ffffff","text":"#000000","stars":"#FFD700","links":"#0070f3","buttons":"#0070f3"}'::jsonb,
            fonts JSONB NOT NULL DEFAULT '{"family":"inherit","titleSize":"1.25rem","bodySize":"1rem","weight":"normal"}'::jsonb,
            filters JSONB NOT NULL DEFAULT '{"minRating":1,"maxAge":365,"sortBy":"newest"}'::jsonb,
            display JSONB NOT NULL DEFAULT '{"showHeader":true,"showRating":true,"showPhotos":true,"reviewLimit":10,"width":"100%","height":"auto"}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Enable RLS on widget_projects
        ALTER TABLE public.widget_projects ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies for widget_projects
        CREATE POLICY "Users can view their own widget projects" 
          ON public.widget_projects FOR SELECT 
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own widget projects" 
          ON public.widget_projects FOR INSERT 
          WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own widget projects" 
          ON public.widget_projects FOR UPDATE 
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own widget projects" 
          ON public.widget_projects FOR DELETE 
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- Make sure business_profiles exists and add foreign key to widget_projects
DO $$
BEGIN
    -- Check if business_profiles table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'business_profiles') THEN
        -- Create business_profiles table
        CREATE TABLE public.business_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            google_place_id TEXT NOT NULL,
            business_name TEXT NOT NULL,
            business_address TEXT,
            logo_url TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Enable RLS on business_profiles
        ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies for business_profiles
        CREATE POLICY "Users can view their own business profiles" 
          ON public.business_profiles FOR SELECT 
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own business profiles" 
          ON public.business_profiles FOR INSERT 
          WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own business profiles" 
          ON public.business_profiles FOR UPDATE 
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own business profiles" 
          ON public.business_profiles FOR DELETE 
          USING (auth.uid() = user_id);
    END IF;

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

-- Create a function to handle creating test users if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_test_user(user_id UUID, user_email TEXT, user_name TEXT)
RETURNS VOID AS $$
DECLARE
    raw_metadata JSONB;
BEGIN
    -- Create raw metadata with user name
    raw_metadata := jsonb_build_object('name', user_name);
    
    -- Insert user into auth.users
    INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, email_confirmed_at)
    VALUES (
        user_id,
        user_email,
        raw_metadata,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Note: handle_new_user trigger should handle profile creation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create service role bypass policies for testing
DO $$
BEGIN
    -- Add service role bypass policy for business_profiles if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'business_profiles' 
        AND policyname = 'service_role_bypass'
    ) THEN
        CREATE POLICY "service_role_bypass" ON public.business_profiles 
        USING (true) 
        WITH CHECK (true);
    END IF;

    -- Add service role bypass policy for widget_projects if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'widget_projects' 
        AND policyname = 'service_role_bypass'
    ) THEN
        CREATE POLICY "service_role_bypass" ON public.widget_projects 
        USING (true) 
        WITH CHECK (true);
    END IF;

    -- Add service role bypass policy for widget_api_keys if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'widget_api_keys' 
        AND policyname = 'service_role_bypass'
    ) THEN
        CREATE POLICY "service_role_bypass" ON public.widget_api_keys 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;
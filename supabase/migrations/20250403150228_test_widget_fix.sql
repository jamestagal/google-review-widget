-- Migration to fix widget creation issues and add test data for development
-- Created on 2025-04-03

-- Check if business_profiles table exists and create it if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'business_profiles') THEN
        -- Create business_profiles table
        CREATE TABLE public.business_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          google_place_id TEXT NOT NULL,
          business_name TEXT NOT NULL,
          business_address TEXT,
          logo_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Add indexes for faster lookups
        CREATE INDEX IF NOT EXISTS business_profiles_user_id_idx ON business_profiles(user_id);

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
END
$$;

-- Check if widget_projects table exists and create it if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_projects') THEN
        -- Create widget_projects table
        CREATE TABLE public.widget_projects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
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

        -- Add indexes for faster lookups
        CREATE INDEX IF NOT EXISTS widget_projects_user_id_idx ON widget_projects(user_id);
        CREATE INDEX IF NOT EXISTS widget_projects_business_profile_id_idx ON widget_projects(business_profile_id);

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
END
$$;

-- Check if widget_api_keys table exists and create it if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_api_keys') THEN
        -- Create widget_api_keys table
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
    END IF;
END
$$;

-- Create service role bypass policy for testing
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
END
$$;

-- Create a test widget entry for development purposes
DO $$
DECLARE
    test_user_id UUID;
    test_business_profile_id UUID;
    test_widget_id UUID;
BEGIN
    -- Get a user ID for testing
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Create a test business profile
        INSERT INTO public.business_profiles (
            user_id, 
            google_place_id, 
            business_name, 
            business_address
        ) 
        VALUES (
            test_user_id,
            'TEST_PLACE_ID',
            'Test Business (Migration)',
            'Test Address, Test City'
        )
        RETURNING id INTO test_business_profile_id;

        -- Create a test widget project
        INSERT INTO public.widget_projects (
            user_id,
            business_profile_id,
            name,
            display_type,
            theme,
            subscription_tier
        )
        VALUES (
            test_user_id,
            test_business_profile_id,
            'Test Widget (Migration)',
            'carousel',
            'light',
            'FREE'
        )
        RETURNING id INTO test_widget_id;
        
        -- Create a test API key
        INSERT INTO public.widget_api_keys (
            api_key,
            user_id,
            subscription_tier
        )
        VALUES (
            'wk_test_migration_' || floor(random() * 1000000)::text,
            test_user_id,
            'FREE'
        );
        
        RAISE NOTICE 'Created test widget with user_id: %, business_profile_id: %, widget_id: %', 
            test_user_id, test_business_profile_id, test_widget_id;
    ELSE
        RAISE NOTICE 'No users found, skipping test widget creation.';
    END IF;
END
$$;

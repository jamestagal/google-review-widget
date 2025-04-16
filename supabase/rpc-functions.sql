-- RPC Functions to bypass RLS policies for admin operations
-- These functions use SECURITY DEFINER to execute with the privileges of the function owner
-- This is much more reliable than trying to use RLS policies

-- Function to insert a business profile
CREATE OR REPLACE FUNCTION insert_business_profile(
    p_user_id UUID,
    p_google_place_id TEXT,
    p_business_name TEXT,
    p_business_address TEXT DEFAULT NULL
)
RETURNS SETOF business_profiles
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the OWNER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO business_profiles (
        user_id, 
        google_place_id, 
        business_name, 
        business_address
    ) 
    VALUES (
        p_user_id,
        p_google_place_id,
        p_business_name,
        p_business_address
    )
    RETURNING *;
END;
$$;

-- Function to insert a widget API key
CREATE OR REPLACE FUNCTION insert_widget_api_key(
    p_user_id UUID,
    p_api_key TEXT,
    p_subscription_tier TEXT DEFAULT 'FREE',
    p_rate_limit INTEGER DEFAULT 10,
    p_cache_duration INTEGER DEFAULT 86400,
    p_max_reviews INTEGER DEFAULT 3,
    p_allowed_domains TEXT[] DEFAULT ARRAY['*'],
    p_custom_settings JSONB DEFAULT '{}'::jsonb
)
RETURNS SETOF widget_api_keys
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the OWNER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO widget_api_keys (
        user_id,
        api_key,
        subscription_tier,
        rate_limit,
        cache_duration,
        max_reviews,
        allowed_domains,
        custom_settings
    ) 
    VALUES (
        p_user_id,
        p_api_key,
        p_subscription_tier,
        p_rate_limit,
        p_cache_duration,
        p_max_reviews,
        p_allowed_domains,
        p_custom_settings
    )
    RETURNING *;
END;
$$;

-- Function to insert a widget project
CREATE OR REPLACE FUNCTION insert_widget_project(
    p_user_id UUID,
    p_business_profile_id UUID,
    p_api_key TEXT,
    p_name TEXT,
    p_display_type TEXT DEFAULT 'carousel',
    p_theme TEXT DEFAULT 'light',
    p_filters JSONB DEFAULT NULL,
    p_display JSONB DEFAULT NULL,
    p_colors JSONB DEFAULT NULL,
    p_fonts JSONB DEFAULT NULL
)
RETURNS SETOF widget_projects
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the OWNER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO widget_projects (
        user_id,
        business_profile_id,
        api_key,
        name,
        display_type,
        theme,
        filters,
        display,
        colors,
        fonts
    ) 
    VALUES (
        p_user_id,
        p_business_profile_id,
        p_api_key,
        p_name,
        p_display_type,
        p_theme,
        p_filters,
        p_display,
        p_colors,
        p_fonts
    )
    RETURNING *;
END;
$$;

-- Function to create a complete widget with all related resources
CREATE OR REPLACE FUNCTION create_widget_with_all_resources(
    p_user_id UUID,
    p_google_place_id TEXT,
    p_business_name TEXT,
    p_business_address TEXT DEFAULT NULL,
    p_api_key TEXT DEFAULT NULL, -- If NULL, will generate one
    p_subscription_tier TEXT DEFAULT 'FREE',
    p_widget_name TEXT DEFAULT NULL, -- If NULL, will use business name + ' Widget'
    p_display_type TEXT DEFAULT 'carousel',
    p_theme TEXT DEFAULT 'light'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the OWNER
SET search_path = public
AS $$
DECLARE
    v_business_profile business_profiles;
    v_api_key TEXT;
    v_widget_project widget_projects;
    v_widget_name TEXT;
    v_result JSONB;
BEGIN
    -- 1. Create business profile
    INSERT INTO business_profiles (
        user_id, 
        google_place_id, 
        business_name, 
        business_address
    ) 
    VALUES (
        p_user_id,
        p_google_place_id,
        p_business_name,
        p_business_address
    )
    RETURNING * INTO v_business_profile;
    
    -- 2. Generate API key if not provided
    IF p_api_key IS NULL THEN
        -- Simple API key generation logic
        v_api_key := 'grw_' || 
                     lower(p_subscription_tier) || '_' || 
                     encode(gen_random_bytes(8), 'hex') || '_' ||
                     floor(extract(epoch from now()))::text;
    ELSE
        v_api_key := p_api_key;
    END IF;
    
    -- 3. Create widget API key
    INSERT INTO widget_api_keys (
        user_id,
        api_key,
        subscription_tier,
        rate_limit,
        cache_duration,
        max_reviews,
        allowed_domains,
        custom_settings
    ) 
    VALUES (
        p_user_id,
        v_api_key,
        p_subscription_tier,
        CASE -- Set rate limit based on tier
            WHEN p_subscription_tier = 'PREMIUM' THEN 100
            WHEN p_subscription_tier = 'PRO' THEN 60
            WHEN p_subscription_tier = 'BASIC' THEN 30
            ELSE 10 -- FREE tier
        END,
        CASE -- Set cache duration based on tier
            WHEN p_subscription_tier = 'PREMIUM' THEN 10800
            WHEN p_subscription_tier = 'PRO' THEN 21600
            WHEN p_subscription_tier = 'BASIC' THEN 43200
            ELSE 86400 -- FREE tier
        END,
        CASE -- Set max reviews based on tier
            WHEN p_subscription_tier = 'PREMIUM' THEN 10
            WHEN p_subscription_tier = 'PRO' THEN 7
            WHEN p_subscription_tier = 'BASIC' THEN 5
            ELSE 3 -- FREE tier
        END,
        ARRAY['*'], -- Default allowed domains
        jsonb_build_object('theme', p_theme) -- Default custom settings
    );
    
    -- 4. Set widget name if not provided
    IF p_widget_name IS NULL THEN
        v_widget_name := p_business_name || ' Widget';
    ELSE
        v_widget_name := p_widget_name;
    END IF;
    
    -- 5. Create widget project
    INSERT INTO widget_projects (
        user_id,
        business_profile_id,
        api_key,
        name,
        display_type,
        theme
    ) 
    VALUES (
        p_user_id,
        v_business_profile.id,
        v_api_key,
        v_widget_name,
        p_display_type,
        p_theme
    )
    RETURNING * INTO v_widget_project;
    
    -- 6. Build and return result
    v_result := jsonb_build_object(
        'business_profile', row_to_json(v_business_profile),
        'api_key', v_api_key,
        'widget_project', row_to_json(v_widget_project)
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        -- If any part fails, clean up and re-raise the exception
        IF v_business_profile.id IS NOT NULL THEN
            DELETE FROM business_profiles WHERE id = v_business_profile.id;
        END IF;
        IF v_api_key IS NOT NULL THEN
            DELETE FROM widget_api_keys WHERE api_key = v_api_key;
        END IF;
        RAISE;
END;
$$;

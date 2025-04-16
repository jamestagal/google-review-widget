-- Create a test user in Supabase Auth (migration with timestamp format)
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data,
  created_at,
  updated_at,
  email_confirmed_at
)
SELECT 
  gen_random_uuid(),  -- Generate a UUID for the user
  'test@example.com', -- Test email
  '{"name": "Test User"}', -- Metadata with name to trigger profile creation
  now(),              -- Created timestamp
  now(),              -- Updated timestamp
  now()               -- Email already confirmed
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'test@example.com'
)
RETURNING id;  -- Return the generated UUID for reference

-- Now that we have a user, create the test widget data
DO $$
DECLARE
    test_user_id UUID;
    test_business_profile_id UUID;
    test_widget_id UUID;
BEGIN
    -- Get the test user ID
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@example.com' LIMIT 1;
    
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
        RAISE NOTICE 'Could not find or create test user, skipping test widget creation.';
    END IF;
END
$$;

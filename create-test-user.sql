-- Create a test user in Supabase Auth
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data,
  created_at,
  updated_at,
  email_confirmed_at
)
VALUES (
  gen_random_uuid(),  -- Generate a UUID for the user
  'test@example.com', -- Test email
  '{"name": "Test User"}', -- Metadata with name to trigger profile creation
  now(),              -- Created timestamp
  now(),              -- Updated timestamp
  now()               -- Email already confirmed
)
RETURNING id;  -- Return the generated UUID for reference

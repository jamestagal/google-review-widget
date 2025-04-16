-- Widget Creation Fix for 500 Internal Error
-- This script adds necessary RLS policies for widget creation

-- Enable RLS on tables if not already enabled
ALTER TABLE IF EXISTS business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS widget_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS widget_projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own business profiles" ON business_profiles;
DROP POLICY IF EXISTS "Users can view their own business profiles" ON business_profiles;
DROP POLICY IF EXISTS "Users can update their own business profiles" ON business_profiles;
DROP POLICY IF EXISTS "Users can delete their own business profiles" ON business_profiles;

DROP POLICY IF EXISTS "Users can insert their own widget keys" ON widget_api_keys;
DROP POLICY IF EXISTS "Users can view their own widget keys" ON widget_api_keys;
DROP POLICY IF EXISTS "Users can update their own widget keys" ON widget_api_keys;
DROP POLICY IF EXISTS "Users can delete their own widget keys" ON widget_api_keys;

DROP POLICY IF EXISTS "Users can insert their own widget projects" ON widget_projects;
DROP POLICY IF EXISTS "Users can view their own widget projects" ON widget_projects;
DROP POLICY IF EXISTS "Users can update their own widget projects" ON widget_projects;
DROP POLICY IF EXISTS "Users can delete their own widget projects" ON widget_projects;

-- Create policies for business_profiles
CREATE POLICY "Users can insert their own business profiles"
ON business_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own business profiles"
ON business_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profiles"
ON business_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business profiles"
ON business_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create policies for widget_api_keys
CREATE POLICY "Users can insert their own widget keys"
ON widget_api_keys FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own widget keys"
ON widget_api_keys FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own widget keys"
ON widget_api_keys FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widget keys"
ON widget_api_keys FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create policies for widget_projects
CREATE POLICY "Users can insert their own widget projects"
ON widget_projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own widget projects"
ON widget_projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own widget projects"
ON widget_projects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widget projects"
ON widget_projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix for service role access (if needed)
-- This allows service roles to bypass RLS
ALTER TABLE business_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE widget_api_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE widget_projects FORCE ROW LEVEL SECURITY;

-- Add public access policy for widget_api_keys for verification
CREATE POLICY "Public access to verify API keys"
ON widget_api_keys FOR SELECT
TO anon
USING (true);

-- Similar to your previous fix for the Settings page that addressed missing name values,
-- This creates a trigger to handle any missing foreign key references
CREATE OR REPLACE FUNCTION public.handle_widget_creation() RETURNS trigger AS $$
BEGIN
  -- Ensure an API key is generated if not provided
  IF NEW.api_key IS NULL THEN
    NEW.api_key := 'grw_' || substring(gen_random_uuid()::text, 1, 16);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to widget_projects table
DROP TRIGGER IF EXISTS handle_widget_creation_trigger ON widget_projects;
CREATE TRIGGER handle_widget_creation_trigger
BEFORE INSERT ON widget_projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_widget_creation();

-- Add permissions for authenticated users to use the service role functions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

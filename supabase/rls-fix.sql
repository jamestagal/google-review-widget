-- Fix RLS policies for widget-related tables

-- Enable RLS on all tables if not already enabled
ALTER TABLE IF EXISTS public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.widget_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.widget_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for business_profiles table
DROP POLICY IF EXISTS "Users can view their own business profiles" ON public.business_profiles;
DROP POLICY IF EXISTS "Users can insert their own business profiles" ON public.business_profiles;
DROP POLICY IF EXISTS "Users can update their own business profiles" ON public.business_profiles;
DROP POLICY IF EXISTS "Users can delete their own business profiles" ON public.business_profiles;

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

-- Create policies for widget_projects table
DROP POLICY IF EXISTS "Users can view their own widget projects" ON public.widget_projects;
DROP POLICY IF EXISTS "Users can insert their own widget projects" ON public.widget_projects;
DROP POLICY IF EXISTS "Users can update their own widget projects" ON public.widget_projects;
DROP POLICY IF EXISTS "Users can delete their own widget projects" ON public.widget_projects;

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

-- Create policies for widget_api_keys table
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.widget_api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.widget_api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.widget_api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.widget_api_keys;

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

-- Allow service role to bypass RLS
-- Not needed as the service role key automatically bypasses RLS
-- However, ensuring the tables are configured correctly is important

-- Create a policy that allows access to authenticated users for widget_api_keys specifically
-- This is an additional policy that may help if there are issues
CREATE POLICY "Authenticated users can access API keys" 
ON public.widget_api_keys 
FOR ALL 
USING (auth.role() = 'authenticated');

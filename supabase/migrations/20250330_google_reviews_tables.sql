-- Migration for Google Reviews Widget Tables
-- Creates business_profiles and widget_projects tables

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Business Profiles Table
CREATE TABLE IF NOT EXISTS public.business_profiles (
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

-- Add RLS policies for business_profiles
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own business profiles
CREATE POLICY "Users can view their own business profiles" 
  ON public.business_profiles FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own business profiles
CREATE POLICY "Users can insert their own business profiles" 
  ON public.business_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own business profiles
CREATE POLICY "Users can update their own business profiles" 
  ON public.business_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own business profiles
CREATE POLICY "Users can delete their own business profiles" 
  ON public.business_profiles FOR DELETE 
  USING (auth.uid() = user_id);

-- Widget Projects Table
CREATE TABLE IF NOT EXISTS public.widget_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_type TEXT NOT NULL CHECK (display_type IN ('carousel', 'grid', 'list', 'badge', 'slider', 'floating-badge', 'review-wall')),
  theme TEXT NOT NULL DEFAULT 'light',
  colors JSONB NOT NULL DEFAULT '{"background":"#ffffff","text":"#000000","stars":"#FFD700","links":"#0070f3","buttons":"#0070f3"}',
  fonts JSONB NOT NULL DEFAULT '{"family":"inherit","titleSize":"1.25rem","bodySize":"1rem","weight":"normal"}',
  filters JSONB NOT NULL DEFAULT '{"minRating":1,"maxAge":365,"sortBy":"newest"}',
  display JSONB NOT NULL DEFAULT '{"showHeader":true,"showRating":true,"showPhotos":true,"reviewLimit":10,"width":"100%","height":"auto"}',
  api_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS widget_projects_user_id_idx ON widget_projects(user_id);
CREATE INDEX IF NOT EXISTS widget_projects_business_profile_id_idx ON widget_projects(business_profile_id);
CREATE INDEX IF NOT EXISTS widget_projects_api_key_idx ON widget_projects(api_key);

-- Add RLS policies for widget_projects
ALTER TABLE public.widget_projects ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own widget projects
CREATE POLICY "Users can view their own widget projects" 
  ON public.widget_projects FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own widget projects
CREATE POLICY "Users can insert their own widget projects" 
  ON public.widget_projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own widget projects
CREATE POLICY "Users can update their own widget projects" 
  ON public.widget_projects FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own widget projects
CREATE POLICY "Users can delete their own widget projects" 
  ON public.widget_projects FOR DELETE 
  USING (auth.uid() = user_id);

-- Add triggers to update the updated_at column
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for business_profiles
CREATE TRIGGER set_timestamp_business_profiles
BEFORE UPDATE ON public.business_profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Trigger for widget_projects
CREATE TRIGGER set_timestamp_widget_projects
BEFORE UPDATE ON public.widget_projects
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Function to generate a random API key for widgets
CREATE OR REPLACE FUNCTION generate_api_key() 
RETURNS TEXT AS $$
DECLARE
  key TEXT;
  key_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random string for the API key
    key := 'grw_' || encode(gen_random_bytes(16), 'hex');
    
    -- Check if the key already exists
    SELECT EXISTS (
      SELECT 1 FROM widget_projects WHERE api_key = key
    ) INTO key_exists;
    
    -- Exit the loop if the key doesn't exist
    EXIT WHEN NOT key_exists;
  END LOOP;
  
  RETURN key;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate API keys for new widget projects
CREATE OR REPLACE FUNCTION public.trigger_generate_api_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.api_key IS NULL THEN
    NEW.api_key := generate_api_key();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_widget_projects
BEFORE INSERT ON public.widget_projects
FOR EACH ROW
EXECUTE FUNCTION public.trigger_generate_api_key();
-- Create function for handling created_at if it doesn't exist yet
CREATE OR REPLACE FUNCTION public.handle_created_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function for handling updated_at if it doesn't exist yet
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create review_cache table
CREATE TABLE IF NOT EXISTS public.review_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT NOT NULL,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  reviews JSONB NOT NULL DEFAULT '[]',
  overall_rating NUMERIC(3,2),
  total_reviews INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(place_id, business_profile_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS review_cache_place_id_idx ON public.review_cache(place_id);
CREATE INDEX IF NOT EXISTS review_cache_business_profile_id_idx ON public.review_cache(business_profile_id);

-- Create trigger for created_at
CREATE TRIGGER set_review_cache_created_at
  BEFORE INSERT ON public.review_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_at();

-- Create trigger for updated_at
CREATE TRIGGER set_review_cache_updated_at
  BEFORE UPDATE ON public.review_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.review_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow users to view their own cached reviews
CREATE POLICY "Users can view their own reviews" 
  ON public.review_cache 
  FOR SELECT 
  USING (
    business_profile_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
    )
  );

-- Allow users to insert their own cached reviews
CREATE POLICY "Users can insert their own reviews" 
  ON public.review_cache 
  FOR INSERT 
  WITH CHECK (
    business_profile_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
    )
  );

-- Allow users to update their own cached reviews
CREATE POLICY "Users can update their own reviews" 
  ON public.review_cache 
  FOR UPDATE 
  USING (
    business_profile_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete their own cached reviews
CREATE POLICY "Users can delete their own reviews" 
  ON public.review_cache 
  FOR DELETE 
  USING (
    business_profile_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
    )
  );

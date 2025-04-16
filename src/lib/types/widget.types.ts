import type { Database } from './database.types';

// Type definitions for widget data structures
export interface WidgetProject {
  id: string;
  user_id: string;
  api_key: string;
  name: string;
  display_type: 'carousel' | 'grid' | 'list';
  theme: 'light' | 'dark';
  filters: {
    minRating: number;
    maxAge: number;
  };
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
  business_profile_id: string;
  business_profile: BusinessProfile;
}

export interface BusinessProfile {
  id: string;
  google_place_id: string;
  business_name: string;
  business_address: string | null;
  logo_url: string | null;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface WidgetApiKey {
  id: string;
  api_key: string;
  project_id: string;
  subscription_tier: 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM';
  allowed_domains: string[] | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ReviewCache {
  id: string;
  place_id: string;
  place_details_id: string;
  reviews: GoogleReview[];
  overall_rating: number;
  total_reviews: number;
  business_name: string;
  last_updated: string;
}

export interface GoogleReview {
  author_name: string;
  author_url: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface WidgetUsageStat {
  id: string;
  api_key_id: string;
  date: string;
  referer_domain: string;
  user_agent: string;
  created_at: string;
}

// Type-safe Supabase client helper types
export type TypedSupabaseClient = Database['public']['Tables'];

// Selectors for database tables with proper typing
export const WidgetTables = {
  WIDGET_PROJECTS: 'widget_projects',
  WIDGET_API_KEYS: 'widget_api_keys',
  REVIEW_CACHE: 'review_cache',
  WIDGET_USAGE_STATS: 'widget_usage_stats',
  PLACE_DETAILS: 'place_details'
} as const;

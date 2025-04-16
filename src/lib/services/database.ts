/**
 * Database Service
 * 
 * Provides utility functions for interacting with the Supabase database
 */
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database, BusinessProfile, WidgetProject } from '$lib/types/database.types';

// Log the environment variables for debugging (remove in production)
console.log('Supabase URL:', PUBLIC_SUPABASE_URL ? 'Defined' : 'Not defined');
console.log('Supabase Key:', PUBLIC_SUPABASE_ANON_KEY ? 'Defined' : 'Not defined');

// Create the standard Supabase client for client-side operations
export const supabase = createClient<Database>(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
);

// Verify the client was created successfully
console.log('Supabase client initialized');

/**
 * Business Profile Service
 */
export const businessProfileService = {
  /**
   * Get business profiles for the current user
   */
  async getBusinessProfiles() {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*');
      
    if (error) throw error;
    return data;
  },
  
  /**
   * Get a specific business profile
   */
  async getBusinessProfile(id: string) {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  /**
   * Create a new business profile
   */
  async createBusinessProfile(profile: Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('business_profiles')
      .insert(profile)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  /**
   * Update a business profile
   */
  async updateBusinessProfile(id: string, updates: Partial<Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('business_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  /**
   * Delete a business profile
   */
  async deleteBusinessProfile(id: string) {
    const { error } = await supabase
      .from('business_profiles')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  }
};

/**
 * Widget Project Service
 */
export const widgetProjectService = {
  /**
   * Get widget projects for the current user
   */
  async getWidgetProjects() {
    const { data, error } = await supabase
      .from('widget_projects')
      .select('*, business_profiles(*)');
      
    if (error) throw error;
    return data;
  },
  
  /**
   * Get a specific widget project
   */
  async getWidgetProject(id: string) {
    const { data, error } = await supabase
      .from('widget_projects')
      .select('*, business_profiles(*)')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  /**
   * Get a widget project by API key
   */
  async getWidgetByApiKey(apiKey: string) {
    const { data, error } = await supabase
      .from('widget_projects')
      .select('*, business_profiles(*)')
      .eq('api_key', apiKey)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  /**
   * Create a new widget project
   */
  async createWidgetProject(widget: Omit<WidgetProject, 'id' | 'api_key' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('widget_projects')
      .insert(widget)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  /**
   * Update a widget project
   */
  async updateWidgetProject(id: string, updates: Partial<Omit<WidgetProject, 'id' | 'api_key' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('widget_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  /**
   * Delete a widget project
   */
  async deleteWidgetProject(id: string) {
    const { error } = await supabase
      .from('widget_projects')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  }
};
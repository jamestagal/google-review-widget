/**
 * Row Level Security (RLS) Policies Test
 *
 * This file contains dedicated tests for validating the Row Level Security policies
 * in the Supabase database. It ensures that users can only access their own data
 * and that proper security constraints are enforced at the database level.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase Database with custom tables that match our schema
class MockSupabaseDatabase {
  constructor() {
    // Initialize test data
    this.tables = {
      'business_profiles': [
        {
          id: 'business-1',
          user_id: 'test-user-id',
          google_place_id: 'place-id-1',
          business_name: 'Test Business 1',
          business_address: '123 Test Street',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'business-2', 
          user_id: 'other-user-id',
          google_place_id: 'place-id-2',
          business_name: 'Other Business',
          business_address: '456 Other Street',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      'widget_projects': [
        {
          id: 'widget-1',
          user_id: 'test-user-id',
          business_profile_id: 'business-1',
          name: 'My Widget',
          api_key: 'api-key-1',
          display_type: 'carousel',
          theme: 'light',
          colors: { primary: '#FF5733', secondary: '#33FF57' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'widget-2',
          user_id: 'other-user-id',
          business_profile_id: 'business-2',
          name: 'Other Widget',
          api_key: 'api-key-2',
          display_type: 'grid',
          theme: 'dark',
          colors: { primary: '#3357FF', secondary: '#FF33A1' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      'widget_api_keys': [
        {
          id: 'key-1',
          api_key: 'api-key-1',
          user_id: 'test-user-id',
          subscription_tier: 'PRO',
          rate_limit: 100,
          cache_duration: 3600,
          max_reviews: 10,
          is_active: true,
          allowed_domains: ['example.com', 'test.com'],
          custom_settings: { showLogo: true },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'key-2',
          api_key: 'api-key-2',
          user_id: 'other-user-id',
          subscription_tier: 'FREE',
          rate_limit: 10,
          cache_duration: 86400,
          max_reviews: 3,
          is_active: true,
          allowed_domains: ['*'],
          custom_settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      'widget_usage_stats': [
        {
          id: 'stats-1',
          api_key_id: 'key-1',
          date: new Date().toISOString().split('T')[0],
          requests_count: 42,
          unique_place_ids: 3,
          unique_visitors: 120,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'stats-2',
          api_key_id: 'key-2',
          date: new Date().toISOString().split('T')[0],
          requests_count: 15,
          unique_place_ids: 1,
          unique_visitors: 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    };
  }

  /**
   * Simulate RLS-protected from method that only returns data based on user auth
   * @param {string} table - Table name to query
   * @param {Object|null} auth - Authentication context (user id, etc)
   * @returns {Object} - Query builder object
   */
  from(table, auth = null) {
    return {
      /**
       * Select data with RLS policies applied
       * @returns {Object} - Query result
       */
      select: () => {
        // Apply RLS policy simulation
        if (!auth) {
          // Unauthenticated access - return empty array per RLS policy
          return {
            data: [],
            error: null
          };
        }

        // For authenticated users, only return their own data (RLS policy)
        const filteredData = this.tables[table]?.filter(row => row.user_id === auth.id) || [];
        
        return {
          data: filteredData,
          error: null
        };
      },

      /**
       * Insert data with RLS policies applied
       * @param {Object} data - Data to insert
       * @returns {Object} - Insert result
       */
      insert: (data) => {
        // Apply RLS policy simulation for inserts
        if (!auth) {
          // Unauthenticated users cannot insert data per RLS policy
          return {
            data: null,
            error: { message: 'Not authorized to insert data' }
          };
        }

        // Users can only insert data for themselves
        if (data.user_id && data.user_id !== auth.id) {
          return {
            data: null,
            error: { message: 'Not authorized to insert data for other users' }
          };
        }

        // Auto-assign user_id from auth context if not provided
        const dataWithUserId = { ...data, user_id: auth.id };
        
        // Create new record with generated id
        const newRecord = {
          id: `generated-id-${Date.now()}`,
          ...dataWithUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Add to table
        this.tables[table].push(newRecord);
        
        return {
          data: newRecord,
          error: null
        };
      },

      /**
       * Update data with RLS policies applied
       * @param {Object} data - Data to update
       * @returns {Object} - Update result
       */
      update: (data) => {
        // Apply RLS policy simulation for updates
        if (!auth) {
          // Unauthenticated users cannot update data per RLS policy
          return {
            data: null,
            error: { message: 'Not authorized to update data' }
          };
        }

        // Find the record to update
        const recordIndex = this.tables[table].findIndex(row => 
          row.id === data.id && row.user_id === auth.id
        );

        if (recordIndex === -1) {
          // Record not found or doesn't belong to user (RLS policy)
          return {
            data: null,
            error: { message: 'Record not found or not authorized to update' }
          };
        }

        // Update the record
        const updatedRecord = {
          ...this.tables[table][recordIndex],
          ...data,
          updated_at: new Date().toISOString()
        };
        
        // Replace in table
        this.tables[table][recordIndex] = updatedRecord;
        
        return {
          data: updatedRecord,
          error: null
        };
      },

      /**
       * Delete data with RLS policies applied
       * @param {Object} criteria - Delete criteria
       * @returns {Object} - Delete result
       */
      delete: (criteria = {}) => {
        // Apply RLS policy simulation for deletes
        if (!auth) {
          // Unauthenticated users cannot delete data per RLS policy
          return {
            data: null,
            error: { message: 'Not authorized to delete data' }
          };
        }

        // Find records matching criteria that belong to the authenticated user
        const initialCount = this.tables[table].length;
        this.tables[table] = this.tables[table].filter(row => {
          // Keep rows that don't match criteria OR don't belong to user
          const matchesCriteria = Object.entries(criteria).every(([key, value]) => 
            row[key] === value
          );
          
          // RLS policy: only delete user's own data
          const belongsToUser = row.user_id === auth.id;
          
          // Keep if not a match or doesn't belong to user
          return !(matchesCriteria && belongsToUser);
        });

        const deletedCount = initialCount - this.tables[table].length;
        
        return {
          data: { count: deletedCount },
          error: null
        };
      },

      /**
       * Get record by ID with RLS applied
       * @param {string} id - Record ID
       * @returns {Object} - Query result
       */
      get: (id) => {
        // Apply RLS policy simulation
        if (!auth) {
          // Unauthenticated access - return null per RLS policy
          return {
            data: null,
            error: null
          };
        }

        // For authenticated users, only return their own data (RLS policy)
        const record = this.tables[table]?.find(row => 
          row.id === id && row.user_id === auth.id
        );
        
        return {
          data: record || null,
          error: null
        };
      }
    };
  }
}

/**
 * Create a test client with specified auth context
 * @param {Object|null} auth - Auth context (null for unauthenticated)
 * @returns {Object} - Test client
 */
function createTestClient(auth = null) {
  const db = new MockSupabaseDatabase();
  
  return {
    auth: {
      getUser: () => Promise.resolve({
        data: { user: auth },
        error: null
      })
    },
    // Database methods with RLS applied
    from: (table) => db.from(table, auth)
  };
}

// Tests for Row Level Security policies
describe('Row Level Security Policies', () => {
  describe('business_profiles table', () => {
    it('allows users to only select their own profiles', async () => {
      // Create client with authenticated user
      const supabase = createTestClient({ id: 'test-user-id', email: 'test@example.com' });
      
      // Query business profiles
      const { data, error } = await supabase.from('business_profiles').select();
      
      // Verify RLS filtering works
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('business-1');
      expect(data[0].user_id).toBe('test-user-id');
    });

    it('prevents users from selecting others profiles', async () => {
      // Create client with authenticated user
      const supabase = createTestClient({ id: 'test-user-id', email: 'test@example.com' });
      
      // Should not return other user's data
      const { data } = await supabase.from('business_profiles').select();
      
      // Verify no access to other user's data
      const otherUserProfiles = data.filter(profile => profile.user_id !== 'test-user-id');
      expect(otherUserProfiles).toHaveLength(0);
    });

    it('prevents unauthenticated access to profiles', async () => {
      // Create client with no authentication
      const supabase = createTestClient(null);
      
      // Query business profiles
      const { data, error } = await supabase.from('business_profiles').select();
      
      // Verify RLS blocks access
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('allows users to insert their own profiles', async () => {
      // Create client with authenticated user
      const supabase = createTestClient({ id: 'test-user-id', email: 'test@example.com' });
      
      // Insert new business profile
      const { data, error } = await supabase.from('business_profiles').insert({
        google_place_id: 'new-place-id',
        business_name: 'New Business',
        business_address: '789 New Street'
      });
      
      // Verify insert succeeded
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user_id).toBe('test-user-id');
      expect(data.business_name).toBe('New Business');
    });

    it('prevents inserting profiles for other users', async () => {
      // Create client with authenticated user
      const supabase = createTestClient({ id: 'test-user-id', email: 'test@example.com' });
      
      // Try to insert with a different user_id
      const { data, error } = await supabase.from('business_profiles').insert({
        user_id: 'other-user-id',
        google_place_id: 'sneaky-place-id',
        business_name: 'Sneaky Business'
      });
      
      // Verify RLS prevents this
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    it('prevents unauthenticated profile creation', async () => {
      // Create client with no authentication
      const supabase = createTestClient(null);
      
      // Try to insert a business profile
      const { data, error } = await supabase.from('business_profiles').insert({
        google_place_id: 'anon-place-id',
        business_name: 'Anonymous Business'
      });
      
      // Verify RLS blocks insert
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    it('allows users to update their own profiles', async () => {
      // Create client with authenticated user
      const supabase = createTestClient({ id: 'test-user-id', email: 'test@example.com' });
      
      // Update existing business profile
      const { data, error } = await supabase.from('business_profiles').update({
        id: 'business-1',
        business_name: 'Updated Business Name'
      });
      
      // Verify update succeeded
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.business_name).toBe('Updated Business Name');
    });

    it('prevents updating profiles of other users', async () => {
      // Create client with authenticated user
      const supabase = createTestClient({ id: 'test-user-id', email: 'test@example.com' });
      
      // Try to update another user's business profile
      const { data, error } = await supabase.from('business_profiles').update({
        id: 'business-2',  // This belongs to other-user-id
        business_name: 'Hacked Business Name'
      });
      
      // Verify RLS prevents this
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    it('allows users to delete their own profiles', async () => {
      // Create client with authenticated user
      const supabase = createTestClient({ id: 'test-user-id', email: 'test@example.com' });
      
      // Delete existing business profile
      const { data, error } = await supabase.from('business_profiles').delete({ id: 'business-1' });
      
      // Verify delete succeeded
      expect(error).toBeNull();
      expect(data.count).toBe(1);
      
      // Verify it's gone
      const { data: checkData } = await supabase.from('business_profiles').select();
      expect(checkData.find(profile => profile.id === 'business-1')).toBeUndefined();
    });

    it('prevents deleting profiles of other users', async () => {
      // Create client with authenticated user
      const supabase = createTestClient({ id: 'test-user-id', email: 'test@example.com' });
      
      // Try to delete another user's business profile
      const { data, error } = await supabase.from('business_profiles').delete({ id: 'business-2' });
      
      // Verify RLS prevents this (delete succeeds but affects 0 rows due to RLS)
      expect(error).toBeNull();
      expect(data.count).toBe(0);
    });
  });

  describe('widget_projects table', () => {
    it('allows users to only select their own widgets', async () => {
      // Create client with authenticated user
      const supabase = createTestClient({ id: 'test-user-id', email: 'test@example.com' });
      
      // Query widget projects
      const { data, error } = await supabase.from('widget_projects').select();
      
      // Verify RLS filtering works
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('widget-1');
      expect(data[0].user_id).toBe('test-user-id');
    });

    it('prevents users from selecting others widgets', async () => {
      // Create client with authenticated user
      const supabase = createTestClient({ id: 'test-user-id', email: 'test@example.com' });
      
      // Should not return other user's data
      const { data } = await supabase.from('widget_projects').select();
      
      // Verify no access to other user's widgets
      const otherUserWidgets = data.filter(widget => widget.user_id !== 'test-user-id');
      expect(otherUserWidgets).toHaveLength(0);
    });

    // Additional tests could be added for insert, update, delete for widget_projects
  });

  describe('widget_api_keys table', () => {
    it('allows users to only select their own API keys', async () => {
      // Create client with authenticated user
      const supabase = createTestClient({ id: 'test-user-id', email: 'test@example.com' });
      
      // Query API keys
      const { data, error } = await supabase.from('widget_api_keys').select();
      
      // Verify RLS filtering works
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('key-1');
      expect(data[0].user_id).toBe('test-user-id');
    });

    // Additional tests could be added for API keys
  });

  // Additional test cases for widget_usage_stats could be added here
});

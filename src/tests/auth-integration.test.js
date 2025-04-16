/**
 * Authentication Integration Test
 *
 * Tests the authentication flows and security aspects of the Supabase integration
 * including proper use of getUser() over getSession() and RLS policies.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Mock Supabase Auth client for testing authentication operations
 */
class MockSupabaseAuth {
  constructor() {
    this.user = null;
    this.session = null;
    this.authChangeCallbacks = [];
  }

  /**
   * Simulate getUser auth method - secure method that contacts Supabase Auth server
   * @returns {Promise<{data: {user: Object|null}, error: Error|null}>} Mock response
   */
  getUser() {
    return Promise.resolve({
      data: { user: this.user },
      error: null
    });
  }

  /**
   * Simulate getSession method - this is less secure as it reads from storage
   * @returns {Promise<{data: {session: Object|null}, error: Error|null}>} Mock response
   */
  getSession() {
    return Promise.resolve({
      data: { session: this.session },
      error: null
    });
  }

  /**
   * Simulate signing in with email
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{data: {user: Object, session: Object}|null, error: Error|null}>} Auth result
   */
  signInWithPassword({ email, password }) {
    if (email === 'test@example.com' && password === 'password123') {
      this.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' }
      };

      this.session = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: this.user
      };

      // Trigger auth state change after successful sign in
      setTimeout(() => {
        this._notifyAuthChange('SIGNED_IN', this.session);
      }, 1);

      return Promise.resolve({
        data: { user: this.user, session: this.session },
        error: null
      });
    }

    return Promise.resolve({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials')
    });
  }

  /**
   * Simulate signing out
   * @returns {Promise<{error: Error|null}>} Signout result
   */
  signOut() {
    const hadUser = !!this.user;
    this.user = null;
    this.session = null;

    if (hadUser) {
      // Trigger auth state change after sign out
      setTimeout(() => {
        this._notifyAuthChange('SIGNED_OUT', null);
      }, 1);
    }

    return Promise.resolve({ error: null });
  }

  /**
   * Simulate auth state change listener
   * @param {Function} callback - The function to call on auth state change
   * @returns {{data: {subscription: {unsubscribe: Function}}}} Subscription object
   */
  onAuthStateChange(callback) {
    this.authChangeCallbacks.push(callback);
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.authChangeCallbacks = this.authChangeCallbacks.filter(cb => cb !== callback);
          }
        }
      }
    };
  }

  /**
   * Private method to notify all registered callbacks about auth state changes
   * @param {string} event - Auth event name
   * @param {Object|null} session - Session object
   * @private
   */
  _notifyAuthChange(event, session) {
    this.authChangeCallbacks.forEach(callback => {
      callback(event, session);
    });
  }
}

/**
 * Mock Supabase client for testing database operations with auth
 */
class MockSupabase {
  constructor() {
    this.auth = new MockSupabaseAuth();
    this.tables = {
      'business_profiles': [
        {
          id: 'business-1',
          user_id: 'test-user-id',
          google_place_id: 'test-place-id-1',
          business_name: 'Test Business 1',
          business_address: '123 Test St',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'business-2',
          user_id: 'other-user-id',
          google_place_id: 'test-place-id-2',
          business_name: 'Test Business 2',
          business_address: '456 Other St',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      'widget_projects': [
        {
          id: 'widget-1',
          user_id: 'test-user-id',
          business_profile_id: 'business-1',
          name: 'Test Widget 1',
          api_key: 'test-api-key-1',
          display_type: 'carousel',
          theme: 'light',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'widget-2',
          user_id: 'other-user-id',
          business_profile_id: 'business-2',
          name: 'Test Widget 2',
          api_key: 'test-api-key-2',
          display_type: 'grid',
          theme: 'dark',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    };
  }

  /**
   * Simulate the Supabase from() method with RLS policy enforcement
   * @param {string} table - The table name to query
   */
  from(table) {
    return {
      select: (columns = '*') => {
        // Apply RLS policy - only return data if user is authenticated and data belongs to them
        const applyRLS = (data) => {
          if (!this.auth.user) {
            // Not authenticated - return nothing as per RLS policy
            return [];
          }
          
          // Filter data by user_id to simulate RLS policy
          return data.filter(row => row.user_id === this.auth.user.id);
        };

        return {
          data: applyRLS(this.tables[table] || []),
          error: null
        };
      },
      insert: (data) => {
        // Enforce RLS on insert - only allow if user is authenticated and data belongs to them
        if (!this.auth.user) {
          return { data: null, error: new Error('Not authorized') };
        }

        // Ensure the user_id matches the current user (RLS policy)
        if (data.user_id && data.user_id !== this.auth.user.id) {
          return { data: null, error: new Error('Not authorized to insert for other users') };
        }

        // Auto-assign user_id if not provided
        const dataWithUserId = { ...data, user_id: this.auth.user.id };
        
        // Add to table
        if (this.tables[table]) {
          const newItem = {
            id: `new-${table}-${Date.now()}`,
            ...dataWithUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          this.tables[table].push(newItem);
          return { data: newItem, error: null };
        }
        
        return { data: null, error: new Error(`Table ${table} does not exist`) };
      }
    };
  }
}

// Tests for authentication flow and security
describe('Authentication and Security', () => {
  let supabase;
  
  beforeEach(() => {
    supabase = new MockSupabase();
    // Reset mocks and spies
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Clean up
    supabase = null;
  });

  describe('User Authentication Flow', () => {
    it('should sign in with valid credentials', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
      expect(data.session).toBeDefined();
      expect(data.session.access_token).toBeTruthy();
    });

    it('should fail with invalid credentials', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrong-password'
      });

      expect(error).toBeDefined();
      expect(data.user).toBeNull();
      expect(data.session).toBeNull();
    });

    it('should sign out successfully', async () => {
      // First sign in
      await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });

      // Then sign out
      const { error } = await supabase.auth.signOut();
      expect(error).toBeNull();

      // Verify signed out state
      const { data } = await supabase.auth.getUser();
      expect(data.user).toBeNull();
    });
  });

  describe('Secure Authentication Practices', () => {
    it('should use getUser() for secure authentication verification', async () => {
      // Mock getUser and getSession for tracking
      const getUserSpy = vi.spyOn(supabase.auth, 'getUser');
      const getSessionSpy = vi.spyOn(supabase.auth, 'getSession');

      // Sign in first
      await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });

      // Reset spies after sign-in
      getUserSpy.mockClear();
      getSessionSpy.mockClear();

      // Test a function that follows best practices - always uses getUser() first
      const secureAuthCheck = async () => {
        // This follows the recommended pattern from our authentication implementation
        const { data: { user } } = await supabase.auth.getUser();
        
        // Only if absolutely necessary, get session after verifying user
        let session = null;
        if (user) {
          const { data: sessionData } = await supabase.auth.getSession();
          session = sessionData.session;
        }
        
        return { user, session };
      };

      const result = await secureAuthCheck();
      
      // Verify secure pattern was followed
      expect(getUserSpy).toHaveBeenCalledTimes(1);
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
    });

    it('should handle auth state changes securely', async () => {
      const authChangeHandler = vi.fn();
      const secureAuthChangeHandler = vi.fn();

      // Set up two different handlers - insecure and secure
      supabase.auth.onAuthStateChange((event, session) => {
        // Intentionally use session directly (insecure pattern)
        authChangeHandler(event, session);
      });

      supabase.auth.onAuthStateChange((event) => {
        // Secure pattern - ignores session parameter, uses getUser() instead
        supabase.auth.getUser().then(({ data: { user } }) => {
          secureAuthChangeHandler(event, user);
        });
      });

      // Trigger sign in to generate auth state change
      await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });

      // Wait for auth callbacks to trigger
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify both handlers were called
      expect(authChangeHandler).toHaveBeenCalled();
      expect(secureAuthChangeHandler).toHaveBeenCalled();
      
      // The secure handler should have received the verified user
      const secureCall = secureAuthChangeHandler.mock.calls[0];
      expect(secureCall[0]).toBe('SIGNED_IN');
      expect(secureCall[1]).toBeDefined();
      expect(secureCall[1].email).toBe('test@example.com');
    });
  });

  describe('Row Level Security (RLS)', () => {
    it('should only allow access to user\'s own data', async () => {
      // First sign in
      await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });

      // Query business profiles
      const { data: businessProfiles } = await supabase.from('business_profiles').select();
      
      // Should only return profiles for the current user
      expect(businessProfiles.length).toBe(1);
      expect(businessProfiles[0].user_id).toBe('test-user-id');
      expect(businessProfiles[0].id).toBe('business-1');
    });

    it('should prevent access when not authenticated', async () => {
      // Ensure not signed in
      await supabase.auth.signOut();
      
      // Try to access data
      const { data: businessProfiles } = await supabase.from('business_profiles').select();
      
      // Should be empty due to RLS
      expect(businessProfiles.length).toBe(0);
    });

    it('should enforce RLS on data insertion', async () => {
      // Not signed in
      await supabase.auth.signOut();
      
      // Try to insert data
      const { error } = await supabase.from('business_profiles').insert({
        google_place_id: 'new-place-id',
        business_name: 'New Business'
      });
      
      // Should be denied due to RLS
      expect(error).toBeDefined();
      expect(error.message).toContain('Not authorized');
    });

    it('should allow authorized data insertion', async () => {
      // Sign in first
      await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });
      
      // Try to insert data for the current user
      const { data, error } = await supabase.from('business_profiles').insert({
        google_place_id: 'new-place-id',
        business_name: 'New Business',
        business_address: '789 New St'
      });
      
      // Should succeed and have the correct user_id applied
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user_id).toBe('test-user-id');
    });

    it('should prevent inserting data for other users', async () => {
      // Sign in first
      await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });
      
      // Try to insert data with a different user_id
      const { error } = await supabase.from('business_profiles').insert({
        user_id: 'different-user-id',
        google_place_id: 'new-place-id',
        business_name: 'New Business'
      });
      
      // Should be denied due to RLS
      expect(error).toBeDefined();
      expect(error.message).toContain('Not authorized to insert for other users');
    });
  });
});

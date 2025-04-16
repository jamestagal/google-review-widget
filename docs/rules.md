# Supabase Integration Rules

## Database Schema Management

- Use Supabase for database queries and schema
- Before performing any database-related tasks, consult the database.types.ts file for existing database schema
- Always use migrations to update the database schema, create them using the command `npx supabase migration new <migration-name>`
- After creating a migration file, run `npx supabase migration up` to apply the migration and then run `npx supabase gen types typescript --local > src/types/database.types.ts` to update type definitions
- When creating a new table, it must have columns for `created_at` and `updated_at` and the values should be set automatically via triggers using `public.handle_created_at()` and `public.handle_updated_at()`
- Always ensure database schema matches code expectations, particularly checking for required fields like `subscription_tier` if referenced in code
- Include default values for non-nullable columns to prevent insertion errors
- Always maintain backwards compatibility when generating migrations
- Test migrations in a development environment before applying to production

## Row Level Security (RLS)

- Always enable Row Level Security (RLS) on newly created tables via `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;` in migration files
- Implement appropriate policies for each table based on access requirements
- Define at least these basic policies for each user-related table:
  ```sql
  -- Allow users to select their own data
  CREATE POLICY "Users can view own data" ON table_name
    FOR SELECT USING (auth.uid() = user_id);
    
  -- Allow users to insert their own data
  CREATE POLICY "Users can insert own data" ON table_name
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
  -- Allow users to update their own data
  CREATE POLICY "Users can update own data" ON table_name
    FOR UPDATE USING (auth.uid() = user_id);
    
  -- Allow users to delete their own data
  CREATE POLICY "Users can delete own data" ON table_name
    FOR DELETE USING (auth.uid() = user_id);
  ```
- Test RLS policies with both authenticated and anonymous requests to verify they work as expected

## Supabase Client Creation

- Always use `createServerClient()` from `@/utils/supabase/server` to create Supabase client in server components
- Always use `createBrowserClient()` from `@/utils/supabase/client` to create Supabase client in client components
- Implement hooks.server.ts to create a Supabase client for each request:
  ```typescript
  import { createServerClient } from '@supabase/ssr';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
  import type { Handle } from '@sveltejs/kit';

  export const handle: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        get: (key) => event.cookies.get(key),
        set: (key, value, options) => {
          event.cookies.set(key, value, { ...options, path: '/' });
        },
        remove: (key, options) => {
          event.cookies.delete(key, { ...options, path: '/' });
        }
      }
    });
    
    // Get user from session - use getUser for secure validation
    const { data: { session } } = await event.locals.supabase.auth.getSession();
    if (session) {
      const { data: { user } } = await event.locals.supabase.auth.getUser();
      if (user) event.locals.user = user;
    }
    
    return resolve(event);
  }
  ```
- Use a single instance of Supabase client on the browser side rather than creating multiple clients
- Avoid calling createClient directly in components; instead, import from centralized utility files

## Authentication and Session Management

- Use cookie-based authentication with Supabase in SvelteKit applications for server/client synchronization
- Always use `supabase.auth.getUser()` instead of just `getSession()` for server-side authentication verification
- Add an auth state listener in the root layout component to handle client-side auth changes:
  ```typescript
  onMount(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        invalidate('supabase:auth');
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  });
  ```
- Always verify authentication state before performing authenticated operations
- Use `event.locals.user` in server routes to check for authenticated users

## Environment Variables and Configuration

- Always prefix Supabase environment variables with `PUBLIC_` when they need to be accessible on the client side:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
- Keep non-public keys (like service role keys) as private environment variables without the `PUBLIC_` prefix
- Access public variables with `import { PUBLIC_SUPABASE_URL } from '$env/static/public'`
- Access private variables with `import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'`
- Never directly reference `process.env` in SvelteKit components or pages
- Use separate .env files for local vs production (.env.local, .env.production)

## Data Serialization and Error Handling

- When returning data from server functions (load functions, form actions, API endpoints):
  - Only return serializable data (plain objects, arrays, primitives)
  - Do not return class instances, Error objects, or Supabase client instances
  - Convert complex objects to simple data structures before returning
  - Use SvelteKit's `fail()` function for error responses in form actions
  - Extract error messages from Supabase error objects rather than returning the objects directly
- Implement comprehensive error handling, especially for database operations:
  ```typescript
  try {
    const { data, error } = await supabase.from('table').insert({ ... });
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Database error:', err);
    return { 
      success: false, 
      message: err.message || 'An unknown error occurred',
      code: err.code || 'UNKNOWN'
    };
  }
  ```
- Log database errors on the server side but only return sanitized error messages to clients

## Transaction-Based Operations

- Use transaction-based approaches for operations that modify multiple tables:
  ```typescript
  // Example of a transaction-based approach
  async function createWidgetWithTransaction(input) {
    // Create business profile
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .insert(input.businessProfile)
      .select()
      .single();
      
    if (profileError) {
      return { success: false, error: profileError.message, step: 'create_business_profile' };
    }
    
    // Create widget with reference to the profile
    const { data: widget, error: widgetError } = await supabase
      .from('widget_projects')
      .insert({
        ...input.widgetProject,
        business_profile_id: profile.id
      })
      .select()
      .single();
      
    if (widgetError) {
      // Clean up the created profile if widget creation fails
      await supabase.from('business_profiles').delete().eq('id', profile.id);
      return { success: false, error: widgetError.message, step: 'create_widget_project' };
    }
    
    return { success: true, data: { profile, widget } };
  }
  ```
- Implement proper cleanup for failed transactions to maintain data integrity
- Use try/catch blocks to handle errors within transactions

## Local Development

- When running Supabase locally:
  - Always start the local Supabase instance before running SvelteKit: `npx supabase start`
  - Verify the local instance is running: `npx supabase status`
  - Apply migrations to local instance before testing: `npx supabase db reset`
  - Make sure Docker is running if using local Supabase

## Testing

- Test authentication flows thoroughly, especially after making changes to hooks.server.ts
- Verify that RLS policies work correctly for authenticated and anonymous users
- Test database operations with both valid and invalid inputs to ensure proper error handling
- Test client-side and server-side authentication synchronization when logging in and out

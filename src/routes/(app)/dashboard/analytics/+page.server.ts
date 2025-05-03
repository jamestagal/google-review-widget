import { createServerClient } from '@supabase/ssr';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies }) => {
  try {
    // Create Supabase server client
    const supabase = createServerClient(
      PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: (key) => cookies.get(key),
          set: (key, value, options) => {
            cookies.set(key, value, { ...options, path: '/' });
          },
          remove: (key, options) => {
            cookies.delete(key, { ...options, path: '/' });
          }
        }
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw redirect(303, '/login');
    }

    // Fetch widgets for the current user
    const { data: widgets, error: widgetsError } = await supabase
      .from('widget_projects')
      .select('id, name')
      .eq('user_id', user.id);

    if (widgetsError) {
      console.error('Error fetching widgets:', widgetsError);
      throw error(500, 'Failed to fetch widgets');
    }

    return {
      widgets: widgets || []
    };
  } catch (err) {
    console.error('Error in analytics page load:', err);
    if (err instanceof Response) {
      throw err;
    }
    throw error(500, 'An unexpected error occurred');
  }
};

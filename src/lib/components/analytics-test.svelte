<script lang="ts">
  import { createServerClient } from '@supabase/ssr';
  import type { Database } from '../../types/database.types';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
  import { onMount } from 'svelte';
  
  // This is just a test component to verify our types work correctly
  
  // Example function to fetch widget analytics
  async function fetchWidgetAnalytics(widgetId: string) {
    const supabase = createServerClient<Database>(
      PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: (key) => document.cookie.split('; ').find(c => c.startsWith(`${key}=`))?.split('=')[1],
          set: (key, value, options) => {
            document.cookie = `${key}=${value}; path=/; max-age=${options?.maxAge ?? 0}`;
          },
          remove: (key, options) => {
            document.cookie = `${key}=; path=/; max-age=0`;
          }
        }
      }
    );
    
    try {
      // Test querying widget_projects with analytics fields
      const { data: widget, error } = await supabase
        .from('widget_projects')
        .select('id, name, analytics, api_usage, view_count, last_viewed_at')
        .eq('id', widgetId)
        .single();
      
      if (error) throw error;
      
      // Test querying api_calls table
      const { data: apiCalls, error: apiError } = await supabase
        .from('api_calls')
        .select('id, endpoint, created_at, response_code')
        .eq('widget_id', widgetId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (apiError) throw apiError;
      
      return { widget, apiCalls };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { widget: null, apiCalls: [] };
    }
  }
  
  let widgetId = '';
  let analyticsData: { widget: any, apiCalls: any[] } | null = null;
  let loading = false;
  let error = '';
  
  async function loadAnalytics() {
    if (!widgetId) {
      error = 'Please enter a widget ID';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      analyticsData = await fetchWidgetAnalytics(widgetId);
      if (!analyticsData.widget) {
        error = 'Widget not found';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
</script>

<div class="p-4">
  <h2 class="text-xl font-bold mb-4">Analytics Type Test</h2>
  
  <div class="mb-4">
    <label for="widgetId" class="block text-sm font-medium mb-1">Widget ID</label>
    <input 
      id="widgetId"
      type="text" 
      bind:value={widgetId} 
      class="w-full p-2 border rounded"
      placeholder="Enter widget ID"
    />
  </div>
  
  <button 
    on:click={loadAnalytics} 
    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    disabled={loading}
  >
    {loading ? 'Loading...' : 'Test Analytics Types'}
  </button>
  
  {#if error}
    <div class="mt-4 p-3 bg-red-100 text-red-800 rounded">
      {error}
    </div>
  {/if}
  
  {#if analyticsData?.widget}
    <div class="mt-4 p-4 border rounded">
      <h3 class="font-bold">Widget Data:</h3>
      <pre class="mt-2 p-2 bg-gray-100 rounded overflow-auto">
        {JSON.stringify(analyticsData.widget, null, 2)}
      </pre>
      
      <h3 class="font-bold mt-4">Recent API Calls:</h3>
      {#if analyticsData.apiCalls.length > 0}
        <pre class="mt-2 p-2 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(analyticsData.apiCalls, null, 2)}
        </pre>
      {:else}
        <p class="mt-2 text-gray-500">No API calls found</p>
      {/if}
    </div>
  {/if}
</div>

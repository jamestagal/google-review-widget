/**
 * Supabase client utilities for Cloudflare Workers
 * 
 * This module provides functions to interact with Supabase from Cloudflare Workers
 * without the full @supabase/supabase-js dependency that's not compatible with Workers.
 */

/**
 * Creates a lightweight Supabase client specifically for Cloudflare Workers
 * @param {Object} env - Environment variables containing Supabase credentials
 * @returns {Object} A simple Supabase client with essential methods
 */
export function createSupabaseClient(env) {
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials in environment variables');
        return null;
    }
    
    /**
     * Executes a query against the Supabase REST API
     * @param {string} table - Table name to query
     * @param {Object} queryParams - Query parameters (filter, select, etc)
     * @returns {Promise<Object>} Query results
     */
    async function query(table, queryParams = {}) {
        try {
            const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
            
            // Add query parameters
            Object.entries(queryParams).forEach(([key, value]) => {
                if (key !== 'headers' && value !== undefined) {
                    url.searchParams.append(key, value);
                }
            });
            
            const headers = {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                ...queryParams.headers
            };
            
            const response = await fetch(url.toString(), { headers });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Supabase query error (${response.status}): ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Supabase query error:', error);
            throw error;
        }
    }
    
    /**
     * Get a single row by ID or exact match
     * @param {string} table - Table name
     * @param {string|Object} match - ID or filter object
     * @returns {Promise<Object>} Found record or null
     */
    async function getOne(table, match) {
        try {
            const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
            
            const headers = {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=representation'
            };
            
            // If match is a string, assume it's an ID
            if (typeof match === 'string') {
                url.searchParams.append('id', `eq.${match}`);
            } else {
                // Otherwise it's a filter object
                Object.entries(match).forEach(([key, value]) => {
                    url.searchParams.append(key, `eq.${value}`);
                });
            }
            
            // Limit to 1 result
            url.searchParams.append('limit', '1');
            
            const response = await fetch(url.toString(), { headers });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Supabase getOne error (${response.status}): ${errorText}`);
            }
            
            const results = await response.json();
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Supabase getOne error:', error);
            throw error;
        }
    }
    
    return {
        query,
        getOne,
        from: (table) => ({
            select: (columns = '*') => query(table, { select: columns }),
            getOne: (match) => getOne(table, match),
            eq: (column, value) => query(table, { [column]: `eq.${value}` })
        })
    };
}

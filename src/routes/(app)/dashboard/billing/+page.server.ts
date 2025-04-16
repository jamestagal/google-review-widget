import { fetchSortedProducts, fetchCurrentUsersSubscription } from '$lib/stripe/client-helpers';
import type { PageServerLoad } from './$types';

/**
 * Billing page server load function
 * Following Supabase integration rules for secure authentication
 */
export const load: PageServerLoad = async ({ locals }) => {
    // Get authenticated user using the secure safeGetSession helper
    // This uses getUser() internally instead of getSession() for security
    const { user } = await locals.safeGetSession();
    
    // If there's no authenticated user, the parent layout will handle redirection
    
    try {
        // Use the Stripe client from locals
        const stripe = locals.stripe;
        const supabaseServiceRole = locals.supabaseServiceRole;
        
        // Fetch sorted products from Stripe
        const products = await fetchSortedProducts(stripe);
        
        let currentSubscriptions = [];
        
        // Only fetch subscription data if user is authenticated
        if (user) {
            // Get user's Stripe customer ID from Supabase
            const { data: stripeCustomer, error } = await supabaseServiceRole
                .from('stripe_customers')
                .select('stripe_customer_id')
                .eq('user_id', user.id)
                .limit(1)
                .maybeSingle();
            
            if (error) {
                console.error('Error fetching stripe customer:', error);
            } else if (stripeCustomer?.stripe_customer_id) {
                // Fetch current user's subscriptions
                currentSubscriptions = await fetchCurrentUsersSubscription(
                    stripe, 
                    stripeCustomer.stripe_customer_id
                );
            }
        }
        
        return {
            products,
            currentSubscriptions
        };
    } catch (error) {
        console.error('Error in billing page load:', error);
        
        // Return empty data on error
        return {
            products: [],
            currentSubscriptions: []
        };
    }
};

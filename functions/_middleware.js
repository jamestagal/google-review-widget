/**
 * Middleware for all Cloudflare Functions
 * This middleware runs before any function executes
 */
export async function onRequest(context) {
    // Extract request and env from context
    const { request, env, next } = context;
    
    // Add custom headers to all responses if needed
    const response = await next();
    
    // You could add security headers, caching policies, etc.
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
}

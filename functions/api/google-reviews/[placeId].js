/**
 * Google Reviews API Endpoint
 *
 * Fetches reviews for a specific place ID from Google Places API
 * with tier-based caching support via KV storage
 *
 * Route: /api/google-reviews/[placeId]
 */

// Cache duration in seconds based on subscription tier
const CACHE_DURATIONS = {
	FREE: 60 * 60 * 24, // 24 hours
	BASIC: 60 * 60 * 12, // 12 hours
	PRO: 60 * 60 * 6, // 6 hours
	PREMIUM: 60 * 60 * 3, // 3 hours
};

// Default rate limits per minute
const RATE_LIMITS = {
	FREE: 10, // 10 requests per minute
	BASIC: 30, // 30 requests per minute
	PRO: 60, // 60 requests per minute
	PREMIUM: 100, // 100 requests per minute
};

/**
 * Update the subscription usage statistics in Supabase
 * @param {string} apiKey - The widget API key
 * @param {Object} env - Environment variables
 * @returns {Promise<void>}
 */
async function updateSubscriptionUsage(apiKey, env) {
	if (!apiKey || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
		return;
	}

	try {
		const supabase = createSupabaseClient(env);
		if (!supabase) return;

		// First get the API key record to get the ID
		const apiKeyRecord = await supabase
			.from('widget_api_keys')
			.getOne({ api_key: apiKey });
		if (!apiKeyRecord) return;

		// Get today's date in ISO format (YYYY-MM-DD)
		const today = new Date().toISOString().split('T')[0];

		// Try to update an existing record for today
		const updateResult = await fetch(
			`${env.SUPABASE_URL}/rest/v1/widget_usage_stats`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					apikey: env.SUPABASE_SERVICE_ROLE_KEY,
					Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
					Prefer: 'resolution=merge-duplicates',
				},
				body: JSON.stringify({
					api_key_id: apiKeyRecord.id,
					date: today,
					requests_count: 1, // Increment by 1 for this request
					// We'll upsert, so these will be set on insert but preserved on update
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				}),
			},
		);

		if (!updateResult.ok) {
			console.error(
				'Failed to update usage stats: ',
				await updateResult.text(),
			);
			return;
		}

		// Now update the count using a PATCH request
		const incrementResult = await fetch(
			`${env.SUPABASE_URL}/rest/v1/widget_usage_stats?api_key_id=eq.${apiKeyRecord.id}&date=eq.${today}`,
			{
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					apikey: env.SUPABASE_SERVICE_ROLE_KEY,
					Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
					Prefer: 'return=minimal',
				},
				body: JSON.stringify({
					requests_count: await computeIncrementExpression('requests_count'),
					updated_at: new Date().toISOString(),
				}),
			},
		);

		if (!incrementResult.ok) {
			console.error(
				'Failed to increment usage count: ',
				await incrementResult.text(),
			);
		}
	} catch (error) {
		console.error('Error updating subscription usage:', error);
	}
}

/**
 * Helper to create a Postgres increment expression
 * @param {string} column - The column to increment
 * @returns {string} - Postgres expression for incrementing
 */
async function computeIncrementExpression(column) {
	return `${column} + 1`;
}

export default {
	async fetch(request, env) {
		// Set up response headers
		const headers = {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=3600', // 1 hour browser cache
			'Access-Control-Allow-Origin': '*', // CORS support for widget embedding
		};

		try {
			// Parse the URL to get the place ID
			const url = new URL(request.url);
			const pathParts = url.pathname.split('/');
			const placeId = pathParts[pathParts.length - 1];

			// Check if we have a valid place ID
			if (!placeId || placeId === 'google-reviews') {
				return new Response(
					JSON.stringify({
						status: 'error',
						message: 'Missing or invalid place ID',
					}),
					{
						status: 400,
						headers,
					},
				);
			}

			// Check for test mode header
			const isTestMode = request.headers.get('X-Test-Mode') === 'true';

			// Get widget API key from request (if available)
			const widgetApiKey =
				request.headers.get('X-Widget-API-Key') ||
				url.searchParams.get('api_key');

			// Determine subscription tier and apply appropriate settings
			const subscriptionData = await determineSubscriptionTier(
				widgetApiKey,
				env,
			);
			const cacheDuration = subscriptionData.cacheDuration;
			const rateLimit = subscriptionData.rateLimit;
			const tier = subscriptionData.tier;

			// Check if API key is active
			if (widgetApiKey && subscriptionData.isActive === false) {
				return new Response(
					JSON.stringify({
						status: 'error',
						message: 'API key is inactive or has been revoked.',
					}),
					{
						status: 403,
						headers,
					},
				);
			}

			// Check domain restrictions if applicable
			const referer = request.headers.get('Referer');
			if (
				widgetApiKey &&
				referer &&
				subscriptionData.allowedDomains &&
				!subscriptionData.allowedDomains.includes('*')
			) {
				const refererUrl = new URL(referer);
				const refererDomain = refererUrl.hostname;
				const domainAllowed = subscriptionData.allowedDomains.some((domain) => {
					return (
						refererDomain === domain ||
						(domain.startsWith('*.') &&
							refererDomain.endsWith(domain.substring(1)))
					);
				});

				if (!domainAllowed) {
					return new Response(
						JSON.stringify({
							status: 'error',
							message: `This API key is not authorized for use on ${refererDomain}`,
						}),
						{
							status: 403,
							headers,
						},
					);
				}
			}

			// Apply rate limiting based on the subscription tier
			if (
				!isTestMode &&
				!(await checkRateLimit(widgetApiKey || placeId, rateLimit, env))
			) {
				return new Response(
					JSON.stringify({
						status: 'error',
						message: 'Rate limit exceeded. Please try again later.',
					}),
					{
						status: 429,
						headers: {
							...headers,
							'Retry-After': '60', // Try again after 60 seconds
						},
					},
				);
			}

			// Handle POST requests (used for setting up mock data in tests)
			if (request.method === 'POST') {
				return handlePostRequest(request, env, placeId, isTestMode, headers);
			}

			// Check if we have cached data for this place ID
			const cacheKey = `reviews:${placeId}:${widgetApiKey || 'default'}`;
			let reviewsData;

			if (env.REVIEWS_KV) {
				try {
					reviewsData = await env.REVIEWS_KV.get(cacheKey, { type: 'json' });
				} catch (kvError) {
					console.error('KV read error:', kvError);
				}

				// If we have cached data that's still valid, return it
				if (reviewsData && reviewsData.fetchedAt) {
					const cacheAge =
						(Date.now() - new Date(reviewsData.fetchedAt).getTime()) / 1000;

					if (cacheAge < cacheDuration) {
						return new Response(
							JSON.stringify({
								status: 'success',
								fromCache: true,
								data: reviewsData,
								cacheAge: Math.round(cacheAge),
								subscriptionTier: tier,
								cacheDuration,
								maxReviews: subscriptionData.maxReviews,
							}),
							{
								status: 200,
								headers,
							},
						);
					}
				}
			}

			// If in test mode, return mock data
			if (isTestMode) {
				return handleTestModeRequest(
					placeId,
					tier,
					headers,
					subscriptionData.maxReviews,
				);
			}

			// No valid cache, fetch from Google Places API
			const apiKey = env.GOOGLE_PLACES_API_KEY;

			if (!apiKey) {
				return new Response(
					JSON.stringify({
						status: 'error',
						message: 'Google Places API key not configured',
					}),
					{
						status: 500,
						headers,
					},
				);
			}

			// Fetch the reviews from Google Places API
			const googleData = await fetchFromGooglePlacesAPI(placeId, apiKey);

			// Cache the results if KV is available
			if (env.REVIEWS_KV) {
				try {
					await env.REVIEWS_KV.put(cacheKey, JSON.stringify(googleData));

					// Also update the analytics for this widget if we have an API key
					if (widgetApiKey) {
						await updateWidgetAnalytics(widgetApiKey, placeId, env);
					}
				} catch (kvError) {
					console.error('KV write error:', kvError);
				}
			}

			// Return the results
			return new Response(
				JSON.stringify({
					status: 'success',
					fromCache: false,
					data: googleData,
					subscriptionTier: tier,
					cacheDuration,
					maxReviews: subscriptionData.maxReviews,
				}),
				{
					status: 200,
					headers,
				},
			);
		} catch (error) {
			console.error('Google Reviews API error:', error);

			return new Response(
				JSON.stringify({
					status: 'error',
					message: error.message || 'An error occurred fetching reviews',
				}),
				{
					status: 500,
					headers,
				},
			);
		}
	},
};

import { createSupabaseClient } from '../../lib/supabase.js';

/**
 * Determine the subscription tier based on the widget API key
 * @param {string} apiKey - The widget API key
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>} - The subscription details including tier, rate limits, etc.
 */
async function determineSubscriptionTier(apiKey, env) {
	if (!apiKey) {
		return {
			tier: 'FREE',
			rateLimit: RATE_LIMITS.FREE,
			cacheDuration: CACHE_DURATIONS.FREE,
			maxReviews: 3,
			isActive: true,
		};
	}

	try {
		// Cache key for storing subscription tier
		const tierKey = `tier:${apiKey}`;

		// Check if we have the tier cached in KV
		if (env.REVIEWS_KV) {
			try {
				const cachedTier = await env.REVIEWS_KV.get(tierKey, { type: 'json' });

				if (cachedTier) {
					console.log('Using cached subscription tier data');
					return cachedTier;
				}
			} catch (cacheError) {
				console.error('Error reading from KV cache:', cacheError);
				// Continue with other methods
			}
		}

		// Try to fetch subscription data from Supabase
		let subscriptionData;

		// Only attempt Supabase connection if credentials are provided
		if (
			env.SUPABASE_URL &&
			(env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY)
		) {
			try {
				const supabase = createSupabaseClient(env);

				if (supabase) {
					// Query the widget_api_keys table for this API key
					const result = await supabase
						.from('widget_api_keys')
						.getOne({ api_key: apiKey });

					if (result) {
						// Found a valid subscription in the database
						subscriptionData = {
							tier: result.subscription_tier,
							rateLimit: result.rate_limit,
							cacheDuration: result.cache_duration,
							maxReviews: result.max_reviews,
							isActive: result.is_active,
							allowedDomains: result.allowed_domains,
							customSettings: result.custom_settings || {},
						};

						// Store in KV cache for 5 minutes to reduce Supabase load
						if (env.REVIEWS_KV) {
							try {
								await env.REVIEWS_KV.put(
									tierKey,
									JSON.stringify(subscriptionData),
									{
										expirationTtl: 300, // 5 minutes cache for subscription data
									},
								);
							} catch (kvError) {
								console.error('Error writing to KV cache:', kvError);
							}
						}

						// Update usage stats asynchronously
						updateSubscriptionUsage(apiKey, env).catch((err) => {
							console.error('Error updating subscription usage stats:', err);
						});

						return subscriptionData;
					}
				}
			} catch (dbError) {
				console.error('Supabase query error:', dbError);
				// Continue to fallback methods
			}
		}

		// Fallback to pattern-based approach if Supabase query fails or isn't configured
		let tier = 'FREE';

		// Check the API key format to determine tier
		if (apiKey.startsWith('grw_premium_')) {
			tier = 'PREMIUM';
		} else if (apiKey.startsWith('grw_pro_')) {
			tier = 'PRO';
		} else if (apiKey.startsWith('grw_basic_')) {
			tier = 'BASIC';
		} else if (apiKey === 'grw_premium_test_key') {
			tier = 'PREMIUM';
		} else if (apiKey === 'grw_pro_test_key') {
			tier = 'PRO';
		} else if (apiKey === 'grw_basic_test_key') {
			tier = 'BASIC';
		}

		// Use the pattern-based tier to determine settings
		subscriptionData = {
			tier,
			rateLimit: RATE_LIMITS[tier] || RATE_LIMITS.FREE,
			cacheDuration: CACHE_DURATIONS[tier] || CACHE_DURATIONS.FREE,
			maxReviews:
				tier === 'PREMIUM' ? 10 : tier === 'PRO' ? 7 : tier === 'BASIC' ? 5 : 3,
			isActive: true,
			allowedDomains: ['*'],
		};

		// Cache this result too
		if (env.REVIEWS_KV) {
			try {
				await env.REVIEWS_KV.put(tierKey, JSON.stringify(subscriptionData), {
					expirationTtl: 300, // 5 minutes
				});
			} catch (kvError) {
				console.error('Error writing to KV cache:', kvError);
			}
		}

		return subscriptionData;
	} catch (error) {
		console.error('Error determining subscription tier:', error);
		// Return default FREE tier settings on error
		return {
			tier: 'FREE',
			rateLimit: RATE_LIMITS.FREE,
			cacheDuration: CACHE_DURATIONS.FREE,
			maxReviews: 3,
			isActive: true,
			allowedDomains: ['*'],
		};
	}
}
/**
 * Check rate limit for a specific identifier (API key or Place ID)
 * @param {string} identifier - The identifier to rate limit on
 * @param {number} limit - The rate limit per minute
 * @param {Object} env - Environment variables
 * @returns {Promise<boolean>} - Whether the request is within rate limits
 */
async function checkRateLimit(identifier, limit, env) {
	if (!env.REVIEWS_KV) {
		return true; // If KV is not available, don't rate limit
	}

	try {
		const rateLimitKey = `rate:${identifier}`;
		const now = Date.now();
		const minuteWindow = Math.floor(now / 60000);

		// Get current usage in this minute window
		const usageKey = `${rateLimitKey}:${minuteWindow}`;
		let usage = await env.REVIEWS_KV.get(usageKey);

		if (!usage) {
			usage = 0;
		} else {
			usage = parseInt(usage, 10);
		}

		// Check if we're over the limit
		if (usage >= limit) {
			return false;
		}

		// Increment the usage counter
		await env.REVIEWS_KV.put(usageKey, (usage + 1).toString(), {
			expirationTtl: 120,
		}); // Keep for 2 minutes

		return true;
	} catch (error) {
		console.error('Rate limiting error:', error);
		return true; // On error, allow the request
	}
}

/**
 * Update analytics for a widget
 * @param {string} widgetApiKey - The widget API key
 * @param {string} placeId - The place ID
 * @param {Object} env - Environment variables
 * @returns {Promise<void>}
 */
async function updateWidgetAnalytics(widgetApiKey, placeId, env) {
	if (!env.REVIEWS_KV) {
		return;
	}

	try {
		const date = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
		const analyticsKey = `analytics:${widgetApiKey}:${date}`;

		// Get current analytics data
		let analytics = await env.REVIEWS_KV.get(analyticsKey, { type: 'json' });

		if (!analytics) {
			analytics = {
				views: 0,
				uniqueIPs: new Set(),
				placeIds: {},
			};
		}

		// Update the analytics
		analytics.views++;

		// Track views per place ID
		if (!analytics.placeIds[placeId]) {
			analytics.placeIds[placeId] = 0;
		}
		analytics.placeIds[placeId]++;

		// Store the updated analytics
		await env.REVIEWS_KV.put(analyticsKey, JSON.stringify(analytics), {
			expirationTtl: 60 * 60 * 24 * 31,
		}); // Keep for 31 days
	} catch (error) {
		console.error('Analytics update error:', error);
	}
}

/**
 * Handles POST requests (used for testing or manual cache updates)
 * @param {Request} request - The original request
 * @param {Object} env - Environment variables
 * @param {string} placeId - The Google Place ID
 * @param {boolean} isTestMode - Whether test mode is enabled
 * @param {Object} headers - Response headers
 * @returns {Response} - Response
 */
async function handlePostRequest(request, env, placeId, isTestMode, headers) {
	try {
		// Parse the body
		const body = await request.json();

		// If test mode is enabled and we have mock data, store it
		if (isTestMode && body.mockData) {
			const mockData = body.mockData;

			// Ensure the place ID matches
			mockData.placeId = placeId;

			// Set the fetched time if not provided
			if (!mockData.fetchedAt) {
				mockData.fetchedAt = new Date().toISOString();
			}

			// Store in KV if available
			if (env.REVIEWS_KV) {
				const cacheKey = `reviews:${placeId}`;
				await env.REVIEWS_KV.put(cacheKey, JSON.stringify(mockData));
			}

			return new Response(
				JSON.stringify({
					status: 'success',
					message: 'Mock data stored',
					data: mockData,
				}),
				{
					status: 200,
					headers,
				},
			);
		}

		// For non-test mode POST requests, we could implement other functionality here
		// such as manual cache updates or invalidation

		return new Response(
			JSON.stringify({
				status: 'error',
				message: 'Invalid POST request',
			}),
			{
				status: 400,
				headers,
			},
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				status: 'error',
				message: 'Failed to parse request body: ' + error.message,
			}),
			{
				status: 400,
				headers,
			},
		);
	}
}

/**
 * Handles requests when in test mode
 * @param {string} placeId - The Google Place ID
 * @param {string} subscriptionTier - The subscription tier
 * @param {Object} headers - Response headers
 * @param {number} maxReviews - Maximum number of reviews to return
 * @returns {Response} - Mock response for testing
 */
function handleTestModeRequest(
	placeId,
	subscriptionTier,
	headers,
	maxReviews = 3,
) {
	// Create mock data for testing - more reviews for higher tiers
	let reviews = [];

	// Create base reviews
	const baseReviews = [
		{
			authorName: 'Test User 1',
			rating: 5,
			text: 'This is a test review with 5 stars. Great service!',
			time: Date.now() - 7 * 24 * 60 * 60 * 1000, // 1 week ago
		},
		{
			authorName: 'Test User 2',
			rating: 4,
			text: 'This is a test review with 4 stars. Good experience.',
			time: Date.now() - 14 * 24 * 60 * 60 * 1000, // 2 weeks ago
		},
		{
			authorName: 'Test User 3',
			rating: 3,
			text: 'This is a test review with 3 stars. Average service.',
			time: Date.now() - 30 * 24 * 60 * 60 * 1000, // 1 month ago
		},
	];

	// Start with base reviews
	reviews = [...baseReviews];

	// Add reviews based on tier and maxReviews
	// We'll create enough reviews to populate up to maxReviews
	if (maxReviews > 3) {
		reviews.push(
			{
				authorName: 'Test User 4',
				rating: 5,
				text: 'Another 5-star review for higher tier testing.',
				time: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
			},
			{
				authorName: 'Test User 5',
				rating: 4,
				text: 'Another 4-star review for higher tier testing.',
				time: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
			},
		);
	}

	// Add more reviews if maxReviews is higher than 5
	if (maxReviews > 5) {
		reviews.push(
			{
				authorName: 'Test User 6',
				rating: 5,
				text: 'PRO tier review with 5 stars.',
				time: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
			},
			{
				authorName: 'Test User 7',
				rating: 3,
				text: 'PRO tier review with 3 stars.',
				time: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
			},
		);
	}

	// Add even more reviews if maxReviews is higher than 7
	if (maxReviews > 7) {
		reviews.push(
			{
				authorName: 'Test User 8',
				rating: 5,
				text: 'Premium tier review with 5 stars.',
				time: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
			},
			{
				authorName: 'Test User 9',
				rating: 4,
				text: 'Premium tier review with 4 stars.',
				time: Date.now() - 25 * 24 * 60 * 60 * 1000, // 25 days ago
			},
			{
				authorName: 'Test User 10',
				rating: 5,
				text: 'Another premium tier review with 5 stars.',
				time: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
			},
		);
	}

	// Limit the number of reviews to maxReviews
	reviews = reviews.slice(0, maxReviews);

	// Calculate average rating
	const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
	const averageRating = totalRating / reviews.length;

	const mockData = {
		placeId: placeId,
		businessName: `Test Business (${subscriptionTier})`,
		rating: averageRating.toFixed(1),
		totalReviews: reviews.length,
		reviews: reviews,
		fetchedAt: new Date().toISOString(),
	};

	return new Response(
		JSON.stringify({
			status: 'success',
			fromCache: false,
			data: mockData,
			subscriptionTier,
			cacheDuration: CACHE_DURATIONS[subscriptionTier] || CACHE_DURATIONS.FREE,
			maxReviews,
		}),
		{
			status: 200,
			headers,
		},
	);
}

/**
 * Fetches reviews data from Google Places API
 * @param {string} placeId - The Google Place ID
 * @param {string} apiKey - Google Places API key
 * @returns {Promise<Object>} - Google Places data
 */
async function fetchFromGooglePlacesAPI(placeId, apiKey) {
	// Construct the Google Places API URL
	const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`;

	// Add rate limiting and retry logic
	const maxRetries = 3;
	let retries = 0;
	let response;

	while (retries < maxRetries) {
		try {
			response = await fetch(apiUrl);
			break;
		} catch (error) {
			retries++;

			if (retries >= maxRetries) {
				throw new Error(
					`Failed to fetch from Google Places API after ${maxRetries} attempts: ${error.message}`,
				);
			}

			// Exponential backoff: 1s, 2s, 4s, etc.
			await new Promise((resolve) =>
				setTimeout(resolve, 1000 * Math.pow(2, retries - 1)),
			);
		}
	}

	if (!response.ok) {
		throw new Error(`Google Places API returned status ${response.status}`);
	}

	const data = await response.json();

	if (data.status !== 'OK') {
		throw new Error(`Google Places API error: ${data.status}`);
	}

	// Extract and transform the relevant data
	return {
		placeId: placeId,
		businessName: data.result.name || 'Unknown',
		rating: data.result.rating || 0,
		totalReviews: data.result.user_ratings_total || 0,
		reviews: (data.result.reviews || []).map((review) => ({
			authorName: review.author_name,
			rating: review.rating,
			text: review.text,
			time: review.time * 1000, // Convert to milliseconds
		})),
		fetchedAt: new Date().toISOString(),
	};
}

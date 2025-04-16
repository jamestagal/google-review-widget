/**
 * KV Test Endpoint
 *
 * Provides KV testing functionality with proper export format
 */

export default {
	async fetch(request, env, ctx) {
		// Set up response headers
		const headers = {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
		};

		try {
			// Default test values
			let testKey = 'test:hello';
			let testValue = 'world';

			// Check if this is a POST request with custom values
			if (request.method === 'POST') {
				try {
					// Clone the request before reading the body
					const clonedRequest = request.clone();

					// Parse the request body
					const body = await clonedRequest.json();

					// Use custom key/value if provided
					if (body && typeof body === 'object') {
						if (body.key) {
							testKey = String(body.key);
						}

						if (body.value !== undefined) {
							testValue = String(body.value);
						}
					}
				} catch (parseError) {
					console.error('Error parsing request body:', parseError);
					// Return a specific error for parsing issues
					return new Response(
						JSON.stringify({
							status: 'error',
							message: 'Failed to parse request body: ' + parseError.message,
							timestamp: new Date().toISOString(),
						}),
						{
							headers,
							status: 400, // Bad request
						},
					);
				}
			}

			let readValue;
			let kvAvailable = false;
			let kvError = null;

			// Try to use KV if available
			try {
				if (env.REVIEWS_KV) {
					kvAvailable = true;

					// Write the test value to KV
					await env.REVIEWS_KV.put(testKey, testValue);

					// Read the value back from KV
					readValue = await env.REVIEWS_KV.get(testKey);
				} else {
					kvError = 'KV binding not available';
				}
			} catch (error) {
				console.error('KV operation failed:', error);
				kvError = error.message || 'Unknown KV error';
				// Continue with the mock data approach
			}

			// Check if the value matches what we expect
			const match = readValue === testValue;

			// If KV is not available or had an error, use the test value
			if (!readValue) {
				readValue = testValue;
			}

			// Return the results
			return new Response(
				JSON.stringify({
					status: 'success',
					operation: 'KV read/write test',
					key: testKey,
					writtenValue: testValue,
					readValue: readValue,
					match: match,
					kvAvailable: kvAvailable,
					kvError: kvError,
					timestamp: new Date().toISOString(),
				}),
				{
					headers,
					status: 200,
				},
			);
		} catch (error) {
			console.error('KV test error:', error);

			return new Response(
				JSON.stringify({
					status: 'error',
					message: error.message || 'An error occurred with KV operations',
					operation: 'KV read/write test',
					stack: error.stack,
					timestamp: new Date().toISOString(),
				}),
				{
					headers,
					status: 500,
				},
			);
		}
	},
};

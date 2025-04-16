/**
 * Server Hooks Integration Tests
 *
 * Tests the server-side authentication logic in hooks.server.ts
 * to ensure it follows secure authentication patterns with Supabase
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock $env modules
vi.mock('$env/static/public', () => ({
	PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
	PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
}));

vi.mock('$env/static/private', () => ({
	PRIVATE_SUPABASE_SERVICE_ROLE: 'service-role-key',
	PRIVATE_STRIPE_SECRET_KEY: 'stripe-test-key',
}));

/**
 * Mock SvelteKit event object
 */
class MockEvent {
	constructor() {
		this.locals = {};
		this.cookies = {
			get: vi.fn((key) => {
				// Return mock cookies for auth
				if (key === 'sb-access-token') return 'mock-access-token';
				if (key === 'sb-refresh-token') return 'mock-refresh-token';
				return null;
			}),
			set: vi.fn(),
			delete: vi.fn(),
		};
		this.url = new URL('https://example.com/test');
	}
}

/**
 * Mock Supabase client responses
 */
const mockUser = {
	id: 'test-user-id',
	email: 'test@example.com',
	user_metadata: { name: 'Test User' },
};

const mockSession = {
	access_token: 'mock-access-token',
	refresh_token: 'mock-refresh-token',
	expires_in: 3600,
	expires_at: Math.floor(Date.now() / 1000) + 3600,
	user: mockUser,
};

/**
 * Mock Supabase client
 */
const createMockSupabaseClient = ({ withSession = true, withUser = true }) => {
	return {
		auth: {
			getSession: vi.fn().mockResolvedValue({
				data: { session: withSession ? mockSession : null },
				error: null,
			}),
			getUser: vi.fn().mockResolvedValue({
				data: { user: withUser ? mockUser : null },
				error: null,
			}),
		},
	};
};

// Mock @supabase/ssr createServerClient
vi.mock('@supabase/ssr', () => ({
	createServerClient: vi.fn((url, key, options) => {
		// Capture the cookie functions for testing
		const cookieFunctions = options?.cookies || {};

		return createMockSupabaseClient({
			withSession: true,
			withUser: true,
		});
	}),
}));

// Create a more comprehensive Stripe mock factory
const createStripeMock = () => {
	return {
		customers: {
			create: vi.fn().mockResolvedValue({ id: 'cus_mock123' }),
			retrieve: vi.fn().mockResolvedValue({
				id: 'cus_mock123',
				email: 'test@example.com',
				name: 'Test User',
				metadata: {},
			}),
			update: vi.fn().mockResolvedValue({ id: 'cus_mock123' }),
		},
		subscriptions: {
			create: vi.fn().mockResolvedValue({
				id: 'sub_mock123',
				status: 'active',
				current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
			}),
			retrieve: vi.fn().mockResolvedValue({
				id: 'sub_mock123',
				status: 'active',
			}),
			update: vi.fn().mockResolvedValue({ id: 'sub_mock123' }),
		},
		checkout: {
			sessions: {
				create: vi.fn().mockResolvedValue({
					id: 'cs_mock123',
					url: 'https://checkout.stripe.com/mock-session',
				}),
			},
		},
		webhooks: {
			constructEvent: vi.fn().mockReturnValue({
				type: 'checkout.session.completed',
				data: { object: { customer: 'cus_mock123' } },
			}),
		},
	};
};

// Mock the Stripe module
vi.mock('stripe', () => ({
	default: vi.fn().mockImplementation(() => createStripeMock()),
}));

// Import the mocked modules
import { createServerClient } from '@supabase/ssr';
import Stripe from 'stripe';

// Mock SvelteKit resolve function
const mockResolve = vi.fn().mockImplementation((event) => {
	return { status: 200, body: 'Response' };
});

describe('Server Hooks Authentication', () => {
	let event;

	beforeEach(() => {
		event = new MockEvent();
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// Import handle function dynamically to ensure mocks are set up first
	async function importHandle() {
		const { handle } = await import('../hooks.server');
		return handle;
	}

	it('should initialize Supabase client with proper cookie handling', async () => {
		const handle = await importHandle();

		// Call the handle function
		await handle({ event, resolve: mockResolve });

		// Verify createServerClient was called with correct parameters
		expect(createServerClient).toHaveBeenCalledWith(
			'https://example.supabase.co',
			'public-anon-key',
			expect.objectContaining({
				cookies: expect.objectContaining({
					get: expect.any(Function),
					set: expect.any(Function),
					remove: expect.any(Function),
				}),
			}),
		);

		// Verify cookie functions were linked to event.cookies
		const cookieOptions = createServerClient.mock.calls[0][2];
		cookieOptions.cookies.get('test-key');
		expect(event.cookies.get).toHaveBeenCalledWith('test-key');

		cookieOptions.cookies.set('test-key', 'test-value', { maxAge: 3600 });
		expect(event.cookies.set).toHaveBeenCalledWith(
			'test-key',
			'test-value',
			expect.objectContaining({ maxAge: 3600, path: '/' }),
		);

		cookieOptions.cookies.remove('test-key', {});
		expect(event.cookies.delete).toHaveBeenCalledWith(
			'test-key',
			expect.objectContaining({ path: '/' }),
		);
	});

	it('should use getUser() for secure user verification', async () => {
		const handle = await importHandle();
		const mockSupabase = createMockSupabaseClient({
			withSession: true,
			withUser: true,
		});

		// Override the createServerClient mock for this test
		createServerClient.mockReturnValueOnce(mockSupabase);

		// Call the handle function
		await handle({ event, resolve: mockResolve });

		// Verify getSession is called first (as required by Supabase)
		expect(mockSupabase.auth.getSession).toHaveBeenCalled();

		// Crucial test: verify getUser is called for secure verification
		expect(mockSupabase.auth.getUser).toHaveBeenCalled();

		// Verify user is set in event.locals if authenticated
		expect(event.locals.user).toEqual(mockUser);
	});

	it('should not set locals.user when user is not authenticated', async () => {
		const handle = await importHandle();
		const mockSupabase = createMockSupabaseClient({
			withSession: false,
			withUser: false,
		});

		// Override the createServerClient mock for this test
		createServerClient.mockReturnValueOnce(mockSupabase);

		// Call the handle function
		await handle({ event, resolve: mockResolve });

		// Verify getSession is still called
		expect(mockSupabase.auth.getSession).toHaveBeenCalled();

		// User shouldn't be in locals
		expect(event.locals.user).toBeUndefined();
	});

	it('should always set supabase client in event.locals', async () => {
		const handle = await importHandle();
		const mockSupabase = createMockSupabaseClient({
			withSession: false,
			withUser: false,
		});

		// Override the createServerClient mock for this test
		createServerClient.mockReturnValueOnce(mockSupabase);

		// Call the handle function
		await handle({ event, resolve: mockResolve });

		// Verify supabase client is always set, even without auth
		expect(event.locals.supabase).toBeDefined();
	});
});

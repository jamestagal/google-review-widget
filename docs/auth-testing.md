# Authentication Testing Strategy

This document outlines the testing approach for the Supabase authentication integration in the Google Review Widget application.

## Testing Philosophy

Our authentication testing is built around validating the secure authentication patterns recommended in Supabase documentation:

1. Always using `getUser()` over `getSession()` for secure user verification
2. Properly handling auth state changes with valid verification methods
3. Enforcing Row Level Security (RLS) policies to protect data
4. Secure environment variable management

## Test Suite Structure

The authentication tests are organized across several test files:

### 1. Authentication Integration Tests (`auth-integration.test.js`)

These tests focus on core authentication flows and Row Level Security:

- **User Authentication Flow Tests**: Sign-in, sign-out, and authentication state validation
- **Secure Authentication Practice Tests**: Verifies proper use of `getUser()` for authentication 
- **Row Level Security (RLS) Tests**: Validates that users can only access their own data

### 2. Server Hooks Tests (`hooks-server.test.js`) 

These tests validate the server-side authentication handling in SvelteKit hooks:

- **Supabase Client Setup**: Verifies proper initialization with cookie handling
- **User Verification Tests**: Ensures secure user verification with `getUser()`  
- **Session Management**: Tests proper session handling in the server hooks

### 3. Client Authentication Tests (`client-auth.test.js`)

These tests focus on browser-side authentication:

- **Auth State Management**: Tests proper handling of authentication state changes
- **Reactive Updates**: Ensures UI updates correctly when auth state changes
- **Secure Verification**: Confirms client components use secure methods to verify user status

## Running Tests

To run all authentication tests:

```bash
npx vitest run src/tests/auth-integration.test.js src/tests/hooks-server.test.js src/tests/client-auth.test.js
```

To run a specific test file:

```bash
npx vitest run src/tests/auth-integration.test.js
```

## Testing Best Practices

1. **Mock External Dependencies**: Always mock Supabase and other external services
2. **Test RLS Policies**: Include specific tests that verify Row Level Security enforcement
3. **Validate Secure Patterns**: Ensure tests explicitly verify secure authentication practices
4. **Test Edge Cases**: Include tests for token refresh, race conditions, and error scenarios

## Integration with CI/CD

The authentication tests are designed to run as part of the CI/CD pipeline to ensure secure authentication practices are maintained throughout development.

## Future Test Improvements

1. **E2E Tests**: Implement end-to-end tests with Playwright or Cypress to test real authentication flows
2. **Performance Tests**: Add tests to measure authentication performance and optimize as needed
3. **Security Penetration Tests**: Add specialized tests attempting to bypass authentication

/**
 * Test script for KV operations
 * 
 * Run with: node scripts/test-kv.js
 * Requires wrangler to be set up and authenticated
 */
import fetch from 'node-fetch';

async function testKvEndpoint() {
    try {
        console.log('Testing KV integration...');
        
        // If you're running the server with npm run dev:cf, it should be on port 8788
        const response = await fetch('http://localhost:8788/api/kv-test');
        
        if (!response.ok) {
            throw new Error(`Response error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.match === true && data.readValue === 'world') {
            console.log('✅ SUCCESS: KV read/write test passed!');
            console.log('KV binding is working correctly.');
        } else {
            console.log('❌ FAILED: KV test did not return expected values.');
            console.log(`Expected 'world', got '${data.readValue}'`);
        }
    } catch (error) {
        console.error('❌ ERROR during test:', error.message);
        console.log('Make sure your wrangler server is running with: npm run dev:cf');
    }
}

testKvEndpoint();

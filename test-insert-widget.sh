#!/bin/bash

# Wait for the server to be ready
echo "Waiting for server to be ready..."
sleep 5

# Send test request to the insert-widget endpoint
echo "Sending request to insert-widget endpoint..."
curl -X POST http://localhost:5173/api/test/insert-widget \
  -H "Content-Type: application/json" \
  -d '{
    "googlePlaceId": "test_place_id",
    "businessName": "Test Business",
    "businessAddress": "123 Test St, Test City",
    "name": "My Test Widget",
    "displayType": "carousel",
    "theme": "light",
    "subscriptionTier": "FREE"
  }'

echo "
Request completed"

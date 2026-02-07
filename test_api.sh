#!/bin/bash

API_KEY="sk_test_12345"
API_URL="https://semantic-gateway.vercel.app/api/v1/extract"

test_url() {
  echo "Testing: $1"
  curl -X POST $API_URL \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$1\"}" \
    | jq '.meta'
  echo "---"
}

# Run tests
test_url "https://treehousesm.com"
test_url "https://www.georgesatthecove.com"
test_url "https://www.marriott.com"
test_url "https://www.allbirds.com"
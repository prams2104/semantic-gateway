#!/bin/bash

API_KEY="sk_test_12345"
API_URL="https://semantic-gateway.vercel.app/api/v1/extract"

# Create CSV header
echo "category,name,url,tokens_original,tokens_extracted,tokens_saved_percent,cost_saved_usd,processing_time_ms" > test_results.csv

# Create JSON array start
echo "[" > test_results.json

first=true

# Function to test a URL
test_url() {
    category=$1
    name=$2
    url=$3
    
    echo "Testing: $name ($category)..."
    
    result=$(curl -s -X POST $API_URL \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"$url\"}")
    
    if echo "$result" | jq -e '.meta' > /dev/null 2>&1; then
        tokens_orig=$(echo "$result" | jq -r '.meta.tokens_original')
        tokens_extr=$(echo "$result" | jq -r '.meta.tokens_extracted')
        tokens_saved_pct=$(echo "$result" | jq -r '.meta.tokens_saved_percent')
        cost_saved=$(echo "$result" | jq -r '.meta.cost_saved_usd')
        proc_time=$(echo "$result" | jq -r '.meta.processing_time_ms')
        
        # CSV
        echo "$category,$name,$url,$tokens_orig,$tokens_extr,$tokens_saved_pct,$cost_saved,$proc_time" >> test_results.csv
        
        # JSON
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> test_results.json
        fi
        
        cat >> test_results.json << JSON
  {
    "category": "$category",
    "name": "$name",
    "url": "$url",
    "tokens_original": $tokens_orig,
    "tokens_extracted": $tokens_extr,
    "tokens_saved": $(echo "$tokens_orig - $tokens_extr" | bc),
    "tokens_saved_percent": $tokens_saved_pct,
    "cost_saved_usd": $cost_saved,
    "processing_time_ms": $proc_time,
    "status": "success"
  }
JSON
        
        echo "  ✓ ${tokens_saved_pct}% saved, \$$cost_saved"
    else
        echo "  ✗ Failed"
        echo "$category,$name,$url,ERROR,ERROR,ERROR,ERROR,ERROR" >> test_results.csv
    fi
    
    sleep 1
}

# Read CSV and run tests
while IFS=, read -r category name url; do
    if [ "$category" != "category" ]; then
        test_url "$category" "$name" "$url"
    fi
done < test_urls.csv

# Close JSON array
echo "" >> test_results.json
echo "]" >> test_results.json

echo ""
echo "✅ Tests complete! Results saved to:"
echo "   - test_results.csv"
echo "   - test_results.json"
echo ""
echo "📊 Summary:"
awk -F',' 'NR>1 && $6!="ERROR" {sum+=$6; count++} END {if(count>0) print "Average savings: " int(sum/count) "%"}' test_results.csv
awk -F',' 'NR>1 && $7!="ERROR" {sum+=$7; count++} END {if(count>0) printf "Average cost saved: $%.2f\n", sum/count}' test_results.csv
awk -F',' 'NR>1 && $7!="ERROR" {sum+=$7} END {if(NR>1) printf "Total cost saved: $%.2f\n", sum}' test_results.csv

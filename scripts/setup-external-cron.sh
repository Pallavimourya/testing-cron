#!/bin/bash

# External Cron Setup Script
# This script helps set up the external cron system for LinkedIn auto-posting

set -e

echo "🚀 External Cron Setup Script"
echo "============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if .env file exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local file not found. Creating one..."
    touch .env.local
fi

# Generate a secure token if not already set
if ! grep -q "EXTERNAL_CRON_TOKEN" .env.local; then
    print_info "Generating secure EXTERNAL_CRON_TOKEN..."
    CRON_TOKEN=$(openssl rand -hex 32)
    echo "EXTERNAL_CRON_TOKEN=$CRON_TOKEN" >> .env.local
    print_status "Generated EXTERNAL_CRON_TOKEN: $CRON_TOKEN"
else
    print_status "EXTERNAL_CRON_TOKEN already exists in .env.local"
    CRON_TOKEN=$(grep "EXTERNAL_CRON_TOKEN" .env.local | cut -d'=' -f2)
fi

# Check for required environment variables
print_info "Checking required environment variables..."

REQUIRED_VARS=("MONGODB_URI" "NEXTAUTH_SECRET" "LINKEDIN_CLIENT_ID" "LINKEDIN_CLIENT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" .env.local; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_warning "Missing environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    print_info "Please add these variables to your .env.local file:"
    echo ""
    for var in "${MISSING_VARS[@]}"; do
        case $var in
            "MONGODB_URI")
                echo "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database"
                ;;
            "NEXTAUTH_SECRET")
                echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)"
                ;;
            "LINKEDIN_CLIENT_ID")
                echo "LINKEDIN_CLIENT_ID=your-linkedin-client-id"
                ;;
            "LINKEDIN_CLIENT_SECRET")
                echo "LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret"
                ;;
        esac
    done
    echo ""
else
    print_status "All required environment variables are set"
fi

# Check if application is running
print_info "Checking if application is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status "Application is running on http://localhost:3000"
else
    print_warning "Application is not running on http://localhost:3000"
    print_info "Please start your application with: npm run dev"
fi

echo ""
echo "🔧 External Cron Configuration"
echo "=============================="
echo ""

# Get the base URL
if [ -f ".env.local" ] && grep -q "NEXTAUTH_URL" .env.local; then
    BASE_URL=$(grep "NEXTAUTH_URL" .env.local | cut -d'=' -f2)
else
    BASE_URL="http://localhost:3000"
fi

print_info "External Cron Configuration for cron-job.org:"
echo ""
echo "📋 Cron Job Settings:"
echo "  Title: LinkedIn Auto Posting"
echo "  URL: $BASE_URL/api/cron/external-auto-post"
echo "  Schedule: * * * * * (Every minute)"
echo "  Method: GET"
echo "  Headers:"
echo "    Authorization: Bearer $CRON_TOKEN"
echo "  Timeout: 300 seconds"
echo "  Retry on failure: Yes (3 retries)"
echo ""

print_info "Alternative authentication methods:"
echo "  1. Query parameter: $BASE_URL/api/cron/external-auto-post?token=$CRON_TOKEN"
echo "  2. User-Agent: Set User-Agent to 'cron-job.org'"
echo ""

# Test the endpoint if application is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_info "Testing external cron endpoint..."
    
    # Test with Bearer token
    RESPONSE=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $CRON_TOKEN" "$BASE_URL/api/cron/external-auto-post")
    HTTP_CODE="${RESPONSE: -3}"
    RESPONSE_BODY="${RESPONSE%???}"
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_status "External cron endpoint is working! (HTTP $HTTP_CODE)"
        echo "Response: $RESPONSE_BODY"
    else
        print_error "External cron endpoint test failed (HTTP $HTTP_CODE)"
        echo "Response: $RESPONSE_BODY"
    fi
    
    echo ""
    print_info "You can also run the test script:"
    echo "  node scripts/test-external-cron.js"
    echo "  node scripts/test-external-cron.js --auth-test"
fi

echo ""
echo "📚 Next Steps:"
echo "=============="
echo "1. Set up cron-job.org account"
echo "2. Create cron job with the settings above"
echo "3. Test the system by scheduling a post"
echo "4. Monitor the logs for any issues"
echo ""
echo "📖 Documentation:"
echo "================="
echo "See docs/fixed-external-cron-system.md for detailed instructions"
echo ""

print_status "External cron setup completed!"

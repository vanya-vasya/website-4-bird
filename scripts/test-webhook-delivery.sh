#!/bin/bash
# Test Webhook Delivery Script
# 
# This script tests the Networks webhook endpoint with a mock payload
# to verify the webhook handler is working correctly.
#
# Usage:
#   ./scripts/test-webhook-delivery.sh [USER_CLERK_ID] [AMOUNT_CENTS] [TOKENS]
#
# Example:
#   ./scripts/test-webhook-delivery.sh user_2abc123def 2380 100

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
USER_ID=${1:-"user_test_123"}
AMOUNT=${2:-2380}
TOKENS=${3:-100}
WEBHOOK_URL="https://www.yum-mi.com/api/webhooks/networx"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Networks Webhook Delivery Test${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is not installed${NC}"
    exit 1
fi

# Check if jq is available (optional, for pretty JSON)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not installed (JSON output won't be pretty)${NC}"
    JQ_AVAILABLE=false
else
    JQ_AVAILABLE=true
fi

echo -e "${BLUE}ℹ️  Test Configuration:${NC}"
echo -e "  User ID:      ${YELLOW}${USER_ID}${NC}"
echo -e "  Amount:       ${YELLOW}${AMOUNT} cents = \$$(echo "scale=2; $AMOUNT/100" | bc)${NC}"
echo -e "  Tokens:       ${YELLOW}${TOKENS}${NC}"
echo -e "  Webhook URL:  ${YELLOW}${WEBHOOK_URL}${NC}"
echo ""

# Test 1: Check if endpoint is accessible
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Test 1: Checking webhook endpoint accessibility...${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${WEBHOOK_URL}")

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Endpoint is accessible (HTTP $HTTP_CODE)${NC}"
    ENDPOINT_RESPONSE=$(curl -s "${WEBHOOK_URL}")
    if [ "$JQ_AVAILABLE" = true ]; then
        echo -e "${BLUE}Response:${NC}"
        echo "$ENDPOINT_RESPONSE" | jq '.'
    else
        echo "$ENDPOINT_RESPONSE"
    fi
else
    echo -e "${RED}❌ Endpoint is not accessible (HTTP $HTTP_CODE)${NC}"
    echo -e "${RED}   This means the webhook handler is not deployed or not responding${NC}"
    exit 1
fi

echo ""

# Test 2: Send test webhook
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Test 2: Sending test webhook payload...${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TOKEN="test_token_$(date +%s)"

PAYLOAD=$(cat <<EOF
{
  "checkout": {
    "token": "${TOKEN}",
    "status": "completed",
    "test": true,
    "order": {
      "tracking_id": "${USER_ID}",
      "amount": ${AMOUNT},
      "currency": "USD",
      "description": "Payment for ${TOKENS} Tokens (${TOKENS} Tokens)"
    },
    "customer": {
      "email": "test@example.com"
    },
    "transaction": {
      "type": "payment",
      "payment_method_type": "credit_card",
      "message": "Payment successful",
      "paid_at": "${TIMESTAMP}",
      "receipt_url": null
    }
  }
}
EOF
)

echo -e "${BLUE}Payload:${NC}"
if [ "$JQ_AVAILABLE" = true ]; then
    echo "$PAYLOAD" | jq '.'
else
    echo "$PAYLOAD"
fi

echo ""
echo -e "${BLUE}Sending POST request...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Extract HTTP code (last line) and body (everything else)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo -e "${BLUE}Response (HTTP $HTTP_CODE):${NC}"
if [ "$JQ_AVAILABLE" = true ] && echo "$RESPONSE_BODY" | jq empty 2>/dev/null; then
    echo "$RESPONSE_BODY" | jq '.'
else
    echo "$RESPONSE_BODY"
fi

echo ""

# Interpret results
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Webhook processed successfully (HTTP 200)${NC}"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Next Steps:${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "1. Check Vercel logs for webhook processing:"
    echo -e "   ${YELLOW}vercel logs --follow | grep WEBHOOK${NC}"
    echo ""
    echo -e "2. Look for these log entries:"
    echo -e "   • ${BLUE}[WEBHOOK-ENV]${NC} - Environment and database type"
    echo -e "   • ${BLUE}[WEBHOOK-DATA]${NC} - Payment details"
    echo -e "   • ${BLUE}[WEBHOOK-DB-WRITE]${NC} - Database write confirmation"
    echo ""
    echo -e "3. Check database for transaction:"
    echo -e "   ${YELLOW}npx prisma studio${NC}"
    echo -e "   Navigate to Transaction table, sort by paid_at DESC"
    echo ""
    echo -e "4. SQL query to find transaction:"
    echo -e "   ${YELLOW}SELECT * FROM \"Transaction\" WHERE \"userId\" = '${USER_ID}' ORDER BY \"paid_at\" DESC LIMIT 1;${NC}"
    echo ""
elif [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${RED}❌ User not found (HTTP 404)${NC}"
    echo ""
    echo -e "${YELLOW}This means:${NC}"
    echo -e "  • User with clerkId '${USER_ID}' doesn't exist in database"
    echo -e "  • Sign in with this user first to create database record"
    echo -e "  • Or use a different USER_CLERK_ID of an existing user"
    echo ""
    echo -e "${CYAN}To find existing users:${NC}"
    echo -e "  ${YELLOW}npx prisma studio${NC}"
    echo -e "  Navigate to User table and copy a clerkId"
    echo ""
elif [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "${RED}❌ Bad request (HTTP 400)${NC}"
    echo ""
    echo -e "${YELLOW}Possible causes:${NC}"
    echo -e "  • Invalid webhook structure"
    echo -e "  • Description format doesn't match expected pattern"
    echo -e "  • Missing required fields"
    echo ""
    echo -e "${CYAN}Check webhook logs for specific error:${NC}"
    echo -e "  ${YELLOW}vercel logs | tail -50${NC}"
    echo ""
elif [ "$HTTP_CODE" -eq 500 ]; then
    echo -e "${RED}❌ Server error (HTTP 500)${NC}"
    echo ""
    echo -e "${YELLOW}This indicates an error in the webhook handler.${NC}"
    echo -e "Check Vercel logs for stack trace:"
    echo -e "  ${YELLOW}vercel logs | tail -50${NC}"
    echo ""
else
    echo -e "${RED}❌ Unexpected HTTP code: $HTTP_CODE${NC}"
    echo ""
    echo -e "Check Vercel logs for details:"
    echo -e "  ${YELLOW}vercel logs | tail -50${NC}"
    echo ""
fi

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""


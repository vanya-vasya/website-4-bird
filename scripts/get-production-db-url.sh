#!/bin/bash

# Script to retrieve production DATABASE_URL from Vercel
# This makes it easier to investigate the Neon database

echo "🔍 Retrieving production DATABASE_URL from Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed"
    echo ""
    echo "To install Vercel CLI:"
    echo "  npm install -g vercel"
    echo ""
    echo "Or get DATABASE_URL manually:"
    echo "  1. Go to: https://vercel.com/vladis-projects-8c520e18/website-3/settings/environment-variables"
    echo "  2. Find 'DATABASE_URL' variable"
    echo "  3. Copy the value"
    echo ""
    exit 1
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged into Vercel CLI"
    echo ""
    echo "To login:"
    echo "  vercel login"
    echo ""
    exit 1
fi

echo "✅ Vercel CLI is installed and logged in"
echo ""

# Pull environment variables
echo "📥 Pulling production environment variables..."
vercel env pull .env.production --yes 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull environment variables"
    echo ""
    echo "Manual steps:"
    echo "  1. Run: vercel link"
    echo "  2. Select your project: website-3"
    echo "  3. Run this script again"
    echo ""
    exit 1
fi

# Check if .env.production was created
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not created"
    exit 1
fi

# Extract DATABASE_URL
DATABASE_URL=$(grep "^DATABASE_URL=" .env.production | cut -d '=' -f 2- | tr -d '"')

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in production environment"
    echo ""
    echo "Check Vercel dashboard manually:"
    echo "  https://vercel.com/vladis-projects-8c520e18/website-3/settings/environment-variables"
    exit 1
fi

# Mask the password for security
MASKED_URL=$(echo "$DATABASE_URL" | sed -E 's/:[^:@]+@/:****@/')

echo "✅ DATABASE_URL retrieved successfully"
echo ""
echo "Masked URL: $MASKED_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 To run the investigation, use:"
echo ""
echo "source .env.production && node scripts/investigate-neon-user.js"
echo ""
echo "Or copy-paste this command:"
echo ""
echo "DATABASE_URL=\"$DATABASE_URL\" node scripts/investigate-neon-user.js"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Optionally run the investigation automatically
read -p "Run investigation now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔍 Starting investigation..."
    echo ""
    DATABASE_URL="$DATABASE_URL" node scripts/investigate-neon-user.js
fi


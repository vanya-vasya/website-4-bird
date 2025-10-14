#!/bin/bash

# Comprehensive Vercel/Neon Deployment Diagnostic Script
# Date: October 14, 2025

echo "🔍 Vercel/Neon Deployment Diagnostic Report"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Date: $(date)"
echo "Branch: $(git branch --show-current 2>/dev/null || echo 'Unknown')"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Git Status
echo -e "${BLUE}═══ 1. GIT STATUS ═══${NC}"
echo ""
echo "Current Branch:"
git branch --show-current 2>/dev/null || echo "Error getting branch"
echo ""

echo "Last 3 Commits:"
git log --oneline -3 2>/dev/null || echo "Error getting commits"
echo ""

echo "Uncommitted Changes:"
git status --short 2>/dev/null || echo "Error getting status"
echo ""

echo "Remote URLs:"
git remote -v 2>/dev/null || echo "Error getting remotes"
echo ""

# 2. Database Connection Test
echo -e "${BLUE}═══ 2. NEON DATABASE CONNECTION ═══${NC}"
echo ""

if [ -f ".env" ]; then
    source .env
    echo "DATABASE_URL found in .env"
    echo "Masked URL: $(echo $DATABASE_URL | sed -E 's/:[^:@]+@/:****@/')"
    echo ""
    
    echo "Testing connection..."
    if echo "SELECT 1;" | npx prisma db execute --stdin 2>&1 | grep -q "Can't reach"; then
        echo -e "${RED}❌ Database Connection FAILED${NC}"
        echo "Error: Can't reach database server"
        echo ""
        echo "Possible reasons:"
        echo "  1. Neon database is sleeping (free tier) - Wait 30 seconds and retry"
        echo "  2. Neon project is in transition state - Check Neon Console"
        echo "  3. Database is suspended - Check account limits"
        echo "  4. Hostname is incorrect - Verify connection string"
    elif echo "SELECT 1;" | npx prisma db execute --stdin 2>&1 | grep -q "Error"; then
        echo -e "${RED}❌ Database Connection ERROR${NC}"
        npx prisma db execute --stdin <<< "SELECT 1;" 2>&1
    else
        echo -e "${GREEN}✅ Database Connection SUCCESS${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "DATABASE_URL is not configured locally"
fi
echo ""

# 3. Prisma Status
echo -e "${BLUE}═══ 3. PRISMA STATUS ═══${NC}"
echo ""

echo "Prisma Schema Provider:"
grep -A 2 "datasource db" prisma/schema.prisma 2>/dev/null | grep "provider" || echo "Error reading schema"
echo ""

echo "Testing Prisma Generate:"
if npx prisma generate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prisma Generate SUCCESS${NC}"
else
    echo -e "${RED}❌ Prisma Generate FAILED${NC}"
    npx prisma generate 2>&1 | tail -5
fi
echo ""

# 4. Build Test
echo -e "${BLUE}═══ 4. LOCAL BUILD TEST ═══${NC}"
echo ""

echo "Testing if build command works..."
echo "Build command from package.json:"
cat package.json | grep -A 1 '"build"' | grep -v "build" || echo "Error reading package.json"
echo ""

echo "Running: npm run build (this may take a minute)..."
echo "(Output suppressed, checking for errors only)"
if npm run build > /tmp/build.log 2>&1; then
    echo -e "${GREEN}✅ Local Build SUCCESS${NC}"
    echo "Build completed without errors"
else
    echo -e "${RED}❌ Local Build FAILED${NC}"
    echo ""
    echo "Last 20 lines of build log:"
    tail -20 /tmp/build.log
fi
echo ""

# 5. Configuration Files
echo -e "${BLUE}═══ 5. CONFIGURATION FILES ═══${NC}"
echo ""

echo "vercel.json:"
cat vercel.json 2>/dev/null || echo "File not found"
echo ""

echo "next.config.js:"
head -30 next.config.js 2>/dev/null || echo "File not found"
echo ""

# 6. Environment Variables
echo -e "${BLUE}═══ 6. ENVIRONMENT VARIABLES CHECK ═══${NC}"
echo ""

if [ -f ".env.local" ]; then
    echo ".env.local exists"
    echo "Variables found:"
    grep -E "^[A-Z_]+" .env.local 2>/dev/null | cut -d'=' -f1 | sed 's/^/  - /' || echo "  None"
else
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
fi
echo ""

if [ -f ".env" ]; then
    echo ".env exists"
    echo "Variables found:"
    grep -E "^[A-Z_]+" .env 2>/dev/null | cut -d'=' -f1 | sed 's/^/  - /' || echo "  None"
else
    echo -e "${YELLOW}⚠️  .env not found${NC}"
fi
echo ""

# 7. Dependencies Check
echo -e "${BLUE}═══ 7. DEPENDENCIES CHECK ═══${NC}"
echo ""

echo "Node version:"
node --version 2>/dev/null || echo "Node not found"
echo ""

echo "npm version:"
npm --version 2>/dev/null || echo "npm not found"
echo ""

echo "Checking critical dependencies:"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules directory exists${NC}"
    echo ""
    echo "Key packages:"
    echo "  - next: $(npm list next 2>/dev/null | grep next@ | head -1 || echo 'Not found')"
    echo "  - @prisma/client: $(npm list @prisma/client 2>/dev/null | grep @prisma/client@ | head -1 || echo 'Not found')"
    echo "  - prisma: $(npm list prisma 2>/dev/null | grep -E 'prisma@' | head -1 || echo 'Not found')"
else
    echo -e "${RED}❌ node_modules directory missing${NC}"
    echo "Run: npm install"
fi
echo ""

# 8. Vercel CLI Status
echo -e "${BLUE}═══ 8. VERCEL CLI STATUS ═══${NC}"
echo ""

if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
    vercel --version
    echo ""
    
    if vercel whoami 2>&1 | grep -q "Error: No existing credentials"; then
        echo -e "${YELLOW}⚠️  Not logged into Vercel CLI${NC}"
        echo "Run: vercel login"
        echo ""
        echo "Or check deployment via web:"
        echo "https://vercel.com/vladis-projects-8c520e18/website-3"
    else
        echo -e "${GREEN}✅ Logged into Vercel CLI${NC}"
        vercel whoami
    fi
else
    echo -e "${RED}❌ Vercel CLI not installed${NC}"
    echo "Install with: npm install -g vercel"
fi
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}═══ DIAGNOSTIC SUMMARY ═══${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo "🎯 KEY FINDINGS:"
echo ""

# Check database
if [ -f ".env" ]; then
    source .env
    if echo "SELECT 1;" | npx prisma db execute --stdin 2>&1 | grep -q "Can't reach"; then
        echo -e "  ${RED}🔴 CRITICAL: Neon database is unreachable${NC}"
        echo "     This is the 'transition state' issue"
        echo ""
        echo "     NEXT STEPS:"
        echo "     1. Check Neon Console: https://console.neon.tech"
        echo "     2. Look for project status (Active/Transitioning/Suspended)"
        echo "     3. If sleeping, wait 30 seconds and retry"
        echo "     4. If suspended, check account limits/billing"
        echo "     5. If transitioning, wait for completion (usually <10 min)"
    else
        echo -e "  ${GREEN}✅ Database connection OK${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  Database not configured locally${NC}"
fi
echo ""

# Check build
if [ -f "/tmp/build.log" ]; then
    if grep -q "Error" /tmp/build.log || grep -q "Failed" /tmp/build.log; then
        echo -e "  ${RED}🔴 Build has errors${NC}"
        echo "     Check /tmp/build.log for details"
    else
        echo -e "  ${GREEN}✅ Local build OK${NC}"
    fi
fi
echo ""

echo "📋 RECOMMENDED ACTIONS:"
echo ""
echo "1. Check Neon Console for project status:"
echo "   https://console.neon.tech"
echo ""
echo "2. Verify DATABASE_URL in Vercel:"
echo "   https://vercel.com/vladis-projects-8c520e18/website-3/settings/environment-variables"
echo ""
echo "3. Check latest deployment:"
echo "   https://vercel.com/vladis-projects-8c520e18/website-3/deployments"
echo ""
echo "4. If database is transitioning, wait and retry:"
echo "   sleep 30 && ./scripts/diagnose-deployment.sh"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "Report complete: $(date)"
echo "═══════════════════════════════════════════════════════════"


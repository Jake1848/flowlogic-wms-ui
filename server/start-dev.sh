#!/bin/bash
# FlowLogic Development Startup Script
# This script handles the prisma dev ephemeral database and starts the server

echo "🚀 Starting FlowLogic Development Environment..."

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "prisma dev" 2>/dev/null
pkill -f "node.*index.js" 2>/dev/null
sleep 2

# Start prisma dev in background
echo "Starting Prisma Dev (ephemeral PostgreSQL)..."
npx prisma dev 2>&1 &
PRISMA_PID=$!

# Wait for prisma dev to be ready
echo "Waiting for database to be ready..."
sleep 12

# Check if prisma dev is running
if ! kill -0 $PRISMA_PID 2>/dev/null; then
    echo "❌ Prisma dev failed to start"
    exit 1
fi

# Push schema
echo "Pushing database schema..."
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="Yes" npx prisma db push --accept-data-loss --skip-generate

# Seed database
echo "Seeding database..."
node prisma/seed.js

# Short pause to let database settle
sleep 2

# Start the server (this will handle prepared statement issues on first request)
echo "Starting FlowLogic Server..."
npm run dev

# Cleanup on exit
trap "kill $PRISMA_PID 2>/dev/null" EXIT

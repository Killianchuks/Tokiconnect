#!/bin/bash

# Exit on error
set -e

echo "Deploying TOKI CONNECT to production..."

# Pull latest changes
echo "Pulling latest changes from repository..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run database migrations
echo "Running database migrations..."
npm run db:push

# Build the application
echo "Building the application..."
npm run build

# Restart the application
echo "Restarting the application..."
pm2 restart tokiconnect || pm2 start npm --name "tokiconnect" -- start

echo "Deployment completed successfully!"

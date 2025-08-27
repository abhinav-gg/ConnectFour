#!/bin/bash

# Simple deployment script for ConnectFour with AWS Secrets Manager
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying ConnectFour in $ENVIRONMENT mode..."

# Set environment variables
export NODE_ENV=$ENVIRONMENT
export AWS_REGION=${AWS_REGION:-us-east-1}
export SECRET_NAME=${SECRET_NAME:-connectfour/$ENVIRONMENT}

echo "📍 Configuration:"
echo "  Environment: $NODE_ENV"
echo "  AWS Region: $AWS_REGION" 
echo "  Secret Name: $SECRET_NAME"

# Step 1: Fetch secrets from AWS (only in production)
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔍 Fetching secrets from AWS Secrets Manager..."
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        echo "❌ AWS CLI not configured. Please run 'aws configure' or ensure IAM role is attached."
        exit 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install aws-sdk
    fi
    
    # Fetch secrets
    node backend/config/aws.js
    
    if [ ! -f "backend/.env" ]; then
        echo "❌ Failed to create .env file from secrets"
        exit 1
    fi
    
    echo "✅ Secrets fetched successfully"
else
    echo "🔧 Development mode - using local .env file"
    if [ ! -f "backend/.env" ]; then
        echo "⚠️  backend/.env not found. Create one or run in production mode."
    fi
fi

# Step 2: Build and start containers
echo "🐳 Starting Docker containers..."

if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
else
    docker-compose up -d --build
fi

# Step 3: Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Step 4: Health check
echo "🏥 Checking service health..."
for i in {1..30}; do
    if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ API service is healthy"
        break
    elif [ $i -eq 30 ]; then
        echo "❌ API service failed to start"
        docker-compose logs api
        exit 1
    else
        echo "⏳ Waiting for API... ($i/30)"
        sleep 5
    fi
done

echo "🎉 Deployment completed successfully!"
echo "🌐 API: http://localhost:3001"
echo "🔌 Socket: http://localhost:3002"
echo "📊 Redis UI: http://localhost:8001"

# Show running containers
docker-compose ps

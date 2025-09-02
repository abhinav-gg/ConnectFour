#!/bin/bash
set -euo pipefail

echo "Fetching secrets from AWS Parameter Store..."

# Fetch environment variables securely
REDIS_PASSWORD=$(aws ssm get-parameter --name "/prod/redis/password" --with-decryption --query "Parameter.Value" --output text)
REDIS_HOST=$(aws ssm get-parameter --name "/prod/redis/host" --with-decryption --query "Parameter.Value" --output text)
REDIS_PORT=$(aws ssm get-parameter --name "/prod/redis/port" --with-decryption --query "Parameter.Value" --output text)
GHCR_PAT=$(aws ssm get-parameter --name "/prod/ghcr/pat" --with-decryption --query "Parameter.Value" --output text)

# Check none are empty
if [[ -z "$REDIS_PASSWORD" || -z "$GHCR_PAT" ]]; then
  echo "Error: One or more required parameters are missing."
  exit 1
fi

echo "Secrets retrieved successfully."

echo "Logging into GitHub Container Registry..."
echo "$GHCR_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

IMAGE="ghcr.io/yourorg/yourrepo/connectfour-api:latest"

echo "Pulling latest image from GHCR..."
docker pull $IMAGE

echo "Tagging image locally as connectfour-api:latest..."
docker tag $IMAGE connectfour-api:latest

# Export the env vars so docker-compose can expand them
export REDIS_PASSWORD REDIS_HOST REDIS_PORT

echo "Starting containers..."
docker compose up -d

unset REDIS_PASSWORD REDIS_HOST REDIS_PORT GHCR_PAT
echo "Deployment complete."

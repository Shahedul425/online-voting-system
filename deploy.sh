#!/usr/bin/env bash
set -euo pipefail

echo "Starting deployment..."
echo "BACKEND_IMAGE=$BACKEND_IMAGE"
echo "FRONTEND_IMAGE=$FRONTEND_IMAGE"
echo "IMAGE_TAG=$IMAGE_TAG"

cd /opt/trustvote/online-voting-system

echo "Updating repo files..."
git fetch origin
git reset --hard origin/main

echo "Pulling app images..."
docker pull "${BACKEND_IMAGE}:${IMAGE_TAG}"
docker pull "${FRONTEND_IMAGE}:${IMAGE_TAG}"

export BACKEND_IMAGE_FULL="${BACKEND_IMAGE}:${IMAGE_TAG}"
export FRONTEND_IMAGE_FULL="${FRONTEND_IMAGE}:${IMAGE_TAG}"

echo "Deploying stack..."
docker compose -f docker-compose.prod.yml pull --ignore-buildable
docker compose -f docker-compose.prod.yml up -d

echo "Deployment finished."
docker compose -f docker-compose.prod.yml ps
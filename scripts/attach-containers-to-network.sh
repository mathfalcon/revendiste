#!/bin/bash
set -e

# Create the network if it doesn't exist
echo "Creating Docker network..."
docker network create revendiste-network || true

# Connect backend container to network
if docker ps --format '{{.Names}}' | grep -q '^revendiste-backend$'; then
  echo "Connecting revendiste-backend to network..."
  docker network connect revendiste-network revendiste-backend || echo "Backend already connected or connection failed"
else
  echo "Warning: revendiste-backend container is not running"
fi

# Connect frontend container to network
if docker ps --format '{{.Names}}' | grep -q '^revendiste-frontend$'; then
  echo "Connecting revendiste-frontend to network..."
  docker network connect revendiste-network revendiste-frontend || echo "Frontend already connected or connection failed"
  
  # Update frontend container with BACKEND_IP environment variable
  echo "Updating frontend container with BACKEND_IP..."
  docker update --env-add BACKEND_IP=revendiste-backend:3001 revendiste-frontend || echo "Note: docker update doesn't support --env-add on running containers"
  echo "Warning: Environment variables cannot be updated on running containers."
  echo "You may need to restart the frontend container with the new env var."
else
  echo "Warning: revendiste-frontend container is not running"
fi

echo ""
echo "Network connection complete!"
echo ""
echo "To verify, run:"
echo "  docker network inspect revendiste-network"
echo ""
echo "Note: If you need to add BACKEND_IP to the frontend container,"
echo "you'll need to restart it with the environment variable:"
echo "  docker stop revendiste-frontend"
echo "  docker rm revendiste-frontend"
echo "  # Then recreate with --network and -e BACKEND_IP=revendiste-backend:3001"


#!/bin/sh
set -e

# Change to backend directory
cd /app/apps/backend

# Run database migrations
echo "Running database migrations..."
# Use npx to run kysely-ctl from local node_modules
npx kysely-ctl migrate:latest || {
  echo "Error: Migration failed, exiting..."
  exit 1
}

# Execute the command passed from CMD (or as arguments)
echo "Starting server..."
exec "$@"

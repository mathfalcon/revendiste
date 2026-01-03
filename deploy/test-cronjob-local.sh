#!/bin/bash
# Script to test the scrape-events cronjob locally using the production Docker image
# This simulates how the job runs in ECS
#
# Usage:
#   ./deploy/test-cronjob-local.sh              # Use fake values (for testing Playwright only)
#   ./deploy/test-cronjob-local.sh --real       # Use real values from .env file

set -e

USE_FAKE_VALUES=true
if [ "$1" == "--real" ]; then
  USE_FAKE_VALUES=false
fi

# Build the image
echo "Building Docker image..."
docker build -t revendiste-backend -f ./deploy/backend.Dockerfile .

if [ "$USE_FAKE_VALUES" = true ]; then
  echo "Using fake environment variables for testing..."
  # Create fake DB_CREDENTIALS_JSON
  DB_CREDENTIALS_JSON='{"username":"test_user","password":"test_pass","dbname":"test_db","host":"host.docker.internal","port":5432}'
  
  # Create fake BACKEND_SECRETS_JSON with all required fields
  BACKEND_SECRETS_JSON='{"CLERK_PUBLISHABLE_KEY":"pk_test_fake","CLERK_SECRET_KEY":"sk_test_fake","DLOCAL_API_KEY":"fake_api_key","DLOCAL_SECRET_KEY":"fake_secret_key","DLOCAL_BASE_URL":"https://api.dlocal.com","APP_BASE_URL":"https://app.revendiste.com","API_BASE_URL":"https://api.revendiste.com","STORAGE_TYPE":"local","RESEND_API_KEY":"fake_resend_key"}'
else
  # Check if .env file exists for environment variables
  if [ ! -f .env ]; then
    echo "Error: .env file not found. Use --real flag with a valid .env file, or run without flag to use fake values."
    exit 1
  fi

  # Load environment variables from .env file
  export $(grep -v '^#' .env | xargs)

  # Create DB_CREDENTIALS_JSON from POSTGRES_* variables (simulating Secrets Manager)
  DB_CREDENTIALS_JSON=$(cat <<EOF
{
  "username": "${POSTGRES_USER}",
  "password": "${POSTGRES_PASSWORD}",
  "dbname": "${POSTGRES_DB}",
  "host": "${POSTGRES_HOST:-localhost}",
  "port": "${POSTGRES_PORT:-5432}"
}
EOF
)

  # Create BACKEND_SECRETS_JSON from .env (simulating Secrets Manager)
  BACKEND_SECRETS_JSON=$(cat <<EOF
{
  "NODE_ENV": "production",
  "CLERK_PUBLISHABLE_KEY": "${CLERK_PUBLISHABLE_KEY}",
  "CLERK_SECRET_KEY": "${CLERK_SECRET_KEY}",
  "DLOCAL_API_KEY": "${DLOCAL_API_KEY}",
  "DLOCAL_SECRET_KEY": "${DLOCAL_SECRET_KEY}",
  "DLOCAL_BASE_URL": "${DLOCAL_BASE_URL}",
  "APP_BASE_URL": "${APP_BASE_URL}",
  "API_BASE_URL": "${API_BASE_URL}",
  "STORAGE_TYPE": "${STORAGE_TYPE:-local}",
  "R2_PUBLIC_BUCKET": "${R2_PUBLIC_BUCKET}",
  "R2_PRIVATE_BUCKET": "${R2_PRIVATE_BUCKET}",
  "R2_ACCOUNT_ID": "${R2_ACCOUNT_ID}",
  "R2_ACCESS_KEY_ID": "${R2_ACCESS_KEY_ID}",
  "R2_SECRET_ACCESS_KEY": "${R2_SECRET_ACCESS_KEY}",
  "R2_CDN_DOMAIN": "${R2_CDN_DOMAIN}",
  "RESEND_API_KEY": "${RESEND_API_KEY}"
}
EOF
)
fi

echo "Running scrape-events cronjob..."
echo ""

# Run the container with the same command as ECS
docker run --rm -it \
  -e NODE_ENV=production \
  -e DB_CREDENTIALS_JSON="${DB_CREDENTIALS_JSON}" \
  -e BACKEND_SECRETS_JSON="${BACKEND_SECRETS_JSON}" \
  -e PLAYWRIGHT_BROWSERS_PATH=/app/.playwright-browsers \
  --network host \
  revendiste-backend \
  node dist/src/scripts/run-job.js scrape-events

echo ""
echo "Cronjob completed!"


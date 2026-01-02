#!/bin/sh
set -e

# Change to backend directory
cd /app/apps/backend

# Parse secrets from JSON and export as environment variables
# This reduces Secrets Manager API calls from 21 (one per key) to 2 (one per secret)
if [ -n "$DB_CREDENTIALS_JSON" ]; then
  echo "Parsing database credentials from Secrets Manager..."
  # Parse DB credentials JSON and export individual vars
  export POSTGRES_USER=$(echo "$DB_CREDENTIALS_JSON" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).username)")
  export POSTGRES_PASSWORD=$(echo "$DB_CREDENTIALS_JSON" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).password)")
  export POSTGRES_DB=$(echo "$DB_CREDENTIALS_JSON" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).dbname)")
  export POSTGRES_HOST=$(echo "$DB_CREDENTIALS_JSON" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).host)")
  export POSTGRES_PORT=$(echo "$DB_CREDENTIALS_JSON" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).port)")
fi

if [ -n "$BACKEND_SECRETS_JSON" ]; then
  echo "Parsing backend secrets from Secrets Manager..."
  # Parse backend secrets JSON and export all vars
  # Use node to parse JSON and export each key as an environment variable
  echo "$BACKEND_SECRETS_JSON" | node -e "
    const secrets = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
    for (const [key, value] of Object.entries(secrets)) {
      if (value !== null && value !== undefined) {
        // Escape special characters and export
        const escaped = String(value).replace(/'/g, \"'\\''\");
        process.stdout.write(\`export \${key}='\${escaped}'\n\`);
      }
    }
  " | sh
fi

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

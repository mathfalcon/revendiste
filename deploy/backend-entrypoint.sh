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
  # Parse backend secrets JSON and export all vars in the current shell
  # Use eval to execute exports in the current shell context (not a subshell)
  eval "$(echo "$BACKEND_SECRETS_JSON" | node -e "
    const secrets = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
    for (const [key, value] of Object.entries(secrets)) {
      if (value !== null && value !== undefined) {
        // Escape special characters properly for shell
        const escaped = String(value)
          .replace(/\\\\/g, '\\\\\\\\')
          .replace(/'/g, \"'\\\\''\");
        process.stdout.write(\`export \${key}='\${escaped}'\n\`);
      }
    }
  ")"
fi

# Check if this is a cronjob (command contains "run-job.js") or the server
IS_CRONJOB=false
for arg in "$@"; do
  case "$arg" in
    *run-job.js*)
      IS_CRONJOB=true
      break
      ;;
  esac
done

# Only run migrations for the server, not for cronjobs
if [ "$IS_CRONJOB" = "false" ]; then
  echo "Running database migrations..."
  # Use npx to run kysely-ctl from local node_modules
  npx kysely-ctl migrate:latest || {
    echo "Error: Migration failed, exiting..."
    exit 1
  }
  echo "Starting server..."
else
  echo "Skipping migrations (cronjob detected)..."
fi

# Execute the command passed from CMD (or as arguments)
exec "$@"

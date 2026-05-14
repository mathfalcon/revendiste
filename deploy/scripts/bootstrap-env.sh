#!/usr/bin/env bash
# Pulls runtime secrets for the dev EC2 from AWS Secrets Manager and writes
# /opt/revendiste/.env, which docker compose reads via --env-file.
#
# Idempotent: run on every boot via systemd. Existing .env is replaced
# atomically. Backend & frontend pick up new values on the next `up -d`.
#
# Required env (passed in by the systemd unit):
#   AWS_REGION                     e.g. sa-east-1
#   ENVIRONMENT                    dev | prod
#   APP_HOSTNAME                   e.g. dev.revendiste.com
#   AWS_ACCOUNT_ID                 ECR account id
#   IMAGE_TAG                      backend & frontend image tag (default: latest)
#   DB_CREDENTIALS_SECRET_ID       SecretsManager id for {host,port,username,password,dbname,database_url}
#   BACKEND_SECRETS_SECRET_ID      SecretsManager id for backend env JSON
#
# Notes:
# - DB_CREDENTIALS_SECRET_ID for dev should hold a secret whose payload points
#   to the in-VM Postgres (host=postgres, port=5432). Provisioning generates a
#   random password and stores both Postgres-side env vars (POSTGRES_USER,
#   POSTGRES_PASSWORD, POSTGRES_DB) and the JSON blob backend-entrypoint.sh
#   expects. See infrastructure/modules/ec2-app/README.md for the contract.

set -euo pipefail

ENV_DIR=${ENV_DIR:-/opt/revendiste}
ENV_FILE="${ENV_DIR}/.env"
ENV_FILE_TMP="${ENV_FILE}.tmp.$$"

require_var() {
  local name=$1
  if [[ -z "${!name:-}" ]]; then
    echo "bootstrap-env: required env $name is not set" >&2
    exit 64
  fi
}

require_var AWS_REGION
require_var ENVIRONMENT
require_var APP_HOSTNAME
require_var AWS_ACCOUNT_ID
require_var DB_CREDENTIALS_SECRET_ID
require_var BACKEND_SECRETS_SECRET_ID

mkdir -p "$ENV_DIR"

echo "bootstrap-env: fetching DB_CREDENTIALS_JSON from $DB_CREDENTIALS_SECRET_ID"
DB_CREDENTIALS_JSON=$(aws secretsmanager get-secret-value \
  --region "$AWS_REGION" \
  --secret-id "$DB_CREDENTIALS_SECRET_ID" \
  --query SecretString \
  --output text)

echo "bootstrap-env: fetching BACKEND_SECRETS_JSON from $BACKEND_SECRETS_SECRET_ID"
BACKEND_SECRETS_JSON=$(aws secretsmanager get-secret-value \
  --region "$AWS_REGION" \
  --secret-id "$BACKEND_SECRETS_SECRET_ID" \
  --query SecretString \
  --output text)

# Pull POSTGRES_* out of the DB credentials JSON so the postgres container can
# initialize (or refuse to start if values disagree with the persisted volume).
# `jq` is installed by user-data; no python dependency here.
extract() {
  local key=$1
  printf '%s' "$DB_CREDENTIALS_JSON" | jq -r --arg k "$key" '.[$k] // ""'
}

POSTGRES_USER=$(extract username)
POSTGRES_PASSWORD=$(extract password)
POSTGRES_DB=$(extract dbname)

if [[ -z "$POSTGRES_USER" || -z "$POSTGRES_PASSWORD" || -z "$POSTGRES_DB" ]]; then
  echo "bootstrap-env: DB_CREDENTIALS_JSON is missing username/password/dbname" >&2
  exit 65
fi

# Docker Compose .env treats `#` as starting a comment unless the value is
# quoted. DB passwords may include `#` (see ec2-app random_password), which
# otherwise truncates POSTGRES_* and JSON lines and breaks the backend at boot.
dotenv_kv_json_string() {
  local key=$1
  local val=$2
  local encoded
  encoded=$(jq -nr --arg v "$val" '$v|@json')
  printf '%s=%s\n' "$key" "$encoded"
}

umask 077
{
  printf 'AWS_REGION=%s\n' "$AWS_REGION"
  printf 'AWS_ACCOUNT_ID=%s\n' "$AWS_ACCOUNT_ID"
  printf 'ENVIRONMENT=%s\n' "$ENVIRONMENT"
  printf 'APP_HOSTNAME=%s\n' "$APP_HOSTNAME"
  printf 'IMAGE_TAG=%s\n' "${IMAGE_TAG:-latest}"
  dotenv_kv_json_string POSTGRES_USER "$POSTGRES_USER"
  dotenv_kv_json_string POSTGRES_PASSWORD "$POSTGRES_PASSWORD"
  dotenv_kv_json_string POSTGRES_DB "$POSTGRES_DB"
  dotenv_kv_json_string DB_CREDENTIALS_JSON "$DB_CREDENTIALS_JSON"
  dotenv_kv_json_string BACKEND_SECRETS_JSON "$BACKEND_SECRETS_JSON"
} >"$ENV_FILE_TMP"

mv "$ENV_FILE_TMP" "$ENV_FILE"
chmod 600 "$ENV_FILE"

echo "bootstrap-env: wrote $ENV_FILE"

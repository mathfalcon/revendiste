#!/bin/bash
# Helper script to execute commands in ECS tasks

set -e

# Add Session Manager plugin to PATH (Windows Git Bash)
if [ -d "/c/Program Files/Amazon/SessionManagerPlugin/bin" ]; then
  export PATH="$PATH:/c/Program Files/Amazon/SessionManagerPlugin/bin"
fi

# Workaround for Windows path issues with Session Manager
# Use MSYS2-style path conversion for Windows
export MSYS2_ARG_CONV_EXCL="*"

CLUSTER_NAME="revendiste-production-cluster"
REGION="${AWS_REGION:-sa-east-1}"  # Default to sa-east-1, can be overridden with AWS_REGION env var

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
  echo "Usage: $0 [backend|frontend] [command]"
  echo ""
  echo "Examples:"
  echo "  $0 backend                    # Open interactive shell"
  echo "  $0 backend 'ls -la'           # Run a command"
  echo "  $0 backend 'node --version'   # Check Node version"
  echo "  $0 frontend 'cat package.json'"
  exit 1
}

if [ $# -lt 1 ]; then
  usage
fi

SERVICE=$1
COMMAND="${2:-/bin/sh}"

# Validate service name
if [ "$SERVICE" != "backend" ] && [ "$SERVICE" != "frontend" ]; then
  echo -e "${RED}Error: Service must be 'backend' or 'frontend'${NC}"
  usage
fi

SERVICE_NAME="revendiste-production-${SERVICE}"
CONTAINER_NAME="$SERVICE"

echo -e "${YELLOW}Finding running tasks for ${SERVICE_NAME}...${NC}"

# Get the first running task (try default region first, then auto-detect)
TASK_ARN=$(aws ecs list-tasks \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --region "$REGION" \
  --query 'taskArns[0]' \
  --output text 2>/dev/null || \
  aws ecs list-tasks \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --query 'taskArns[0]' \
  --output text)

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" == "None" ]; then
  echo -e "${RED}Error: No running tasks found for ${SERVICE_NAME}${NC}"
  echo "Make sure the service has at least one running task."
  exit 1
fi

# Auto-detect region from task ARN (format: arn:aws:ecs:REGION:ACCOUNT:task/...)
if [[ "$TASK_ARN" =~ arn:aws:ecs:([^:]+): ]]; then
  REGION="${BASH_REMATCH[1]}"
  echo -e "${GREEN}Auto-detected region: ${REGION}${NC}"
fi

TASK_ID=$(basename "$TASK_ARN")
echo -e "${GREEN}Found task: ${TASK_ID}${NC}"
echo ""

# Verify Session Manager plugin is available
if ! command -v session-manager-plugin &> /dev/null; then
  echo -e "${RED}Error: session-manager-plugin not found${NC}"
  echo "Please install it: winget install Amazon.SessionManagerPlugin"
  echo "Or download from: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html"
  exit 1
fi

# Execute command
if [ "$COMMAND" == "/bin/sh" ]; then
  echo -e "${YELLOW}Opening interactive shell...${NC}"
  echo -e "${YELLOW}Type 'exit' to disconnect${NC}"
  echo ""
  # Use 'sh' instead of '/bin/sh' to avoid path issues on Windows
  EXEC_COMMAND="sh"
else
  echo -e "${YELLOW}Executing: ${COMMAND}${NC}"
  echo ""
  EXEC_COMMAND="$COMMAND"
fi

# Execute with proper quoting for Windows compatibility
aws ecs execute-command \
  --cluster "$CLUSTER_NAME" \
  --task "$TASK_ID" \
  --container "$CONTAINER_NAME" \
  --interactive \
  --command "$EXEC_COMMAND" \
  --region "$REGION"


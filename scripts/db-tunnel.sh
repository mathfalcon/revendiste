#!/bin/bash
# Database Tunnel Script
# Creates a secure tunnel to RDS using EC2 Instance Connect Endpoint

set -e

# Default values
ENVIRONMENT="${1:-dev}"
LOCAL_PORT="${2:-5432}"

echo "🔌 Setting up database tunnel for $ENVIRONMENT environment..."

# Get Terraform outputs
cd "$(dirname "$0")/../infrastructure/environments/${ENVIRONMENT}" || {
    echo "❌ Environment '$ENVIRONMENT' not found"
    echo "Usage: $0 [dev|production] [local_port]"
    exit 1
}

# Get the endpoint ID and RDS address
ENDPOINT_ID=$(terraform output -raw ec2_instance_connect_endpoint_id 2>/dev/null) || {
    echo "❌ Could not get EC2 Instance Connect Endpoint ID"
    echo "Make sure you have run 'terraform apply' and the endpoint is created"
    exit 1
}

RDS_ENDPOINT=$(terraform output -raw rds_address 2>/dev/null) || {
    echo "❌ Could not get RDS address"
    exit 1
}

# Resolve RDS hostname to IP
echo "📡 Resolving RDS hostname: $RDS_ENDPOINT"
RDS_IP=$(dig +short "$RDS_ENDPOINT" | head -n1)

if [ -z "$RDS_IP" ]; then
    echo "❌ Could not resolve RDS hostname to IP"
    exit 1
fi

echo "📍 RDS IP: $RDS_IP"
echo ""
echo "🚀 Starting tunnel..."
echo "   Local:  localhost:$LOCAL_PORT"
echo "   Remote: $RDS_IP:5432"
echo ""
echo "💡 Connect using:"
echo "   psql -h localhost -p $LOCAL_PORT -U postgres -d revendiste"
echo ""
echo "Press Ctrl+C to close the tunnel"
echo "-----------------------------------"

# Open the tunnel
aws ec2-instance-connect open-tunnel \
    --instance-connect-endpoint-id "$ENDPOINT_ID" \
    --private-ip-address "$RDS_IP" \
    --local-port "$LOCAL_PORT" \
    --remote-port 5432

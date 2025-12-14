#!/bin/bash
# User data script for backend EC2 instance setup
# Installs Docker and configures for backend deployment

set -e

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

yum install -y aws-cli jq

# Create directory for application
mkdir -p /opt/revendiste
chown ec2-user:ec2-user /opt/revendiste

# Set up GitHub Actions SSH key
mkdir -p /home/ec2-user/.ssh
echo "${github_ssh_public_key}" >> /home/ec2-user/.ssh/authorized_keys
chmod 600 /home/ec2-user/.ssh/authorized_keys
chmod 700 /home/ec2-user/.ssh
chown -R ec2-user:ec2-user /home/ec2-user/.ssh

cat > /opt/revendiste/load-secrets.sh << 'EOF'
#!/bin/bash

# Get secret from AWS Secrets Manager
SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id revendiste/dev/backend-secrets \
  --query 'SecretString' \
  --output text)

# Export all keys from the JSON secret as environment variables
while IFS='=' read -r key value; do
  # Skip empty lines
  [ -z "$key" ] && continue
  # Export the variable
  export "$key=$value"
done < <(echo "$SECRET_JSON" | jq -r 'to_entries[] | "\(.key)=\(.value)"')
EOF

chmod +x /opt/revendiste/load-secrets.sh
chown ec2-user:ec2-user /opt/revendiste/load-secrets.sh



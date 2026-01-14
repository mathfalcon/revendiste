#!/bin/bash
# User data script for combined app EC2 instance
# Installs Docker, nginx, and configures for both frontend and backend

set -e

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

yum install -y aws-cli jq nginx

# Configure nginx as reverse proxy for both frontend and backend
# Remove default nginx config to avoid conflicts
rm -f /etc/nginx/conf.d/default.conf

# Create SSL certificate directories
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private
chmod 755 /etc/ssl/certs
chmod 750 /etc/ssl/private

# Fetch Cloudflare Origin CA certificate from Secrets Manager (stored in backend-secrets)
SECRETS_JSON=$(aws secretsmanager get-secret-value \
  --secret-id revendiste/dev/backend-secrets \
  --region sa-east-1 \
  --query 'SecretString' \
  --output text 2>/dev/null || echo "")

if [ -n "$SECRETS_JSON" ] && [ "$SECRETS_JSON" != "null" ]; then
  CERT=$(echo "$SECRETS_JSON" | jq -r '.CLOUDFLARE_ORIGIN_CERTIFICATE // empty')
  KEY=$(echo "$SECRETS_JSON" | jq -r '.CLOUDFLARE_ORIGIN_PRIVATE_CERTIFICATE // empty')
  
  if [ -n "$CERT" ] && [ -n "$KEY" ]; then
    # Fix PEM format - certificates are stored as single line, need newlines after header and before footer
    echo "$CERT" | \
      sed 's/-----BEGIN CERTIFICATE----- /-----BEGIN CERTIFICATE-----\n/' | \
      sed 's/ -----END CERTIFICATE-----/\n-----END CERTIFICATE-----/' \
      > /etc/ssl/certs/cloudflare-origin.pem
    echo "$KEY" | \
      sed 's/-----BEGIN PRIVATE KEY----- /-----BEGIN PRIVATE KEY-----\n/' | \
      sed 's/ -----END PRIVATE KEY-----/\n-----END PRIVATE KEY-----/' \
      > /etc/ssl/private/cloudflare-origin.key
    chmod 644 /etc/ssl/certs/cloudflare-origin.pem
    chmod 600 /etc/ssl/private/cloudflare-origin.key
    echo "Cloudflare Origin certificate loaded from Secrets Manager"
  else
    echo "WARNING: CLOUDFLARE_ORIGIN_CERTIFICATE or CLOUDFLARE_ORIGIN_PRIVATE_CERTIFICATE not found in secret"
    echo "Nginx will fail to start until certificate is configured"
  fi
else
  echo "WARNING: Could not fetch secrets from revendiste/dev/backend-secrets"
  echo "Nginx will fail to start until certificate is configured"
fi

# Create nginx config for Cloudflare proxied traffic
# Origin serves HTTPS on port 443 (Full SSL mode)
# HTTP on port 80 redirects to HTTPS
cat > /etc/nginx/conf.d/revendiste.conf << 'EOF'
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name dev.revendiste.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl;
    http2 on;
    server_name dev.revendiste.com;

    # SSL certificate (Cloudflare Origin CA)
    ssl_certificate /etc/ssl/certs/cloudflare-origin.pem;
    ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy API requests to backend container (^~ ensures this takes precedence)
    location ^~ /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy all other requests to frontend container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Create a clean nginx.conf
cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    include /etc/nginx/conf.d/*.conf;
}
EOF

# Start and enable nginx
systemctl start nginx
systemctl enable nginx

# Create directory for application
mkdir -p /opt/revendiste
chown ec2-user:ec2-user /opt/revendiste

# Set up GitHub Actions SSH key
mkdir -p /home/ec2-user/.ssh
echo "${github_ssh_public_key}" >> /home/ec2-user/.ssh/authorized_keys
chmod 600 /home/ec2-user/.ssh/authorized_keys
chmod 700 /home/ec2-user/.ssh
chown -R ec2-user:ec2-user /home/ec2-user/.ssh

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

# Note: Cloudflare Origin CA certificate and private key should be uploaded manually
# Certificate: /etc/ssl/certs/cloudflare-origin.pem
# Private key: /etc/ssl/private/cloudflare-origin.key
# chmod 644 /etc/ssl/certs/cloudflare-origin.pem
# chmod 600 /etc/ssl/private/cloudflare-origin.key

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
    listen 443 ssl http2;
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

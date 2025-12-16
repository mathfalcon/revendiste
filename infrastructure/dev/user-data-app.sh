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

# Create nginx config for Cloudflare proxied traffic
# Cloudflare handles SSL/TLS termination and HTTP->HTTPS redirects
# Origin only needs to serve HTTP on port 80
cat > /etc/nginx/conf.d/revendiste.conf << 'EOF'
server {
    listen 80;
    server_name dev.revendiste.com;

    # Proxy API requests to backend container
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
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
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
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

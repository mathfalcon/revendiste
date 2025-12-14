#!/bin/bash
# User data script for frontend EC2 instance setup
# Installs Docker and configures for frontend SSR deployment

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



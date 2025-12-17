# Security group for combined app EC2 instance
resource "aws_security_group" "app" {
  name        = "${local.name_prefix}-app"
  description = "Security group for revendiste dev app EC2 instance (frontend + backend)"

  # SSH access
  ingress {
    description = "SSH from allowed CIDR blocks"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr_blocks
  }

  # HTTP access - restricted to Cloudflare IP ranges
  # Cloudflare IP ranges (IPv4 and IPv6) - updated as of 2024
  # See: https://www.cloudflare.com/ips/ and https://www.cloudflare.com/ips-v6/
  ingress {
    description = "HTTP from Cloudflare IP ranges (IPv4)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [
      "173.245.48.0/20",
      "103.21.244.0/22",
      "103.22.200.0/22",
      "103.31.4.0/22",
      "141.101.64.0/18",
      "108.162.192.0/18",
      "190.93.240.0/20",
      "188.114.96.0/20",
      "197.234.240.0/22",
      "198.41.128.0/17",
      "162.158.0.0/15",
      "104.16.0.0/12",
      "172.64.0.0/13",
      "131.0.72.0/22",
    ]
    ipv6_cidr_blocks = [
      "2400:cb00::/32",
      "2606:4700::/32",
      "2803:f800::/32",
      "2405:b500::/32",
      "2405:8100::/32",
      "2a06:98c0::/29",
      "2c0f:f248::/32",
    ]
  }

  # HTTPS access - restricted to Cloudflare IP ranges
  ingress {
    description = "HTTPS from Cloudflare IP ranges (IPv4)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [
      "173.245.48.0/20",
      "103.21.244.0/22",
      "103.22.200.0/22",
      "103.31.4.0/22",
      "141.101.64.0/18",
      "108.162.192.0/18",
      "190.93.240.0/20",
      "188.114.96.0/20",
      "197.234.240.0/22",
      "198.41.128.0/17",
      "162.158.0.0/15",
      "104.16.0.0/12",
      "172.64.0.0/13",
      "131.0.72.0/22",
    ]
    ipv6_cidr_blocks = [
      "2400:cb00::/32",
      "2606:4700::/32",
      "2803:f800::/32",
      "2405:b500::/32",
      "2405:8100::/32",
      "2a06:98c0::/29",
      "2c0f:f248::/32",
    ]
  }

  # Frontend container port (internal, nginx proxies to it)
  ingress {
    description = "Frontend container port (internal)"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["127.0.0.1/32"]
  }

  # Backend container port (internal, nginx proxies to it)
  ingress {
    description = "Backend container port (internal)"
    from_port   = var.port
    to_port     = var.port
    protocol    = "tcp"
    cidr_blocks = ["127.0.0.1/32"]
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-app-sg"
  }
}



# Security group for frontend EC2 instance (created first to avoid circular dependency)
resource "aws_security_group" "frontend" {
  name        = "${local.name_prefix}-frontend"
  description = "Security group for revendiste dev frontend EC2 instance"

  # SSH access
  ingress {
    description = "SSH from allowed CIDR blocks"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr_blocks
  }

  # HTTP access
  ingress {
    description = "HTTP from allowed CIDR blocks"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidr_blocks
  }

  # HTTPS access
  ingress {
    description = "HTTPS from allowed CIDR blocks"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidr_blocks
  }

  # Frontend SSR port
  ingress {
    description = "Frontend SSR port"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidr_blocks
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
    Name = "${local.name_prefix}-frontend-sg"
  }
}

# Security group for backend EC2 instance
resource "aws_security_group" "backend" {
  name        = "${local.name_prefix}-backend"
  description = "Security group for revendiste dev backend EC2 instance"

  # SSH access
  ingress {
    description = "SSH from allowed CIDR blocks"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr_blocks
  }

  # Backend API port (accessible from frontend and external)
  ingress {
    description     = "Backend API port from frontend"
    from_port       = var.port
    to_port         = var.port
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend.id]
  }

  ingress {
    description = "Backend API port from external"
    from_port   = var.port
    to_port     = var.port
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidr_blocks
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
    Name = "${local.name_prefix}-backend-sg"
  }
}



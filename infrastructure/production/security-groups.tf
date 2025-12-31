# Security Groups

# Security group for ALB (Application Load Balancer)
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # HTTP from Cloudflare IP ranges
  ingress {
    description = "HTTP from Cloudflare IP ranges"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.cloudflare_ip_ranges
    ipv6_cidr_blocks = var.cloudflare_ipv6_ranges
  }

  # HTTPS from Cloudflare IP ranges
  ingress {
    description = "HTTPS from Cloudflare IP ranges"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.cloudflare_ip_ranges
    ipv6_cidr_blocks = var.cloudflare_ipv6_ranges
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "${local.name_prefix}-alb-sg"
  }
}

# Security group for ECS tasks (frontend and backend)
resource "aws_security_group" "ecs_tasks" {
  name        = "${local.name_prefix}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  # Allow inbound from ALB only
  ingress {
    description     = "Allow inbound from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "${local.name_prefix}-ecs-tasks-sg"
  }
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS Aurora cluster"
  vpc_id      = aws_vpc.main.id

  # Allow PostgreSQL from ECS tasks only
  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  # No outbound rules needed for RDS

  tags = {
    Name = "${local.name_prefix}-rds-sg"
  }
}


# Security Groups Module
# Creates security groups for ALB, ECS tasks, and RDS

# Security group for ALB (Application Load Balancer)
resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  # HTTP from Cloudflare IP ranges
  ingress {
    description      = "HTTP from Cloudflare IP ranges"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = var.cloudflare_ip_ranges
    ipv6_cidr_blocks = var.cloudflare_ipv6_ranges
  }

  # HTTPS from Cloudflare IP ranges
  ingress {
    description      = "HTTPS from Cloudflare IP ranges"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = var.cloudflare_ip_ranges
    ipv6_cidr_blocks = var.cloudflare_ipv6_ranges
  }

  # Allow all outbound traffic
  egress {
    description      = "Allow all outbound traffic"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-alb-sg"
  })
}

# Security group for ECS tasks (frontend and backend)
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.name_prefix}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  # Allow inbound from ALB only
  ingress {
    description     = "Allow inbound from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Allow ECS tasks to communicate with each other (for Cloud Map service discovery)
  ingress {
    description = "Allow ECS tasks to communicate internally (Cloud Map)"
    from_port   = var.backend_port
    to_port     = var.backend_port
    protocol    = "tcp"
    self        = true
  }

  # Allow all outbound traffic
  egress {
    description      = "Allow all outbound traffic"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-ecs-tasks-sg"
  })
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.name_prefix}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = var.vpc_id

  # Allow PostgreSQL from ECS tasks only
  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-rds-sg"
  })
}

# Application Load Balancer

# ALB for Frontend and Backend
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection       = true
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  # Access logs (optional, for debugging)
  # access_logs {
  #   bucket  = aws_s3_bucket.alb_logs.id
  #   enabled = true
  # }

  tags = {
    Name = "${local.name_prefix}-alb"
  }
}

# Target Group for Backend
resource "aws_lb_target_group" "backend" {
  name        = "rev-prod-backend-tg" # Shortened to meet 32 char limit
  port        = var.backend_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  # Deregistration delay for graceful shutdown
  deregistration_delay = 30

  tags = {
    Name = "${local.name_prefix}-backend-tg"
  }
}

# Target Group for Frontend
resource "aws_lb_target_group" "frontend" {
  name        = "rev-prod-frontend-tg" # Shortened to meet 32 char limit
  port        = var.frontend_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200"
  }

  # Sticky sessions to prevent asset mismatch during rolling deployments
  # Ensures all requests from the same user go to the same task
  # This prevents: old index.html → new task → 404 for assets
  # 10 minutes is sufficient since deployments take < 5 minutes
  stickiness {
    enabled         = true
    type            = "lb_cookie"
    cookie_duration = 600 # 10 minutes (covers deployment window + buffer)
  }

  # Deregistration delay for graceful shutdown
  deregistration_delay = 30

  tags = {
    Name = "${local.name_prefix}-frontend-tg"
  }
}

# HTTPS Listener (redirect HTTP to HTTPS)
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn

  depends_on = [aws_acm_certificate_validation.main]

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Not Found"
      status_code  = "404"
    }
  }
}

# HTTP Listener (redirect all HTTP to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Backend Listener Rule on HTTPS (path-based: /api/*)
resource "aws_lb_listener_rule" "backend" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# Frontend Listener Rule (default - everything else)
resource "aws_lb_listener_rule" "frontend" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  condition {
    host_header {
      values = [var.domain_name, "www.${var.domain_name}"]
    }
  }
}

# ACM Certificate for HTTPS
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "www.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${local.name_prefix}-certificate"
  }
}

# Certificate validation
# DNS validation records are automatically created in Cloudflare
# Validation will complete once DNS records propagate (usually 5-10 minutes)
# Note: Explicit depends_on removed to avoid cycles - Terraform auto-detects dependency
resource "aws_acm_certificate_validation" "main" {
  certificate_arn = aws_acm_certificate.main.arn

  timeouts {
    create = "10m"
  }

  lifecycle {
    create_before_destroy = true
  }
}


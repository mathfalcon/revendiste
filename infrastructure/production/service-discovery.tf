# AWS Cloud Map Service Discovery
# Enables direct service-to-service communication within the VPC
# Frontend SSR can call backend directly without going through ALB/Internet Gateway

# Private DNS namespace for internal service discovery
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "revendiste.local"
  description = "Private DNS namespace for Revendiste service discovery"
  vpc         = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-service-discovery"
  }
}

# Service discovery service for backend
# Registers backend ECS tasks with their private IPs
resource "aws_service_discovery_service" "backend" {
  name = "backend"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10 # Low TTL for quick failover when tasks change
      type = "A"
    }

    # Return multiple records for basic load balancing
    routing_policy = "MULTIVALUE"
  }

  # Use ECS-managed health checks (integrated with ECS task health)
  health_check_custom_config {
    failure_threshold = 1
  }

  tags = {
    Name = "${local.name_prefix}-backend-discovery"
  }
}


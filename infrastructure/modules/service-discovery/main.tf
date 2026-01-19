# Service Discovery Module
# Creates AWS Cloud Map for internal service-to-service communication

# Private DNS namespace for internal service discovery
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = var.namespace_name
  description = "Private DNS namespace for Revendiste service discovery"
  vpc         = var.vpc_id

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-service-discovery"
  })
}

# Service discovery service for backend
resource "aws_service_discovery_service" "backend" {
  name = "backend"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-backend-discovery"
  })
}

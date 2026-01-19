# Service Discovery Module Outputs

output "namespace_id" {
  description = "Service discovery namespace ID"
  value       = aws_service_discovery_private_dns_namespace.main.id
}

output "namespace_name" {
  description = "Service discovery namespace name"
  value       = aws_service_discovery_private_dns_namespace.main.name
}

output "backend_service_arn" {
  description = "Backend service discovery service ARN"
  value       = aws_service_discovery_service.backend.arn
}

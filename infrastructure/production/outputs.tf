output "environment" {
  description = "Current environment"
  value       = "production"
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "backend_service_name" {
  description = "Name of the backend ECS service"
  value       = aws_ecs_service.backend.name
}

output "frontend_service_name" {
  description = "Name of the frontend ECS service"
  value       = aws_ecs_service.frontend.name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "rds_instance_endpoint" {
  description = "RDS PostgreSQL instance endpoint"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "rds_instance_port" {
  description = "RDS PostgreSQL instance port"
  value       = aws_db_instance.main.port
}

output "db_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
  sensitive   = true
}

output "backend_secrets_arn" {
  description = "ARN of the backend secrets secret"
  value       = aws_secretsmanager_secret.backend_secrets.arn
  sensitive   = true
}

output "backend_ecr_repository_url" {
  description = "URL of the backend ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_repository_url" {
  description = "URL of the frontend ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.main.arn
}

output "acm_certificate_validation_records" {
  description = "DNS validation records for ACM certificate (add these to Cloudflare)"
  value       = aws_acm_certificate.main.domain_validation_options
  sensitive   = false
}

output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
}

output "api_domain" {
  description = "API domain (for DNS configuration)"
  value       = "api.${var.domain_name}"
}

output "r2_public_bucket_name" {
  description = "R2 public bucket name"
  value       = cloudflare_r2_bucket.production_public.name
}

output "r2_private_bucket_name" {
  description = "R2 private bucket name"
  value       = cloudflare_r2_bucket.production_private.name
}

output "r2_bucket_location" {
  description = "R2 bucket location"
  value       = cloudflare_r2_bucket.production_public.location
}

output "cdn_domain" {
  description = "CDN domain for public assets"
  value       = cloudflare_r2_custom_domain.production_cdn.domain
}

output "rds_alarms_sns_topic_arn" {
  description = "ARN of the SNS topic for RDS alarm notifications. Subscribe your email (FREE) to receive alerts."
  value       = aws_sns_topic.rds_alarms.arn
}

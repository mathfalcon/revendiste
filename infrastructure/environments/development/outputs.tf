# Outputs for Dev Environment

output "environment" {
  description = "Current environment"
  value       = "dev"
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.alb.alb_arn
}

output "backend_service_name" {
  description = "Name of the backend ECS service"
  value       = module.ecs.backend_service_name
}

output "frontend_service_name" {
  description = "Name of the frontend ECS service"
  value       = module.ecs.frontend_service_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "rds_address" {
  description = "RDS instance address (hostname only)"
  value       = module.rds.db_address
  sensitive   = true
}

output "db_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = module.rds.db_credentials_secret_arn
  sensitive   = true
}

output "backend_secrets_arn" {
  description = "ARN of the backend secrets secret"
  value       = module.secrets.backend_secrets_arn
  sensitive   = true
}

output "backend_ecr_repository_url" {
  description = "URL of the backend ECR repository"
  value       = module.ecr.backend_repository_url
}

output "frontend_ecr_repository_url" {
  description = "URL of the frontend ECR repository"
  value       = module.ecr.frontend_repository_url
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = module.alb.acm_certificate_arn
}

output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
}

output "r2_public_bucket_name" {
  description = "R2 public bucket name"
  value       = module.r2.public_bucket_name
}

output "r2_private_bucket_name" {
  description = "R2 private bucket name"
  value       = module.r2.private_bucket_name
}

output "cdn_domain" {
  description = "CDN domain for public assets"
  value       = module.r2.cdn_domain
}

output "face_liveness_role_arn" {
  description = "IAM Role ARN for Face Liveness SDK"
  value       = module.identity_verification.face_liveness_role_arn
}

# Bastion host outputs for database access
output "bastion_instance_id" {
  description = "Bastion host instance ID for SSM port forwarding"
  value       = module.bastion.instance_id
}

output "db_tunnel_command" {
  description = "Command to create a tunnel to the RDS database via SSM"
  value       = "aws ssm start-session --target ${module.bastion.instance_id} --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters '{\"host\":[\"${module.rds.db_address}\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"5432\"]}' --region ${var.aws_region}"
}

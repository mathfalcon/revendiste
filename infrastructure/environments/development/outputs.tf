# Outputs for Dev Environment (single-EC2 architecture)
#
# Removed (formerly here, all referencing deleted ECS/ALB/RDS/Bastion modules):
#   alb_dns_name, alb_arn, backend_service_name, frontend_service_name,
#   ecs_cluster_name, rds_endpoint, rds_address, db_secret_arn (rds-backed),
#   acm_certificate_arn, bastion_instance_id, db_tunnel_command.

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

output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
}

# ── EC2 app host ──────────────────────────────────────────────────────────
output "app_instance_id" {
  description = "EC2 instance ID for the dev app host (use with aws ssm send-command)"
  value       = module.ec2_app.instance_id
}

output "app_public_ip" {
  description = "Elastic IP of the dev app host (Cloudflare DNS target)"
  value       = module.ec2_app.instance_public_ip
}

output "app_security_group_id" {
  description = "Security group attached to the dev app host"
  value       = module.ec2_app.app_compute_security_group_id
}

output "app_data_volume_id" {
  description = "EBS volume ID for the dev app data volume (Postgres + Docker cache)"
  value       = module.ec2_app.data_volume_id
}

output "deploy_artifacts_bucket" {
  description = "S3 bucket the deploy-dev-ec2 workflow uploads compose/Caddyfile/scripts tarballs to"
  value       = module.ec2_app.deploy_artifacts_bucket
}

# ── Secrets ───────────────────────────────────────────────────────────────
output "backend_secrets_arn" {
  description = "ARN of the backend secrets secret"
  value       = module.secrets.backend_secrets_arn
  sensitive   = true
}

output "db_credentials_secret_arn" {
  description = "ARN of the dev DB credentials secret (in-VM Postgres)"
  value       = module.ec2_app.db_credentials_secret_arn
  sensitive   = true
}

output "db_credentials_secret_name" {
  description = "Name of the dev DB credentials secret"
  value       = module.ec2_app.db_credentials_secret_name
}

# ── ECR ───────────────────────────────────────────────────────────────────
output "backend_ecr_repository_url" {
  description = "URL of the backend ECR repository"
  value       = module.ecr.backend_repository_url
}

output "frontend_ecr_repository_url" {
  description = "URL of the frontend ECR repository"
  value       = module.ecr.frontend_repository_url
}

# ── Cloudflare / R2 ───────────────────────────────────────────────────────
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

# ── Operator helpers ──────────────────────────────────────────────────────
output "ssm_session_command" {
  description = "Open an SSM Session Manager shell on the dev EC2 (replaces the bastion-based DB tunnel)"
  value       = "aws ssm start-session --target ${module.ec2_app.instance_id} --region ${var.aws_region}"
}

output "db_psql_command" {
  description = "Connect to the in-VM Postgres via the dev EC2 (after `aws ssm start-session`)"
  value       = "docker exec -it revendiste-dev-postgres psql -U ${var.db_username} -d ${var.db_name}"
  sensitive   = true
}

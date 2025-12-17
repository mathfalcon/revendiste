output "app_instance_id" {
  description = "ID of the app EC2 instance (frontend + backend)"
  value       = aws_instance.app.id
}

output "app_instance_public_ip" {
  description = "Public IP address of the app EC2 instance"
  value       = aws_eip.app.public_ip
}

output "app_instance_public_dns" {
  description = "Public DNS name of the app EC2 instance"
  value       = aws_instance.app.public_dns
}

output "api_url" {
  description = "API base URL"
  value       = "https://${var.domain_name}/api"
}

output "frontend_domain" {
  description = "Frontend domain name"
  value       = var.domain_name
}

output "r2_public_bucket_name" {
  description = "R2 public bucket name"
  value       = cloudflare_r2_bucket.dev_public.name
}

output "r2_private_bucket_name" {
  description = "R2 private bucket name"
  value       = cloudflare_r2_bucket.dev_private.name
}

output "r2_bucket_location" {
  description = "R2 bucket location"
  value       = cloudflare_r2_bucket.dev_public.location
}

output "cdn_domain" {
  description = "CDN domain for public assets"
  value       = cloudflare_r2_custom_domain.dev_cdn.domain_name
}

output "backend_ecr_repository_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_repository_url" {
  description = "ECR repository URL for frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "app_ssh_command" {
  description = "Command to SSH into the app instance"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.app.public_ip}"
  sensitive   = true
}

output "backend_secrets_arn" {
  description = "ARN of the Secrets Manager secret containing all backend secrets"
  value       = aws_secretsmanager_secret.backend_secrets.arn
}

output "backend_secrets_name" {
  description = "Name of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.backend_secrets.name
}


output "deployment_instructions" {
  description = "Instructions for deployment"
  sensitive   = true
  value       = <<-EOT
    To deploy your application:
    
    App Instance (Frontend + Backend):
    1. SSH into app instance:
       ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.app.public_ip}
    
    2. The instance is ready with Docker and nginx installed.
    
    3. Use GitHub Actions workflow for automatic deployment!
    
    Secrets are stored in AWS Secrets Manager (${aws_secretsmanager_secret.backend_secrets.name}) and can be loaded using:
    aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.backend_secrets.name} --query 'SecretString' --output text
  EOT
}



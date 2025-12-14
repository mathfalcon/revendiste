output "backend_instance_id" {
  description = "ID of the backend EC2 instance"
  value       = aws_instance.backend.id
}

output "backend_instance_public_ip" {
  description = "Public IP address of the backend EC2 instance"
  value       = aws_eip.backend.public_ip
}

output "backend_instance_public_dns" {
  description = "Public DNS name of the backend EC2 instance"
  value       = aws_instance.backend.public_dns
}

output "frontend_instance_id" {
  description = "ID of the frontend EC2 instance"
  value       = aws_instance.frontend.id
}

output "frontend_instance_public_ip" {
  description = "Public IP address of the frontend EC2 instance"
  value       = aws_eip.frontend.public_ip
}

output "frontend_instance_public_dns" {
  description = "Public DNS name of the frontend EC2 instance"
  value       = aws_instance.frontend.public_dns
}

output "api_domain" {
  description = "API domain name"
  value       = "${var.api_subdomain}.revendiste.com"
}

output "frontend_domain" {
  description = "Frontend domain name"
  value       = var.domain_name
}

output "r2_bucket_name" {
  description = "R2 bucket name"
  value       = cloudflare_r2_bucket.dev_storage.name
}

output "r2_bucket_location" {
  description = "R2 bucket location"
  value       = cloudflare_r2_bucket.dev_storage.location
}

output "backend_ecr_repository_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_repository_url" {
  description = "ECR repository URL for frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "backend_ssh_command" {
  description = "Command to SSH into the backend instance"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.backend.public_ip}"
}

output "frontend_ssh_command" {
  description = "Command to SSH into the frontend instance"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.frontend.public_ip}"
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
  value       = <<-EOT
    To deploy your application:
    
    Backend:
    1. SSH into backend instance:
       ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.backend.public_ip}
    
    2. The instance is ready with Docker installed.
    
    Frontend:
    1. SSH into frontend instance:
       ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.frontend.public_ip}
    
    2. The instance is ready with Docker installed.
    
    3. Use GitHub Actions workflow for automatic deployment!
    
    Secrets are stored in AWS Secrets Manager (${aws_secretsmanager_secret.backend_secrets.name}) and can be loaded using:
    aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.backend_secrets.name} --query 'SecretString' --output text
  EOT
}



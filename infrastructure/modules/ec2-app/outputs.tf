# EC2 App Module Outputs

output "instance_id" {
  description = "EC2 instance ID (used by aws ssm send-command for deploys)"
  value       = aws_instance.app.id
}

output "instance_public_ip" {
  description = "Public Elastic IP attached to the instance (Cloudflare DNS target)"
  value       = aws_eip.instance.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name AWS assigns to the EIP"
  value       = aws_eip.instance.public_dns
}

output "app_compute_security_group_id" {
  description = "Security group attached to the app instance (use this when allowing 5432 ingress on RDS for the prod variant)"
  value       = aws_security_group.app_compute.id
}

output "instance_role_arn" {
  description = "ARN of the IAM role attached to the instance profile"
  value       = aws_iam_role.instance.arn
}

output "instance_role_name" {
  description = "Name of the IAM role attached to the instance profile"
  value       = aws_iam_role.instance.name
}

output "data_volume_id" {
  description = "EBS volume ID for the dedicated data volume (Postgres + Docker cache)"
  value       = aws_ebs_volume.data.id
}

output "db_credentials_secret_arn" {
  description = "ARN of the DB credentials secret backing this instance (created by the module in dev, passed in for prod)"
  value       = local.effective_db_credentials_secret_arn
}

output "db_credentials_secret_name" {
  description = "Name of the DB credentials secret created by the module (empty when create_db_credentials_secret = false)"
  value       = var.create_db_credentials_secret ? aws_secretsmanager_secret.db_credentials[0].name : ""
}

output "deploy_artifacts_bucket" {
  description = "S3 bucket the deploy workflow uploads compose / Caddyfile / scripts tarballs to"
  value       = aws_s3_bucket.deploy_artifacts.bucket
}


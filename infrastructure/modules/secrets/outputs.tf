# Secrets Module Outputs

output "backend_secrets_arn" {
  description = "ARN of the backend secrets secret"
  value       = aws_secretsmanager_secret.backend_secrets.arn
  sensitive   = true
}

output "backend_secrets_name" {
  description = "Name of the backend secrets secret"
  value       = aws_secretsmanager_secret.backend_secrets.name
}

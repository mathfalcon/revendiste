# Secrets Module
# Creates Secrets Manager secret for backend environment variables

# Secret for all backend environment variables
resource "aws_secretsmanager_secret" "backend_secrets" {
  name                    = "${var.name_prefix}/backend-secrets"
  description             = "All backend environment variables for ${var.environment} environment"
  recovery_window_in_days = 7

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-backend-secrets"
  })

  lifecycle {
    prevent_destroy = false
    ignore_changes = [
      tags,
    ]
  }
}

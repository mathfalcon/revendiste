# Secrets Manager for Backend Environment Variables

# Secret for all backend environment variables
# Note: The actual secret values should be populated manually in AWS Secrets Manager console
# or via AWS CLI after the secret is created. This resource only creates the secret container.
resource "aws_secretsmanager_secret" "backend_secrets" {
  name                    = "${local.name_prefix}/backend-secrets"
  description             = "All backend environment variables for production environment"
  recovery_window_in_days = 7

  tags = {
    Name = "${local.name_prefix}-backend-secrets"
  }

  lifecycle {
    # Prevent Terraform from recreating the secret unnecessarily
    # If the secret already exists (even if scheduled for deletion),
    # Terraform will try to manage it rather than recreate it
    prevent_destroy = false

    # Ignore changes to tags that might be added/modified outside Terraform
    # This prevents Terraform from detecting changes and trying to update/recreate
    ignore_changes = [
      tags,
    ]
  }
}

# Note: To populate the secret, use AWS CLI or Console:
# 
# Example with AWS CLI:
# aws secretsmanager put-secret-value \
#   --secret-id revendiste-production/backend-secrets \
#   --secret-string file://secrets.json \
#   --region sa-east-1
#
# Where secrets.json contains all backend environment variables as JSON:
# {
#   "CLERK_SECRET_KEY": "...",
#   "DLOCAL_API_KEY": "...",
#   "DLOCAL_SECRET_KEY": "...",
#   "RESEND_API_KEY": "...",
#   "EXCHANGE_RATE_API_KEY": "...",
#   ... (all other backend secrets)
# }


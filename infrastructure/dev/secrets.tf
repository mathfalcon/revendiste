resource "aws_secretsmanager_secret" "backend_secrets" {
  name        = "revendiste/dev/backend-secrets"
  description = "All backend environment variables for dev environment"

  tags = {
    Name = "revendiste-dev-backend-secrets"
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



resource "aws_secretsmanager_secret" "backend_secrets" {
  name        = "revendiste/dev/backend-secrets"
  description = "All backend environment variables for dev environment"

  tags = {
    Name = "revendiste-dev-backend-secrets"
  }
}



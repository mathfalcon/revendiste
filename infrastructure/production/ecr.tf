# ECR Repositories for Docker Images

# Backend repository
resource "aws_ecr_repository" "backend" {
  name                 = "revendiste/backend-production"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true # Enable for production security
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${local.name_prefix}-backend-ecr"
  }
}

# Frontend repository
resource "aws_ecr_repository" "frontend" {
  name                 = "revendiste/frontend-production"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true # Enable for production security
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${local.name_prefix}-frontend-ecr"
  }
}

# Lifecycle policy to keep only last 20 images (cost optimization)
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 20 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 20
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 20 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 20
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}


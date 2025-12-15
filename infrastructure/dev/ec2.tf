# IAM role for EC2 instances (used by both backend and frontend)
resource "aws_iam_role" "ec2_instances" {
  name = "${local.name_prefix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-ec2-role"
  }
}

# IAM instance profile
resource "aws_iam_instance_profile" "ec2_instances" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_instances.name
}

# IAM policy for EC2 to read Secrets Manager secret
resource "aws_iam_role_policy" "ec2_secrets_manager_read" {
  name = "${local.name_prefix}-ec2-secrets-manager-read"
  role = aws_iam_role.ec2_instances.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
        ]
        Resource = [
          aws_secretsmanager_secret.backend_secrets.arn,
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
        ]
        Resource = [
          "arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:alias/aws/secretsmanager",
        ]
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${var.aws_region}.amazonaws.com"
          }
        }
      },
    ]
  })
}

# Note: Frontend instance also uses this IAM profile (for ECR access)
# Backend-specific secrets access is included but frontend doesn't need it

# Single EC2 instance for both frontend and backend
resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_instances.name

  user_data = base64encode(templatefile("${path.module}/user-data-app.sh", {
    github_ssh_public_key = var.github_actions_ssh_public_key
  }))

  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }

  tags = {
    Name = "${local.name_prefix}-app"
  }
}

# Elastic IP for app instance
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name = "${local.name_prefix}-app-eip"
  }
}



# EC2 App Module
#
# Single Graviton EC2 + EIP + dedicated EBS data volume + IAM instance profile.
# Designed so a future migration off this pattern (back to ECS, or to a different
# host) is a `terraform destroy` of this module, not a rewrite — the Dockerfiles,
# RDS (where applicable), Secrets Manager, ECR, and Cloudflare DNS module all
# stay untouched.
#
# IMPORTANT for `t4g.small → t4g.medium` upgrades: Postgres data lives on
# `aws_ebs_volume.data`, NOT on the instance root volume. Changing
# `var.instance_type` replaces the EC2 (forces new resource), but the data
# volume is preserved and re-attached to the new instance via
# `aws_volume_attachment.data` (the volume is detached on instance destroy
# because we set `force_detach = true`).

data "aws_ssm_parameter" "al2023_arm64" {
  # Latest Amazon Linux 2023 minimal ARM64 AMI.
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

# ─── Security group ──────────────────────────────────────────────────────────

resource "aws_security_group" "app_compute" {
  name        = "${var.name_prefix}-app-compute-sg"
  description = "Security group for the single-EC2 app host (Cloudflare ingress only)"
  vpc_id      = var.vpc_id

  ingress {
    description      = "HTTP from Cloudflare IPv4"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = var.cloudflare_ip_ranges
    ipv6_cidr_blocks = var.cloudflare_ipv6_ranges
  }

  ingress {
    description      = "HTTPS from Cloudflare IPv4"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = var.cloudflare_ip_ranges
    ipv6_cidr_blocks = var.cloudflare_ipv6_ranges
  }

  # Note: SSM (port 22 alternative) is reached via outbound HTTPS to the SSM
  # service endpoints, no inbound SSH or SSM port required.
  egress {
    description      = "All egress (package updates, ECR pulls, Cloudflare/dLocal/Clerk APIs)"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-app-compute-sg"
  })
}

# ─── IAM (instance profile) ─────────────────────────────────────────────────

resource "aws_iam_role" "instance" {
  name = "${var.name_prefix}-app-compute-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-app-compute-role"
  })
}

# SSM Session Manager (replaces SSH) + CloudWatch agent baseline.
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Pull images from the env's ECR repos. Scoped to the two repos the module is
# wired to so a compromised instance can't pull arbitrary images from any repo
# in the account.
resource "aws_iam_role_policy" "ecr_pull" {
  name = "${var.name_prefix}-app-compute-ecr-pull"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "EcrAuth"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Sid    = "EcrPull"
        Effect = "Allow"
        Action = [
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:DescribeImages"
        ]
        Resource = [
          var.ecr_backend_repository_arn,
          var.ecr_frontend_repository_arn,
        ]
      }
    ]
  })
}

# Read the dev secrets at boot (bootstrap-env.sh) — backend secrets always,
# DB credentials secret either created here (dev) or passed in (prod).
locals {
  effective_db_credentials_secret_arn = var.create_db_credentials_secret ? aws_secretsmanager_secret.db_credentials[0].arn : var.db_credentials_secret_arn
}

# S3 bucket for shipping deploy/ artifacts (compose file, Caddyfile, scripts)
# from CI to the instance. Versioned + private + lifecycle-pruned. Avoids
# embedding compose contents in SSM parameters (4 KB / 8 KB hard limit).
resource "aws_s3_bucket" "deploy_artifacts" {
  bucket = "${var.name_prefix}-deploy-artifacts"

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-deploy-artifacts"
    Purpose = "ec2-app-deploy"
  })
}

resource "aws_s3_bucket_public_access_block" "deploy_artifacts" {
  bucket = aws_s3_bucket.deploy_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "deploy_artifacts" {
  bucket = aws_s3_bucket.deploy_artifacts.id

  rule {
    id     = "expire-old-bundles"
    status = "Enabled"

    # Apply to all objects in the bucket. AWS provider 5.x requires a non-empty
    # filter block; an empty prefix is the documented way to mean "everything".
    filter {
      prefix = ""
    }

    expiration {
      days = 14
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_iam_role_policy" "deploy_artifacts_read" {
  name = "${var.name_prefix}-app-compute-deploy-artifacts-read"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:ListBucket",
      ]
      Resource = [
        aws_s3_bucket.deploy_artifacts.arn,
        "${aws_s3_bucket.deploy_artifacts.arn}/*",
      ]
    }]
  })
}

resource "aws_iam_role_policy" "secrets_read" {
  name = "${var.name_prefix}-app-compute-secrets-read"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "ReadAppSecrets"
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
      ]
      Resource = [
        var.backend_secrets_arn,
        local.effective_db_credentials_secret_arn,
      ]
    }]
  })
}

resource "aws_iam_instance_profile" "instance" {
  name = "${var.name_prefix}-app-compute-profile"
  role = aws_iam_role.instance.name

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-app-compute-profile"
  })
}

# ─── Optional: dev DB credentials secret ────────────────────────────────────
#
# When `create_db_credentials_secret = true` the module owns a Secrets Manager
# secret pointing at the in-VM Postgres. The password is generated once and
# never logged — bootstrap-env.sh fetches the JSON at boot and parses it.

resource "random_password" "db_password" {
  count   = var.create_db_credentials_secret ? 1 : 0
  length  = 40
  # Avoid characters that confuse env-file parsing.
  special          = true
  override_special = "!@#%^*-_=+"
}

resource "aws_secretsmanager_secret" "db_credentials" {
  count                   = var.create_db_credentials_secret ? 1 : 0
  name                    = "${var.name_prefix}-db-credentials"
  description             = "DB_CREDENTIALS_JSON for the ${var.environment} EC2 (in-VM Postgres)"
  recovery_window_in_days = 7

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-db-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  count     = var.create_db_credentials_secret ? 1 : 0
  secret_id = aws_secretsmanager_secret.db_credentials[0].id
  secret_string = jsonencode({
    username     = var.db_username
    password     = random_password.db_password[0].result
    dbname       = var.db_name
    host         = var.db_host
    port         = var.db_port
    database_url = "postgresql://${var.db_username}:${random_password.db_password[0].result}@${var.db_host}:${var.db_port}/${var.db_name}"
  })
}

# ─── EC2 instance + EIP + data volume ────────────────────────────────────────

resource "aws_eip" "instance" {
  domain = "vpc"

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-app-compute-eip"
  })
}

# Dedicated data volume so instance-type changes (t4g.small → t4g.medium) do
# not destroy Postgres data. Mounted at /var/lib/docker on first boot.
resource "aws_ebs_volume" "data" {
  availability_zone = data.aws_subnet.target.availability_zone
  size              = var.data_volume_size_gb
  type              = "gp3"
  encrypted         = true

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-app-compute-data"
    Purpose = "docker-and-postgres"
  })

  lifecycle {
    # Replacing the EC2 must not destroy the data volume.
    prevent_destroy = false
  }
}

data "aws_subnet" "target" {
  id = var.subnet_id
}

resource "aws_instance" "app" {
  ami                  = data.aws_ssm_parameter.al2023_arm64.value
  instance_type        = var.instance_type
  subnet_id            = var.subnet_id
  iam_instance_profile = aws_iam_instance_profile.instance.name

  vpc_security_group_ids = [aws_security_group.app_compute.id]

  associate_public_ip_address = false # We attach the EIP separately so the IP is stable across replacements.

  metadata_options {
    http_tokens   = "required" # IMDSv2 only
    http_endpoint = "enabled"
  }

  root_block_device {
    volume_size           = var.root_volume_size_gb
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  user_data = templatefile("${path.module}/user-data.sh.tftpl", {
    name_prefix               = var.name_prefix
    environment               = var.environment
    aws_region                = var.aws_region
    aws_account_id            = var.aws_account_id
    app_hostname              = var.app_hostname
    image_tag                 = var.image_tag
    db_credentials_secret_id  = local.effective_db_credentials_secret_arn
    backend_secrets_secret_id = var.backend_secrets_arn
    data_volume_device        = "/dev/sdf"
  })

  # User data ships compose files but the actual image deploys are driven by
  # the deploy-dev-ec2 GitHub Actions workflow via SSM. Treat user_data as
  # bootstrap-only — changing it forces an instance replacement, but the data
  # volume detaches and re-attaches.
  user_data_replace_on_change = true

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-app-compute"
  })

  # Wait for the data volume to be created in the same AZ before launching the
  # instance, otherwise the user-data mount step fails on first boot.
  depends_on = [aws_ebs_volume.data]
}

resource "aws_eip_association" "instance" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.instance.id
}

resource "aws_volume_attachment" "data" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.data.id
  instance_id = aws_instance.app.id

  # When we replace the EC2 (e.g. instance_type change), let Terraform detach
  # the volume so it can re-attach to the new instance without manual steps.
  force_detach = true
  # Don't tear down the EBS volume just because we destroyed the attachment.
  skip_destroy = true
}

# Note: no EBS snapshot policy. Dev data is disposable (a fresh
# `kysely migrate:latest` recreates the schema and dev rows are throwaway).
# Prod will use this same module but it talks to RDS, which has its own
# automated backups + PITR, so the data volume there only holds the Docker
# image cache — also not worth snapshotting.

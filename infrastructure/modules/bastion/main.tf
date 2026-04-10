# Bastion Host Module
# SSM-only bastion for secure port forwarding to private resources (RDS, etc.)
# No SSH keys, no public IP, no open ports — access is IAM-authenticated via SSM.

data "aws_ssm_parameter" "al2023_arm64" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

# IAM role for the bastion (SSM managed instance)
resource "aws_iam_role" "bastion" {
  name = "${var.name_prefix}-bastion-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-bastion-role"
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.bastion.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "bastion" {
  name = "${var.name_prefix}-bastion-profile"
  role = aws_iam_role.bastion.name

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-bastion-profile"
  })
}

# Security group — no inbound rules (SSM uses outbound HTTPS)
resource "aws_security_group" "bastion" {
  name        = "${var.name_prefix}-bastion-sg"
  description = "Security group for SSM bastion host"
  vpc_id      = var.vpc_id

  # SSM agent needs outbound HTTPS to SSM endpoints
  egress {
    description = "HTTPS for SSM agent"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound to RDS (PostgreSQL)
  egress {
    description     = "PostgreSQL to RDS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.rds_security_group_id]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-bastion-sg"
  })
}

# Allow inbound from bastion to RDS security group
resource "aws_security_group_rule" "rds_from_bastion" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = var.rds_security_group_id
  source_security_group_id = aws_security_group.bastion.id
  description              = "Allow PostgreSQL from bastion host"
}

# Security group for SSM VPC endpoints
# The 3 VPC endpoints themselves (ssm, ssmmessages, ec2messages) are NOT managed by Terraform —
# they are created/deleted on demand via the "Toggle Database Access" GitHub Actions workflow.
# This security group is kept here so it always exists and the workflow can reference it by tag.
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.name_prefix}-ssm-endpoints-sg"
  description = "Security group for SSM VPC endpoints"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTPS from bastion"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-ssm-endpoints-sg"
  })
}

# Bastion EC2 instance
resource "aws_instance" "bastion" {
  ami                  = data.aws_ssm_parameter.al2023_arm64.value
  instance_type        = var.instance_type
  subnet_id            = var.subnet_id
  iam_instance_profile = aws_iam_instance_profile.bastion.name

  vpc_security_group_ids = [aws_security_group.bastion.id]

  # No public IP — SSM only
  associate_public_ip_address = false

  # Minimal root volume
  root_block_device {
    volume_size = 8
    volume_type = "gp3"
    encrypted   = true
  }

  metadata_options {
    http_tokens   = "required" # IMDSv2 only
    http_endpoint = "enabled"
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-bastion"
  })
}

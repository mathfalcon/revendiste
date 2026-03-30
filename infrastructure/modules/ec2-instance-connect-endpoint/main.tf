# EC2 Instance Connect Endpoint Module
# Allows secure tunneling to private resources (RDS, etc.) without a bastion host

resource "aws_ec2_instance_connect_endpoint" "main" {
  subnet_id          = var.subnet_id
  security_group_ids = [aws_security_group.eice.id]
  preserve_client_ip = false # Not needed for database tunneling

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-eice"
  })
}

# Security group for the EC2 Instance Connect Endpoint
resource "aws_security_group" "eice" {
  name        = "${var.name_prefix}-eice-sg"
  description = "Security group for EC2 Instance Connect Endpoint"
  vpc_id      = var.vpc_id

  # Outbound to RDS (PostgreSQL)
  egress {
    description     = "Allow PostgreSQL to RDS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.rds_security_group_id]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-eice-sg"
  })
}

# Allow inbound from EICE to RDS security group
resource "aws_security_group_rule" "rds_from_eice" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = var.rds_security_group_id
  source_security_group_id = aws_security_group.eice.id
  description              = "Allow PostgreSQL from EC2 Instance Connect Endpoint"
}

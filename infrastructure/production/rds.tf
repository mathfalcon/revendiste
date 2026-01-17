# RDS PostgreSQL Database (Standard Instance)
# Pre-launch: db.t4g.micro (~$10/month) - Graviton ARM, 2 vCPU, 1GB RAM
# Upgrade path: db.t4g.small (~$20/mo) → db.t3.medium (~$47/mo) → Aurora Serverless v2

# Random password for initial database password
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store database credentials in Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${local.name_prefix}-db-credentials"
  recovery_window_in_days = 7

  tags = {
    Name = "${local.name_prefix}-db-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username     = var.db_username
    password     = random_password.db_password.result
    engine       = "postgres"
    host         = aws_db_instance.main.address
    port         = 5432
    dbname       = var.db_name
    database_url = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.main.address}:5432/${var.db_name}"
  })

  depends_on = [aws_db_instance.main]
}

# Standard RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-postgres"
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Backup configuration
  backup_retention_period    = var.db_backup_retention_days
  backup_window              = "03:00-04:00"         # UTC
  maintenance_window         = "sun:04:00-sun:05:00" # UTC
  auto_minor_version_upgrade = true

  # Enable encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  # Enable deletion protection in production
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Enable CloudWatch Logs
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name = "${local.name_prefix}-postgres"
  }

  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10

  tags = {
    Name = "${local.name_prefix}-rds-kms-key"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

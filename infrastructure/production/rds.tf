# RDS PostgreSQL Database (Standard Instance)
# Note: Easy to migrate to Aurora later - same PostgreSQL engine, just different infrastructure
# Migration path: Use AWS DMS or pg_dump/pg_restore (both use same PostgreSQL protocol)

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
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = 5432
    dbname   = var.db_name
    # Note: database_url should be constructed by the application using the individual fields
    # to properly URL-encode the password
    database_url = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.main.address}:5432/${var.db_name}"
  })

  depends_on = [aws_db_instance.main]
}

# Standard RDS PostgreSQL Instance
# Cost: ~$30/month for db.t3.medium (vs ~$65/month for Aurora Serverless v2 at 0.5 ACU)
# Can easily migrate to Aurora later using AWS DMS or pg_dump/pg_restore
resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-postgres"
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage # Auto-scaling storage up to this limit

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false # Keep database private

  # Backup configuration
  backup_retention_period      = var.db_backup_retention_days
  backup_window                = "03:00-04:00"         # UTC
  maintenance_window           = "sun:04:00-sun:05:00" # UTC
  auto_minor_version_upgrade   = true

  # Enable encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  # Enable deletion protection in production
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Enable CloudWatch Logs
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Performance Insights (optional, adds ~$3-5/month)
  performance_insights_enabled          = var.db_performance_insights_enabled
  performance_insights_retention_period = var.db_performance_insights_enabled ? 7 : null

  tags = {
    Name = "${local.name_prefix}-postgres"
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

# RDS Aurora Serverless v2 PostgreSQL Database

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
    host     = aws_rds_cluster.main.endpoint
    port     = 5432
    dbname   = var.db_name
    # Note: database_url should be constructed by the application using the individual fields
    # to properly URL-encode the password
    database_url = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_rds_cluster.main.endpoint}:5432/${var.db_name}"
  })

  depends_on = [aws_rds_cluster.main]
}

# RDS Aurora Serverless v2 Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier     = "${local.name_prefix}-aurora-cluster"
  engine                 = "aurora-postgresql"
  engine_mode            = "provisioned"
  engine_version         = var.db_engine_version
  database_name          = var.db_name
  master_username        = var.db_username
  master_password        = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Serverless v2 configuration
  serverlessv2_scaling_configuration {
    max_capacity = var.db_max_capacity
    min_capacity = var.db_min_capacity
  }

  # Backup configuration
  backup_retention_period      = var.db_backup_retention_days
  preferred_backup_window      = "03:00-04:00"         # UTC
  preferred_maintenance_window = "sun:04:00-sun:05:00" # UTC

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
    Name = "${local.name_prefix}-aurora-cluster"
  }
}

# RDS Aurora Serverless v2 Instance
resource "aws_rds_cluster_instance" "main" {
  count              = var.db_instance_count
  identifier         = "${local.name_prefix}-aurora-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  # Enable performance insights for monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = {
    Name = "${local.name_prefix}-aurora-instance-${count.index + 1}"
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


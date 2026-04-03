# Bastion Host Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the bastion will be created"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for the bastion (private subnet, no public IP needed)"
  type        = string
}

variable "rds_security_group_id" {
  description = "Security group ID of the RDS instance to allow connections to"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for the bastion host"
  type        = string
  default     = "t4g.nano"
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for VPC endpoints (needs at least 2 for HA)"
  type        = list(string)
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

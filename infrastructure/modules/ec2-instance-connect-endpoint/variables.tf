# EC2 Instance Connect Endpoint Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the endpoint will be created"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for the endpoint (should be a private subnet)"
  type        = string
}

variable "rds_security_group_id" {
  description = "Security group ID of the RDS instance to allow connections to"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

# Bastion Host Outputs

output "instance_id" {
  description = "ID of the bastion EC2 instance"
  value       = aws_instance.bastion.id
}

output "security_group_id" {
  description = "Security group ID of the bastion host"
  value       = aws_security_group.bastion.id
}

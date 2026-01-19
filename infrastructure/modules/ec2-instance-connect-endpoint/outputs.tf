# EC2 Instance Connect Endpoint Outputs

output "endpoint_id" {
  description = "ID of the EC2 Instance Connect Endpoint"
  value       = aws_ec2_instance_connect_endpoint.main.id
}

output "endpoint_arn" {
  description = "ARN of the EC2 Instance Connect Endpoint"
  value       = aws_ec2_instance_connect_endpoint.main.arn
}

output "security_group_id" {
  description = "Security group ID of the EC2 Instance Connect Endpoint"
  value       = aws_security_group.eice.id
}

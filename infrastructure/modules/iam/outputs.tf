# IAM Module Outputs

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "ecs_task_role_id" {
  description = "ID of the ECS task role"
  value       = aws_iam_role.ecs_task.id
}

output "eventbridge_ecs_role_arn" {
  description = "ARN of the EventBridge ECS role"
  value       = aws_iam_role.eventbridge_ecs.arn
}

output "eventbridge_ecs_role_name" {
  description = "Name of the EventBridge ECS role"
  value       = aws_iam_role.eventbridge_ecs.name
}

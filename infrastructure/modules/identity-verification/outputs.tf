# Identity Verification Module Outputs

output "face_liveness_role_arn" {
  description = "IAM Role ARN for Face Liveness SDK"
  value       = aws_iam_role.face_liveness_frontend.arn
}

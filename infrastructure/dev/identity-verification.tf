# Identity Verification Resources (AWS Rekognition)
#
# This file contains:
# 1. IAM policies for the backend to use AWS Rekognition
# 2. A minimal IAM role for frontend Face Liveness SDK (assumed by backend)
#
# Note: We intentionally skip OutputConfig in CreateFaceLivenessSession so the reference
# image is returned directly as Bytes in the API response. This avoids needing an AWS S3 bucket
# (Rekognition requires real S3, R2 won't work for OutputConfig).

# ========================================
# Backend IAM Policy for Rekognition
# ========================================
resource "aws_iam_role_policy" "ec2_rekognition" {
  name = "${local.name_prefix}-ec2-rekognition"
  role = aws_iam_role.ec2_instances.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RekognitionDetection"
        Effect = "Allow"
        Action = [
          "rekognition:DetectText",
          "rekognition:DetectFaces",
          "rekognition:CompareFaces"
        ]
        Resource = "*"
      },
      {
        Sid    = "RekognitionFaceLiveness"
        Effect = "Allow"
        Action = [
          "rekognition:CreateFaceLivenessSession",
          "rekognition:StartFaceLivenessSession",
          "rekognition:GetFaceLivenessSessionResults"
        ]
        Resource = "*"
      },
      {
        Sid      = "AssumeRoleFaceLiveness"
        Effect   = "Allow"
        Action   = "sts:AssumeRole"
        Resource = aws_iam_role.face_liveness_frontend.arn
      }
    ]
  })
}

# ========================================
# Minimal IAM Role for Frontend Face Liveness SDK
# ========================================
# This role has ONLY StartFaceLivenessSession permission.
# The backend assumes this role and returns temporary credentials to the frontend.
# This is more secure than Cognito because:
# - Only authenticated users (via backend) can get credentials
# - Credentials are scoped to a single action
# - No public identity pool

resource "aws_iam_role" "face_liveness_frontend" {
  name = "${local.name_prefix}-face-liveness-frontend"

  # Allow the EC2 instance role to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_instances.arn
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-face-liveness-frontend"
  }
}

# Policy allowing ONLY StartFaceLivenessSession
resource "aws_iam_role_policy" "face_liveness_frontend" {
  name = "${local.name_prefix}-face-liveness-frontend"
  role = aws_iam_role.face_liveness_frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rekognition:StartFaceLivenessSession"
        ]
        Resource = "*"
      }
    ]
  })
}

# Output the role ARN for backend configuration
output "face_liveness_role_arn" {
  description = "IAM Role ARN for Face Liveness SDK (backend assumes this role)"
  value       = aws_iam_role.face_liveness_frontend.arn
}

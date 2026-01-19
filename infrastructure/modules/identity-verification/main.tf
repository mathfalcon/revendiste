# Identity Verification Module
# Creates IAM resources for AWS Rekognition Face Liveness

# Backend IAM Policy for Rekognition
resource "aws_iam_role_policy" "ecs_task_rekognition" {
  name = "${var.name_prefix}-ecs-task-rekognition"
  role = var.ecs_task_role_id

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

# Minimal IAM Role for Frontend Face Liveness SDK
resource "aws_iam_role" "face_liveness_frontend" {
  name = "${var.name_prefix}-face-liveness-frontend"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = var.ecs_task_role_arn
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.common_tags
}

# Policy allowing ONLY StartFaceLivenessSession
resource "aws_iam_role_policy" "face_liveness_frontend" {
  name = "${var.name_prefix}-face-liveness-frontend"
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

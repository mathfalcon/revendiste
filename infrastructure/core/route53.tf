# Route53 Hosted Zone for main domain
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-hosted-zone"
      Type = "hosted-zone"
    }
  )

  lifecycle {
    prevent_destroy = true
  }
}


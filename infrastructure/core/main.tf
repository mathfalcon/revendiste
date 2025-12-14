terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  cloud {
    organization = "revendiste" # Update with your Terraform Cloud organization name
    workspaces {
      name = "revendiste-core"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# Data source for current AWS caller identity
data "aws_caller_identity" "current" {}

# Local values for common tags and naming
locals {
  common_tags = {
    Environment = "core"
    ManagedBy   = "terraform"
    Application = "revendiste"
    Domain      = var.domain_name
  }

  name_prefix = "revendiste-core"
}


terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.14"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  cloud {
    organization = "revendiste" # Update with your Terraform Cloud organization name
    workspaces {
      name = "revendiste-production"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# Cloudflare Provider
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values for common tags and naming
locals {
  common_tags = {
    Environment = "production"
    ManagedBy   = "terraform"
    Application = "revendiste"
  }

  name_prefix = "revendiste-production"
}


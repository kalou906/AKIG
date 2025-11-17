# Terraform Variables for Vault Deployment

variable "aws_region" {
  description = "AWS region for Vault deployment"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "vault_version" {
  description = "Vault version to install"
  type        = string
  default     = "1.15.4"
}

variable "vault_instance_type" {
  description = "EC2 instance type for Vault servers"
  type        = string
  default     = "t3.medium"
}

variable "vault_instance_count" {
  description = "Number of Vault instances for HA"
  type        = number
  default     = 3
}

variable "vpc_id" {
  description = "VPC ID where Vault will be deployed"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for Vault instances"
  type        = list(string)
}

variable "admin_cidr_blocks" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = []
}

variable "ssh_key_name" {
  description = "SSH key name for EC2 instances"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

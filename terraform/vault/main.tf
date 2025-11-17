# Terraform - HashiCorp Vault Infrastructure on AWS
# Déploiement sécurisé avec auto-unseal KMS et HA

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ========================================
# KMS KEY for Vault Auto-Unseal
# ========================================
resource "aws_kms_key" "vault" {
  description             = "Vault auto-unseal encryption key - ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "vault-kms-${var.environment}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_kms_alias" "vault" {
  name          = "alias/vault-${var.environment}"
  target_key_id = aws_kms_key.vault.key_id
}

# ========================================
# IAM ROLE for Vault EC2
# ========================================
resource "aws_iam_role" "vault_server" {
  name = "vault-server-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "vault-server-role"
  }
}

resource "aws_iam_policy" "vault_kms" {
  name        = "vault-kms-policy-${var.environment}"
  description = "Allow Vault to use KMS for auto-unseal"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = [aws_kms_key.vault.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "iam:GetRole",
          "iam:GetUser"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "vault_kms" {
  policy_arn = aws_iam_policy.vault_kms.arn
  role       = aws_iam_role.vault_server.name
}

resource "aws_iam_instance_profile" "vault" {
  name = "vault-profile-${var.environment}"
  role = aws_iam_role.vault_server.name
}

# ========================================
# SECURITY GROUP
# ========================================
resource "aws_security_group" "vault" {
  name_prefix = "vault-${var.environment}-"
  description = "Security group for Vault servers"
  vpc_id      = var.vpc_id

  # API port
  ingress {
    from_port   = 8200
    to_port     = 8200
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Vault API"
  }

  # Cluster port
  ingress {
    from_port = 8201
    to_port   = 8201
    protocol  = "tcp"
    self      = true
    description = "Vault cluster communication"
  }

  # SSH (for debugging)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.admin_cidr_blocks
    description = "SSH access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "vault-sg-${var.environment}"
  }
}

# ========================================
# EC2 INSTANCES (HA - 3 nodes)
# ========================================
resource "aws_instance" "vault" {
  count = var.vault_instance_count

  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = var.vault_instance_type
  
  subnet_id              = element(var.private_subnet_ids, count.index)
  vpc_security_group_ids = [aws_security_group.vault.id]
  iam_instance_profile   = aws_iam_instance_profile.vault.name
  
  key_name = var.ssh_key_name

  user_data = base64encode(templatefile("${path.module}/vault-user-data.sh", {
    vault_version = var.vault_version
    kms_key_id    = aws_kms_key.vault.id
    aws_region    = var.aws_region
    node_id       = count.index
    environment   = var.environment
  }))

  root_block_device {
    encrypted   = true
    volume_size = 50
    volume_type = "gp3"
    kms_key_id  = aws_kms_key.vault.arn
  }

  tags = {
    Name        = "vault-${count.index}-${var.environment}"
    Environment = var.environment
    Role        = "vault-server"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ========================================
# DATA SOURCES
# ========================================
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ========================================
# LOAD BALANCER (for HA)
# ========================================
resource "aws_lb" "vault" {
  name               = "vault-lb-${var.environment}"
  internal           = true
  load_balancer_type = "network"
  subnets            = var.private_subnet_ids

  enable_deletion_protection = var.environment == "production"

  tags = {
    Name = "vault-lb-${var.environment}"
  }
}

resource "aws_lb_target_group" "vault" {
  name     = "vault-tg-${var.environment}"
  port     = 8200
  protocol = "TCP"
  vpc_id   = var.vpc_id

  health_check {
    protocol = "HTTPS"
    path     = "/v1/sys/health"
    port     = 8200
    interval = 30
  }

  tags = {
    Name = "vault-tg"
  }
}

resource "aws_lb_target_group_attachment" "vault" {
  count = var.vault_instance_count

  target_group_arn = aws_lb_target_group.vault.arn
  target_id        = aws_instance.vault[count.index].id
  port             = 8200
}

resource "aws_lb_listener" "vault" {
  load_balancer_arn = aws_lb.vault.arn
  port              = 8200
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.vault.arn
  }
}

# ========================================
# OUTPUTS
# ========================================
output "vault_endpoint" {
  description = "Vault cluster endpoint"
  value       = "https://${aws_lb.vault.dns_name}:8200"
}

output "vault_kms_key_id" {
  description = "KMS key ID for Vault auto-unseal"
  value       = aws_kms_key.vault.id
}

output "vault_instance_ids" {
  description = "Vault EC2 instance IDs"
  value       = aws_instance.vault[*].id
}

output "vault_private_ips" {
  description = "Private IPs of Vault instances"
  value       = aws_instance.vault[*].private_ip
}

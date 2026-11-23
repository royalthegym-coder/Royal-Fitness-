# ==============================================================================
# AWS INFRASTRUCTURE AS CODE (TERRAFORM)
# Provisions the production server, VPC, Security Groups, and Elastic IP
# ==============================================================================

provider "aws" {
  region = "ap-south-1" # Mumbai Region for lowest latency in India
}

# 1. Virtual Private Cloud (VPC)
resource "aws_vpc" "fitness_future_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "FutureGym-VPC"
  }
}

# 2. Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.fitness_future_vpc.id
}

# 3. Public Subnet
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.fitness_future_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "ap-south-1a"
}

# 4. Security Group (Firewall Rules)
resource "aws_security_group" "web_sg" {
  name        = "fitness-gym-web-sg"
  description = "Allow HTTP, HTTPS, and SSH inbound traffic"
  vpc_id      = aws_vpc.fitness_future_vpc.id

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS (SSL)
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH (Admin Access Only)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["YOUR_OFFICE_IP/32"] # Restrict to your IP for security
  }

  # Outbound (Internet Access for the server)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 5. EC2 Instance (Production Server)
# Since AI Inference is handled by Groq API (Cloud LPUs) and Pose Tracking is on-device (C++ NDK),
# we DO NOT need an expensive GPU server ($1000/mo). A standard Compute-Optimized instance is enough.
resource "aws_instance" "fitness_future_server" {
  ami           = "ami-0f5ee92e2d63afc18" # Ubuntu 24.04 LTS (ap-south-1)
  instance_type = "t3.medium" # 2 vCPU, 4GB RAM (Sufficient for Node.js + Python API)
  key_name      = "fitness-gym-prod-key"
  
  subnet_id                   = aws_subnet.public_subnet.id
  vpc_security_group_ids      = [aws_security_group.web_sg.id]
  associate_public_ip_address = true

  # User Data: Automatically install Docker, Docker Compose, and Traefik on boot
  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io docker-compose git
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu
              
              # Initialize Docker Swarm for Zero-Downtime Deployments
              docker swarm init
              EOF

  tags = {
    Name = "FutureGym-Prod-Server"
  }
}

# 6. Elastic IP (Static IP for Domain Name)
resource "aws_eip" "static_ip" {
  instance = aws_instance.fitness_future_server.id
  domain   = "vpc"
}

# Output the IP address to map in GoDaddy/Cloudflare
output "server_public_ip" {
  value = aws_eip.static_ip.public_ip
  description = "Map this IP to api.fitnessgym.com in your DNS settings (A Record)"
}

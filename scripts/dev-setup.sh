#!/bin/bash

# Milk Management System - Development Setup Script
# This script sets up the complete development environment

set -e  # Exit on any error

echo "🚀 Setting up Milk Management System Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if required ports are available
check_ports() {
    print_status "Checking if required ports are available..."
    
    local ports=(80 443 3000 8000 8001 8080 8081 3306 6379 9090 3001 1025 8025)
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "Port $port is already in use. Please stop the service using this port."
        else
            print_success "Port $port is available"
        fi
    done
}

# Create environment file
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env.dev ]; then
        if [ -f env.dev.example ]; then
            cp env.dev.example .env.dev
            print_success "Created .env.dev from template"
        else
            print_error "env.dev.example not found. Please create it first."
            exit 1
        fi
    else
        print_warning ".env.dev already exists. Skipping..."
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p database/init
    mkdir -p database/backups
    mkdir -p nginx/ssl
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    print_success "Created necessary directories"
}

# Create Nginx configuration
setup_nginx() {
    print_status "Setting up Nginx configuration..."
    
    if [ ! -f nginx/nginx.dev.conf ]; then
        cat > nginx/nginx.dev.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }
    
    
    upstream admin {
        server admin:8000;
    }
    

    
    server {
        listen 80;
        server_name localhost;
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Admin Panel
        location /admin/ {
            proxy_pass http://admin;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        

    }
}
EOF
        print_success "Created Nginx development configuration"
    else
        print_warning "Nginx configuration already exists. Skipping..."
    fi
}

# Create Prometheus configuration
setup_prometheus() {
    print_status "Setting up Prometheus configuration..."
    
    if [ ! -f monitoring/prometheus.yml ]; then
        cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
    metrics_path: '/nginx_status'
EOF
        print_success "Created Prometheus configuration"
    else
        print_warning "Prometheus configuration already exists. Skipping..."
    fi
}

# Create Grafana datasource
setup_grafana() {
    print_status "Setting up Grafana datasource..."
    
    mkdir -p monitoring/grafana/datasources
    
    if [ ! -f monitoring/grafana/datasources/prometheus.yml ]; then
        cat > monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF
        print_success "Created Grafana datasource configuration"
    else
        print_warning "Grafana datasource already exists. Skipping..."
    fi
}

# Build and start services
start_services() {
    print_status "Building and starting services..."
    
    # Stop any existing containers
    docker-compose -f docker-compose.dev.yml --env-file .env.dev down --remove-orphans
    
    # Build images
    docker-compose -f docker-compose.dev.yml --env-file .env.dev build
    
    # Start services
    docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
    
    print_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for database..."
    timeout=60
    while ! docker-compose -f docker-compose.dev.yml --env-file .env.dev exec -T db mysqladmin ping -h localhost --silent; do
        if [ $timeout -le 0 ]; then
            print_error "Database failed to start within 60 seconds"
            exit 1
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    print_success "Database is ready"
    
    # Wait for backend
    print_status "Waiting for backend API..."
    timeout=60
    while ! curl -f http://localhost:8000/health > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Backend API failed to start within 60 seconds"
            exit 1
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    print_success "Backend API is ready"
    
    # Wait for website
    print_status "Waiting for website..."
    timeout=60
    while ! curl -f http://localhost:3000 > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Website failed to start within 60 seconds"
            exit 1
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    print_success "Website is ready"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Backend migrations
    docker-compose -f docker-compose.dev.yml --env-file .env.dev exec backend python -c "
from app.db.session import engine
from app.db.models import Base
Base.metadata.create_all(bind=engine)
print('Backend database tables created')
"
    
    # Admin migrations
    docker-compose -f docker-compose.dev.yml --env-file .env.dev exec admin python manage.py migrate
    
    print_success "Database migrations completed"
}

# Show service status
show_status() {
    print_status "Service Status:"
    echo ""
    echo "🌐 Website: http://localhost:3000"
    echo "📱 Frontend (Expo): http://localhost:8081"
    echo "🔧 Backend API: http://localhost:8000"
    echo "⚙️  Admin Panel: http://localhost:8001"
    echo "🗄️  Database: localhost:3306"
    echo "📊 Adminer (DB Manager): http://localhost:8080"
    echo "📈 Prometheus: http://localhost:9090"
    echo "📊 Grafana: http://localhost:3001 (admin/admin)"
    echo "📧 Mailhog: http://localhost:8025"
    echo ""
    echo "📋 Useful Commands:"
    echo "  View logs: docker-compose -f docker-compose.dev.yml logs -f [service]"
    echo "  Stop services: docker-compose -f docker-compose.dev.yml down"
    echo "  Restart services: docker-compose -f docker-compose.dev.yml restart"
    echo "  Shell access: docker-compose -f docker-compose.dev.yml exec [service] bash"
    echo ""
}

# Main execution
main() {
    echo "=========================================="
    echo "Milk Management System - Dev Setup"
    echo "=========================================="
    echo ""
    
    check_docker
    check_ports
    setup_environment
    create_directories
    setup_nginx
    setup_prometheus
    setup_grafana
    start_services
    wait_for_services
    run_migrations
    show_status
    
    echo ""
    print_success "🎉 Development environment setup completed successfully!"
    echo ""
    print_warning "Don't forget to:"
    echo "  1. Update .env.dev with your actual configuration"
    echo "  2. Set up your Razorpay test keys"
    echo "  3. Configure your domain names in production"
    echo ""
}

# Run main function
main "$@" 
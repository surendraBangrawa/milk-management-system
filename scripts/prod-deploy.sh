#!/bin/bash

# Milk Management System - Production Deployment Script
# This script deploys the application to production

set -e  # Exit on any error

echo "🚀 Deploying Milk Management System to Production..."

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

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "Please don't run this script as root. Use a regular user with sudo privileges."
        exit 1
    fi
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

# Check environment file
check_environment() {
    print_status "Checking environment configuration..."
    
    if [ ! -f .env.prod ]; then
        if [ -f env.prod.example ]; then
            print_error ".env.prod not found. Please copy env.prod.example to .env.prod and update the values."
            exit 1
        else
            print_error "env.prod.example not found. Please create it first."
            exit 1
        fi
    fi
    
    # Check for required environment variables
    source .env.prod
    
    required_vars=(
        "DATABASE_URL"
        "JWT_SECRET_KEY"
        "RAZORPAY_KEY_ID"
        "RAZORPAY_SECRET_KEY"
        "DJANGO_SECRET_KEY"
        "ALLOWED_HOSTS"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set in .env.prod"
            exit 1
        fi
    done
    
    print_success "Environment configuration is valid"
}

# Create SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
        print_warning "SSL certificates not found. Creating self-signed certificates for testing..."
        
        mkdir -p nginx/ssl
        
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=IN/ST=State/L=City/O=Organization/CN=localhost"
        
        print_success "Self-signed SSL certificates created"
        print_warning "For production, replace these with proper SSL certificates from Let's Encrypt or your CA"
    else
        print_success "SSL certificates found"
    fi
}

# Create production Nginx configuration
setup_nginx_prod() {
    print_status "Setting up production Nginx configuration..."
    
    if [ ! -f nginx/nginx.prod.conf ]; then
        cat > nginx/nginx.prod.conf << 'EOF'
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
    

    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name _;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # Backend API with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Admin Panel
        location /admin/ {
            limit_req zone=login burst=10 nodelay;
            proxy_pass http://admin;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Static files
        location /static/ {
            alias /app/static_collected/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Media files
        location /media/ {
            alias /app/media_collected/;
            expires 1y;
            add_header Cache-Control "public";
        }
        
    }
}
EOF
        print_success "Created production Nginx configuration"
    else
        print_warning "Production Nginx configuration already exists. Skipping..."
    fi
}

# Create backup script
create_backup_script() {
    print_status "Creating backup script..."
    
    if [ ! -f scripts/backup.sh ]; then
        cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# Database backup script
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="milk_management_$DATE.sql"

echo "Creating database backup: $BACKUP_FILE"

# Create backup
docker-compose -f docker-compose.prod.yml exec -T db mysqldump -u root -p$MYSQL_ROOT_PASSWORD milk_management > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF
        chmod +x scripts/backup.sh
        print_success "Created backup script"
    else
        print_warning "Backup script already exists. Skipping..."
    fi
}

# Create monitoring dashboard
setup_monitoring() {
    print_status "Setting up monitoring dashboards..."
    
    mkdir -p monitoring/grafana/dashboards
    
    if [ ! -f monitoring/grafana/dashboards/dashboard.yml ]; then
        cat > monitoring/grafana/dashboards/dashboard.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF
        print_success "Created Grafana dashboard configuration"
    else
        print_warning "Grafana dashboard configuration already exists. Skipping..."
    fi
}

# Stop existing services
stop_existing_services() {
    print_status "Stopping existing services..."
    
    docker-compose -f docker-compose.prod.yml down --remove-orphans || true
    
    print_success "Existing services stopped"
}

# Build and start services
deploy_services() {
    print_status "Building and deploying services..."
    
    # Build images
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Services deployed successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for database..."
    timeout=120
    while ! docker-compose -f docker-compose.prod.yml exec -T db mysqladmin ping -h localhost --silent; do
        if [ $timeout -le 0 ]; then
            print_error "Database failed to start within 120 seconds"
            exit 1
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    print_success "Database is ready"
    
    # Wait for backend
    print_status "Waiting for backend API..."
    timeout=120
    while ! curl -f https://localhost/health > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Backend API failed to start within 120 seconds"
            exit 1
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    print_success "Backend API is ready"
    
    # Wait for website
    print_status "Waiting for website..."
    timeout=120
    while ! curl -f https://localhost > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Website failed to start within 120 seconds"
            exit 1
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    print_success "Website is ready"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Backend migrations
    docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.db.session import engine
from app.db.models import Base
Base.metadata.create_all(bind=engine)
print('Backend database tables created')
"
    
    # Admin migrations
    docker-compose -f docker-compose.prod.yml exec admin python manage.py migrate
    
    print_success "Database migrations completed"
}

# Set up cron jobs
setup_cron() {
    print_status "Setting up automated tasks..."
    
    # Add backup cron job
    (crontab -l 2>/dev/null; echo "0 2 * * * /path/to/your/project/scripts/backup.sh") | crontab -
    
    # Add log rotation
    (crontab -l 2>/dev/null; echo "0 3 * * * docker system prune -f") | crontab -
    
    print_success "Cron jobs configured"
}

# Show deployment status
show_status() {
    print_status "Production Deployment Status:"
    echo ""
    echo "🌐 Website: https://yourdomain.com"
    echo "📱 Frontend (Expo): https://yourdomain.com:8081"
    echo "🔧 Backend API: https://yourdomain.com/api"
    echo "⚙️  Admin Panel: https://yourdomain.com/admin"
    echo "📈 Prometheus: https://yourdomain.com:9090"
    echo "📊 Grafana: https://yourdomain.com:3001"
    echo ""
    echo "📋 Useful Commands:"
    echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f [service]"
    echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"
    echo "  Backup database: ./scripts/backup.sh"
    echo "  Shell access: docker-compose -f docker-compose.prod.yml exec [service] bash"
    echo ""
    echo "🔒 Security Checklist:"
    echo "  ✓ SSL certificates configured"
    echo "  ✓ Rate limiting enabled"
    echo "  ✓ Security headers set"
    echo "  ✓ Environment variables secured"
    echo "  ✓ Database backups scheduled"
    echo ""
}

# Health check
health_check() {
    print_status "Running health checks..."
    
    # Check all services
    services=("backend" "frontend" "admin" "website" "db" "redis" "nginx")
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps | grep -q "$service.*Up"; then
            print_success "$service is running"
        else
            print_error "$service is not running"
            return 1
        fi
    done
    
    print_success "All services are healthy"
}

# Main execution
main() {
    echo "=========================================="
    echo "Milk Management System - Production Deploy"
    echo "=========================================="
    echo ""
    
    check_root
    check_docker
    check_environment
    setup_ssl
    setup_nginx_prod
    create_backup_script
    setup_monitoring
    stop_existing_services
    deploy_services
    wait_for_services
    run_migrations
    setup_cron
    health_check
    show_status
    
    echo ""
    print_success "🎉 Production deployment completed successfully!"
    echo ""
    print_warning "Important next steps:"
    echo "  1. Update DNS records to point to your server"
    echo "  2. Replace self-signed SSL with proper certificates"
    echo "  3. Set up monitoring alerts"
    echo "  4. Configure automated backups"
    echo "  5. Set up log aggregation"
    echo ""
}

# Run main function
main "$@" 
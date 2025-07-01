# Milk Management System - Deployment Guide

This guide covers the complete deployment process for both development and production environments.

## 🚀 Quick Start

### Development Environment

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd milk-management-system

# 2. Set up development environment
make dev-setup

# 3. Start services
make dev-start

# 4. Access the application
# Website: http://localhost:3000
# Frontend: http://localhost:8081
# Backend: http://localhost:8000
# Admin: http://localhost:8001
```

### Production Environment

```bash
# 1. Set up environment variables
cp env.prod.example .env.prod
# Edit .env.prod with your production values

# 2. Deploy to production
make prod-setup

# 3. Access the application
# Website: https://yourdomain.com
# API: https://yourdomain.com/api
# Admin: https://yourdomain.com/admin
```

## 📋 Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows with WSL2
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: Minimum 10GB free space
- **CPU**: 2 cores minimum (4 cores recommended)

### Required Software

1. **Docker Desktop** or **Docker Engine**
2. **Git**
3. **Make** (usually pre-installed on Linux/macOS)
4. **OpenSSL** (for SSL certificate generation)

### Installation Commands

#### Ubuntu/Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git and Make
sudo apt install git make openssl -y

# Logout and login again for Docker group changes
```

#### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker

# Install Git and Make
brew install git make openssl
```

#### Windows

```bash
# Install WSL2 and Ubuntu
wsl --install

# Install Docker Desktop for Windows
# Download from: https://www.docker.com/products/docker-desktop

# Install Git for Windows
# Download from: https://git-scm.com/download/win
```

## 🛠️ Development Setup

### 1. Environment Configuration

```bash
# Copy environment template
cp env.dev.example .env.dev

# Edit environment variables
nano .env.dev
```

**Key Environment Variables:**

- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET_KEY`: Secret key for JWT tokens
- `RAZORPAY_KEY_ID`: Razorpay test key ID
- `RAZORPAY_SECRET_KEY`: Razorpay test secret key
- `CORS_ORIGINS`: Allowed origins for CORS

### 2. Start Development Environment

```bash
# Complete setup (first time only)
make dev-setup

# Or step by step:
make dev-start
make migrate
make superuser
```

### 3. Access Services

| Service     | URL                   | Description       |
| ----------- | --------------------- | ----------------- |
| Website     | http://localhost:3000 | Main website      |
| Frontend    | http://localhost:8081 | React Native/Expo |
| Backend API | http://localhost:8000 | FastAPI backend   |
| Admin Panel | http://localhost:8001 | Django admin      |
| Database    | localhost:3306        | MySQL database    |
| Adminer     | http://localhost:8080 | Database manager  |
| Prometheus  | http://localhost:9090 | Monitoring        |
| Grafana     | http://localhost:3001 | Dashboards        |
| Mailhog     | http://localhost:8025 | Email testing     |

### 4. Development Commands

```bash
# View logs
make dev-logs
make backend-logs
make frontend-logs

# Access shell
make dev-shell

# Run tests
make test

# Code quality
make lint
make format

# Database operations
make migrate
make backup
make restore

# Health checks
make health
make status
```

## 🚀 Production Deployment

### 1. Server Preparation

#### Ubuntu Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install curl git make openssl ufw -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Create application user
sudo adduser milkapp
sudo usermod -aG docker milkapp
sudo usermod -aG sudo milkapp
```

### 2. Environment Configuration

```bash
# Switch to application user
sudo su - milkapp

# Clone repository
git clone <your-repo-url>
cd milk-management-system

# Set up environment
cp env.prod.example .env.prod
nano .env.prod
```

**Production Environment Variables:**

```bash
# Database
DATABASE_URL=mysql+pymysql://user:password@db:3306/database
DB_ROOT_PASSWORD=secure_root_password
DB_NAME=milk_management_prod
DB_USER=milk_user_prod
DB_PASSWORD=secure_password

# Security
JWT_SECRET_KEY=very_secure_jwt_secret_key
DJANGO_SECRET_KEY=very_secure_django_secret_key

# Razorpay (Production Keys)
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_SECRET_KEY=your_production_secret_key

# Domain Configuration
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
API_BASE_URL=https://api.yourdomain.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### 3. SSL Certificate Setup

#### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Option 2: Self-Signed (Testing Only)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=IN/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

### 4. Deploy to Production

```bash
# Complete production setup
make prod-setup

# Or step by step:
make prod-deploy
make migrate
make superuser
```

### 5. Production Commands

```bash
# View logs
make prod-logs
make backend-logs
make frontend-logs

# Access shell
make prod-shell

# Database backup
make backup

# Health checks
make health
make status

# Restart services
make restart
```

## 📊 Monitoring & Maintenance

### 1. Monitoring Dashboards

- **Prometheus**: http://yourdomain.com:9090
- **Grafana**: http://yourdomain.com:3001 (admin/admin)

### 2. Log Management

```bash
# View all logs
make prod-logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx

# Log rotation
sudo logrotate -f /etc/logrotate.conf
```

### 3. Database Maintenance

```bash
# Create backup
make backup

# Restore from backup
make restore

# Database optimization
docker-compose -f docker-compose.prod.yml exec db mysql -u root -p -e "OPTIMIZE TABLE milk_management.*;"
```

### 4. System Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean Docker
docker system prune -f
docker volume prune -f

# Monitor disk usage
df -h
du -sh /var/lib/docker/volumes/*

# Monitor memory usage
free -h
docker stats
```

## 🔒 Security Configuration

### 1. Firewall Setup

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. SSL/TLS Configuration

```bash
# Update Nginx SSL configuration
nano nginx/nginx.prod.conf

# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### 3. Security Headers

The production Nginx configuration includes:

- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Rate limiting

### 4. Environment Security

```bash
# Secure environment file
chmod 600 .env.prod

# Regular security updates
sudo unattended-upgrades --dry-run
sudo unattended-upgrades
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>
```

#### 2. Database Connection Issues

```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec db mysqladmin ping -h localhost

# Check database logs
docker-compose -f docker-compose.prod.yml logs db
```

#### 3. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
```

#### 4. Memory Issues

```bash
# Check memory usage
docker stats

# Increase swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 5. Disk Space Issues

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a -f
docker volume prune -f

# Clean logs
sudo journalctl --vacuum-time=7d
```

### Debug Commands

```bash
# Check service status
make status

# Health checks
make health

# View detailed logs
docker-compose -f docker-compose.prod.yml logs --tail=100 backend

# Access container shell
docker-compose -f docker-compose.prod.yml exec backend bash
```

## 📈 Performance Optimization

### 1. Database Optimization

```bash
# Optimize MySQL configuration
docker-compose -f docker-compose.prod.yml exec db mysql -u root -p -e "
SET GLOBAL innodb_buffer_pool_size = 1073741824;
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 67108864;
"
```

### 2. Nginx Optimization

```bash
# Enable gzip compression
# Add to nginx configuration:
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### 3. Application Optimization

```bash
# Increase worker processes
# Update docker-compose.prod.yml:
command: gunicorn main:app --workers 8 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 🔄 Backup & Recovery

### 1. Automated Backups

```bash
# Set up cron job for daily backups
crontab -e
# Add: 0 2 * * * /path/to/project/scripts/backup.sh
```

### 2. Backup Verification

```bash
# Test backup restoration
make restore

# Verify backup integrity
gunzip -t database/backups/backup_file.sql.gz
```

### 3. Disaster Recovery

```bash
# Full system backup
tar -czf system_backup_$(date +%Y%m%d).tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=venv \
    .

# Restore system
tar -xzf system_backup_YYYYMMDD.tar.gz
make prod-deploy
```

## 📞 Support

### Getting Help

1. Check the troubleshooting section above
2. Review logs: `make prod-logs`
3. Check service status: `make status`
4. Run health checks: `make health`

### Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

### Emergency Contacts

- **System Administrator**: [Your Contact]
- **Database Administrator**: [Your Contact]
- **Security Team**: [Your Contact]

---

**Last Updated**: $(date)
**Version**: 1.0.0

# Milk Management System - Makefile
# This file provides easy commands for development and deployment

.PHONY: help dev-setup dev-start dev-stop dev-logs dev-shell dev-clean
.PHONY: prod-setup prod-deploy prod-stop prod-logs prod-shell prod-clean
.PHONY: backup restore test lint format install-deps

# Default target
help:
	@echo "Milk Management System - Available Commands"
	@echo "=========================================="
	@echo ""
	@echo "Development Commands:"
	@echo "  dev-setup     - Set up development environment"
	@echo "  dev-start     - Start development services"
	@echo "  dev-stop      - Stop development services"
	@echo "  dev-logs      - View development logs"
	@echo "  dev-shell     - Access development container shell"
	@echo "  dev-clean     - Clean development environment"
	@echo ""
	@echo "Production Commands:"
	@echo "  prod-setup    - Set up production environment"
	@echo "  prod-deploy   - Deploy to production"
	@echo "  prod-stop     - Stop production services"
	@echo "  prod-logs     - View production logs"
	@echo "  prod-shell    - Access production container shell"
	@echo "  prod-clean    - Clean production environment"
	@echo ""
	@echo "Database Commands:"
	@echo "  backup        - Create database backup"
	@echo "  restore       - Restore database from backup"
	@echo ""
	@echo "Utility Commands:"
	@echo "  test          - Run tests"
	@echo "  lint          - Run linting"
	@echo "  format        - Format code"
	@echo "  install-deps  - Install dependencies"
	@echo ""

# Development Commands
dev-setup:
	@echo "🚀 Setting up development environment..."
	@chmod +x scripts/dev-setup.sh
	@./scripts/dev-setup.sh

dev-start:
	@echo "▶️  Starting development services..."
	@docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
	@echo "✅ Development services started"
	@echo "🌐 Website: http://localhost:3000"
	@echo "📱 Frontend: http://localhost:8081"
	@echo "🔧 Backend: http://localhost:8000"
	@echo "⚙️  Admin: http://localhost:8001"

dev-stop:
	@echo "⏹️  Stopping development services..."
	@docker-compose -f docker-compose.dev.yml --env-file .env.dev down
	@echo "✅ Development services stopped"

dev-logs:
	@echo "📋 Development logs (Ctrl+C to exit)..."
	@docker-compose -f docker-compose.dev.yml --env-file .env.dev logs -f

dev-shell:
	@echo "🐚 Opening development shell..."
	@echo "Available services: backend, frontend, admin, website, db"
	@read -p "Enter service name: " service; \
	docker-compose -f docker-compose.dev.yml exec $$service bash

dev-clean:
	@echo "🧹 Cleaning development environment..."
	@docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	@docker system prune -f
	@echo "✅ Development environment cleaned"

# Production Commands
prod-setup:
	@echo "🚀 Setting up production environment..."
	@if [ ! -f .env.prod ]; then \
		echo "❌ .env.prod not found. Please copy env.prod.example to .env.prod and update values."; \
		exit 1; \
	fi
	@chmod +x scripts/prod-deploy.sh
	@./scripts/prod-deploy.sh

prod-deploy:
	@echo "🚀 Deploying to production..."
	@docker-compose -f docker-compose.prod.yml up -d --build
	@echo "✅ Production deployment completed"

prod-stop:
	@echo "⏹️  Stopping production services..."
	@docker-compose -f docker-compose.prod.yml down
	@echo "✅ Production services stopped"

prod-logs:
	@echo "📋 Production logs (Ctrl+C to exit)..."
	@docker-compose -f docker-compose.prod.yml logs -f

prod-shell:
	@echo "🐚 Opening production shell..."
	@echo "Available services: backend, frontend, admin, website, db"
	@read -p "Enter service name: " service; \
	docker-compose -f docker-compose.prod.yml exec $$service bash

prod-clean:
	@echo "🧹 Cleaning production environment..."
	@docker-compose -f docker-compose.prod.yml down -v --remove-orphans
	@docker system prune -f
	@echo "✅ Production environment cleaned"

# Database Commands
backup:
	@echo "💾 Creating database backup..."
	@chmod +x scripts/backup.sh
	@./scripts/backup.sh

restore:
	@echo "📥 Restoring database from backup..."
	@echo "Available backups:"
	@ls -la database/backups/*.sql.gz 2>/dev/null || echo "No backups found"
	@read -p "Enter backup filename: " backup_file; \
	if [ -f "database/backups/$$backup_file" ]; then \
		echo "Restoring from $$backup_file..."; \
		gunzip -c "database/backups/$$backup_file" | docker-compose -f docker-compose.prod.yml exec -T db mysql -u root -p$$MYSQL_ROOT_PASSWORD milk_management; \
		echo "✅ Database restored successfully"; \
	else \
		echo "❌ Backup file not found"; \
	fi

# Utility Commands
test:
	@echo "🧪 Running tests..."
	@cd backend && python -m pytest tests/ -v
	@cd frontend && npm test -- --watchAll=false
	@echo "✅ Tests completed"

lint:
	@echo "🔍 Running linting..."
	@cd backend && flake8 app/ --max-line-length=100
	@cd frontend && npm run lint
	@echo "✅ Linting completed"

format:
	@echo "🎨 Formatting code..."
	@cd backend && black app/ --line-length=100
	@cd frontend && npm run format
	@echo "✅ Code formatting completed"

install-deps:
	@echo "📦 Installing dependencies..."
	@cd backend && pip install -r requirements.txt
	@cd frontend && npm install
	@cd admin && pip install -r requirements.txt
	@cd website && npm install
	@echo "✅ Dependencies installed"

# Service-specific commands
backend-logs:
	@docker-compose -f docker-compose.dev.yml logs -f backend

frontend-logs:
	@docker-compose -f docker-compose.dev.yml logs -f frontend

admin-logs:
	@docker-compose -f docker-compose.dev.yml logs -f admin

website-logs:
	@docker-compose -f docker-compose.dev.yml logs -f website

db-logs:
	@docker-compose -f docker-compose.dev.yml logs -f db

# Monitoring commands
monitor:
	@echo "📊 Opening monitoring dashboards..."
	@echo "📈 Prometheus: http://localhost:9090"
	@echo "📊 Grafana: http://localhost:3001 (admin/admin)"
	@echo "📧 Mailhog: http://localhost:8025"
	@echo "🗄️  Adminer: http://localhost:8080"

# Health check
health:
	@echo "🏥 Running health checks..."
	@curl -f http://localhost:8000/health || echo "❌ Backend health check failed"
	@curl -f http://localhost:3000 > /dev/null 2>&1 || echo "❌ Website health check failed"
	@docker-compose -f docker-compose.dev.yml exec -T db mysqladmin ping -h localhost --silent || echo "❌ Database health check failed"
	@echo "✅ Health checks completed"

# Quick restart
restart:
	@echo "🔄 Restarting services..."
	@docker-compose -f docker-compose.dev.yml restart
	@echo "✅ Services restarted"

# Update dependencies
update-deps:
	@echo "🔄 Updating dependencies..."
	@cd backend && pip install --upgrade -r requirements.txt
	@cd frontend && npm update
	@cd admin && pip install --upgrade -r requirements.txt
	@cd website && npm update
	@echo "✅ Dependencies updated"

# Database migration
migrate:
	@echo "🔄 Running database migrations..."
	@docker-compose -f docker-compose.dev.yml exec backend python -c "from app.db.session import engine; from app.db.models import Base; Base.metadata.create_all(bind=engine)"
	@docker-compose -f docker-compose.dev.yml exec admin python manage.py migrate
	@echo "✅ Migrations completed"

# Create superuser
superuser:
	@echo "👤 Creating superuser..."
	@docker-compose -f docker-compose.dev.yml exec admin python manage.py createsuperuser

# Show status
status:
	@echo "📊 Service Status:"
	@docker-compose -f docker-compose.dev.yml ps
	@echo ""
	@echo "🌐 Service URLs:"
	@echo "  Website: http://localhost:3000"
	@echo "  Frontend: http://localhost:8081"
	@echo "  Backend: http://localhost:8000"
	@echo "  Admin: http://localhost:8001"
	@echo "  Database: localhost:3306"
	@echo "  Adminer: http://localhost:8080"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana: http://localhost:3001"
	@echo "  Mailhog: http://localhost:8025" 
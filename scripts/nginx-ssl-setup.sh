#!/bin/bash

# Simple Nginx Setup Script for digidairy.site (host-level, not Docker)
# - Installs nginx and certbot if needed
# - Sets up config for admin.digidairy.site and api.digidairy.site (HTTP only)
# - Does NOT reference SSL or run certbot
# - You must run certbot manually after confirming nginx is running

set -e

ADMIN_DOMAIN=admin.digidairy.site
API_DOMAIN=api.digidairy.site
NGINX_CONF_PATH="/etc/nginx/sites-available/digidairy"
NGINX_CONF_LINK="/etc/nginx/sites-enabled/digidairy"
STATIC_PATH="/home/static"   # Update if your static path is different
MEDIA_PATH="/home/media"     # Update if your media path is different

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. Install nginx and certbot if needed
install_nginx_certbot() {
    info "Installing nginx and certbot if not present..."
    apt-get update
    apt-get install -y nginx certbot python3-certbot-nginx
}

# 2. Write nginx config (HTTP only)
write_nginx_config() {
    info "Writing nginx config to $NGINX_CONF_PATH..."
    cat > "$NGINX_CONF_PATH" <<EOF
upstream admin_app {
    server 127.0.0.1:1002;
}
upstream backend_api {
    server 127.0.0.1:8000;
}

# Admin Panel
server {
    listen 80;
    server_name $ADMIN_DOMAIN;
    location /static/ {
        alias $STATIC_PATH/;
        expires 30d;
        access_log off;
        log_not_found off;
        add_header Cache-Control "public, immutable";
    }
    location /media/ {
        alias $MEDIA_PATH/;
        expires 30d;
        access_log off;
        log_not_found off;
        add_header Cache-Control "public, immutable";
    }
    location / {
        proxy_pass http://admin_app;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        send_timeout 60s;
    }
}

# API
server {
    listen 80;
    server_name $API_DOMAIN;
    location / {
        proxy_pass http://backend_api;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        send_timeout 60s;
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }
}
EOF
    info "nginx config written."
}

# 3. Symlink config
symlink_nginx_config() {
    if [ ! -L "$NGINX_CONF_LINK" ]; then
        ln -s "$NGINX_CONF_PATH" "$NGINX_CONF_LINK"
        info "Symlinked $NGINX_CONF_PATH to $NGINX_CONF_LINK."
    else
        info "Symlink already exists."
    fi
}

# 4. Reload nginx
reload_nginx() {
    info "Reloading nginx..."
    nginx -t && systemctl reload nginx
}

# Main
main() {
    install_nginx_certbot
    write_nginx_config
    symlink_nginx_config
    reload_nginx
    info "Nginx setup complete! Now run certbot manually to enable SSL."
}

main
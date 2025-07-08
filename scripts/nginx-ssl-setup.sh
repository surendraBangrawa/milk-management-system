#!/bin/bash

# Nginx & SSL Setup Script for digidairy.site (host-level, not Docker)
# - Installs nginx and certbot if needed
# - Sets up config for admin.digidairy.site and api.digidairy.site
# - Obtains/renews SSL certs
# - Reloads nginx
# - Idempotent: safe to run multiple times

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

# 2. Write nginx config
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
    return 301 https://\$host\$request_uri;
}
server {
    listen 443 ssl;
    http2;
    server_name $ADMIN_DOMAIN;
    ssl_certificate /etc/letsencrypt/live/$ADMIN_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$ADMIN_DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
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
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
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
    return 301 https://\$host\$request_uri;
}
server {
    listen 443 ssl;
    http2;
    server_name $API_DOMAIN;
    ssl_certificate /etc/letsencrypt/live/$API_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$API_DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    location / {
        proxy_pass http://backend_api;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        send_timeout 60s;
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
        if ($request_method = 'OPTIONS') {
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

# 4. Obtain/renew SSL certs
obtain_ssl() {
    info "Obtaining SSL certificates for $ADMIN_DOMAIN and $API_DOMAIN..."
    certbot --nginx --non-interactive --agree-tos --redirect --expand --email admin@digidairy.site -d $ADMIN_DOMAIN -d $API_DOMAIN || true
}

# 5. Reload nginx
reload_nginx() {
    info "Reloading nginx..."
    nginx -t && systemctl reload nginx
}

# Main
main() {
    install_nginx_certbot
    write_nginx_config
    symlink_nginx_config
    obtain_ssl
    reload_nginx
    info "Nginx and SSL setup complete!"
}

main 
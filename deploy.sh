#!/bin/bash

# CastingBot Production Deployment Script
# This script automates the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_header() {
    echo -e "\n${GREEN}=== $1 ===${NC}\n"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        print_info "Creating .env from .env.example..."
        cp .env.example .env
        print_info "Please edit .env file with your configuration and run this script again."
        exit 1
    fi
    print_success ".env file found"
}

# Validate required environment variables
validate_env_vars() {
    print_info "Validating required environment variables..."
    
    required_vars=("POSTGRES_PASSWORD" "BOT_TOKEN" "JWT_SECRET" "ADMIN_EMAIL" "ADMIN_PASSWORD")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env 2>/dev/null || grep -q "^${var}=.*change.*" .env 2>/dev/null; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Please configure these variables in .env file:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    mkdir -p nginx/ssl
    mkdir -p nginx/logs
    mkdir -p backend/uploads
    print_success "Directories created"
}

# Pull latest changes
pull_changes() {
    print_info "Pulling latest changes from git..."
    git pull origin main || print_info "Skipping git pull (not in a git repository or no changes)"
    print_success "Code updated"
}

# Build and start services
deploy_services() {
    print_info "Building Docker images..."
    docker compose -f docker-compose.prod.yml build
    print_success "Images built"

    print_info "Starting services..."
    docker compose -f docker-compose.prod.yml up -d
    print_success "Services started"
}

# Wait for database to be ready
wait_for_db() {
    print_info "Waiting for database to be ready..."
    sleep 10
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            print_success "Database is ready"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "Database failed to start"
    return 1
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
    print_success "Migrations completed"
}

# Seed superadmin
seed_superadmin() {
    print_info "Seeding superadmin account..."
    docker compose -f docker-compose.prod.yml exec -T backend npx prisma db seed || print_info "Superadmin already exists or seeding skipped"
    print_success "Superadmin seeding completed"
}

# Show service status
show_status() {
    print_header "Service Status"
    docker compose -f docker-compose.prod.yml ps
}

# Show logs
show_logs() {
    print_header "Recent Logs"
    docker compose -f docker-compose.prod.yml logs --tail=50
}

# Main deployment flow
main() {
    print_header "CastingBot Production Deployment"
    
    # Pre-deployment checks
    print_header "Pre-deployment Checks"
    check_env_file
    validate_env_vars
    create_directories
    
    # Deployment
    print_header "Deployment"
    pull_changes
    deploy_services
    wait_for_db
    run_migrations
    seed_superadmin
    
    # Post-deployment
    show_status
    
    print_header "Deployment Complete!"
    print_success "Application is now running"
    print_info "Frontend: http://localhost (or your domain)"
    print_info "Backend API: http://localhost/api (or your API domain)"
    print_info ""
    print_info "Next steps:"
    print_info "1. Configure SSL certificates (see nginx/README.md)"
    print_info "2. Update DNS records to point to this server"
    print_info "3. Login with superadmin credentials from .env file"
    print_info "4. Change superadmin password immediately"
    print_info ""
    print_info "To view logs: docker compose -f docker-compose.prod.yml logs -f"
    print_info "To stop services: docker compose -f docker-compose.prod.yml down"
}

# Run main function
main

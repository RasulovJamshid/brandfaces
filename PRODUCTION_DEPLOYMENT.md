# Production Deployment Guide

This guide covers deploying the CastingBot application to production using Docker, Docker Compose, and Nginx as a reverse proxy.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Superadmin Seeder](#superadmin-seeder)
- [Docker Deployment](#docker-deployment)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring and Logs](#monitoring-and-logs)
- [Backup and Restore](#backup-and-restore)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Domain name (for SSL/TLS)
- Server with at least 2GB RAM and 20GB storage
- SSH access to production server

## Architecture Overview

The production setup consists of:
- **Nginx**: Reverse proxy and SSL termination
- **Frontend**: React/Vite application (served as static files)
- **Backend**: NestJS API server
- **PostgreSQL**: Database server
- **Volumes**: Persistent data storage

```
Internet → Nginx (80/443) → Frontend (static files)
                          → Backend API (:3000)
                          → PostgreSQL (:5432)
```

## Environment Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd CastingBot
```

### 2. Configure Environment Variables

**All environment variables are centralized in the root `.env` file.**

Create `.env` from the example:

```bash
cp .env.example .env
```

Edit `.env` with your production configuration:

```env
# PostgreSQL Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE
POSTGRES_DB=casting_db

# Backend Configuration
BOT_TOKEN=your_telegram_bot_token_here
JWT_SECRET=GENERATE_STRONG_SECRET_HERE
PORT=3000

# Superadmin Seeder Configuration
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=STRONG_ADMIN_PASSWORD_HERE

# Frontend Configuration
VITE_API_URL=https://api.yourdomain.com
VITE_UPLOADS_URL=https://api.yourdomain.com/uploads

# Domain Configuration (for Nginx)
DOMAIN=yourdomain.com
API_DOMAIN=api.yourdomain.com

# Application Environment
NODE_ENV=production

# CORS Configuration (optional)
# CORS_ORIGIN=https://yourdomain.com
```

**Security Notes:**
- Generate strong passwords using: `openssl rand -base64 32`
- Never commit `.env` files to version control
- Use different credentials for production vs development
- No need to create separate `.env` files in `backend/` or `frontend/` directories
- All services read from the root `.env` file

## Database Setup

### Initial Migration

The database will be automatically set up on first run, but you can manually run migrations:

```bash
cd backend
npm install
npx prisma migrate deploy
```

### Database Backup

Create regular backups:

```bash
# Backup
docker exec casting_db pg_dump -U postgres casting_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker exec -i casting_db psql -U postgres casting_db < backup_file.sql
```

## Superadmin Seeder

The superadmin seeder creates the initial administrator account.

### Automatic Seeding (Recommended)

The seed script runs automatically during deployment. Configure via environment variables:

```env
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="YourSecurePassword123!"
```

### Manual Seeding

To manually create or recreate the superadmin:

```bash
cd backend
npm run build
npx prisma db seed
```

**Output:**
```
Admin created: admin@yourdomain.com
Password: YourSecurePassword123!
```

### Seeder Features

- **Idempotent**: Won't create duplicate admins
- **Role**: Creates user with `SUPER_ADMIN` role
- **Password**: Automatically hashed with bcrypt
- **Configurable**: Uses environment variables

### Post-Seeding

1. Login with the superadmin credentials
2. **Immediately change the password** via the admin panel
3. Create additional admin accounts as needed
4. Remove or secure the `ADMIN_PASSWORD` environment variable

## Docker Deployment

### Production Build

#### 1. Build Images

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Or build individually
docker-compose -f docker-compose.prod.yml build backend
docker-compose -f docker-compose.prod.yml build frontend
```

#### 2. Start Services

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### 3. Run Database Migrations

```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

#### 4. Seed Superadmin

```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

### Service Management

```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# View logs for specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Execute commands in container
docker-compose -f docker-compose.prod.yml exec backend sh
```

## SSL/TLS Configuration

### Using Let's Encrypt (Certbot)

#### 1. Install Certbot

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

#### 2. Obtain Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

#### 3. Auto-Renewal

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

#### 4. Update Nginx Configuration

The nginx configuration in `nginx/nginx.conf` will be automatically updated by certbot.

### Manual SSL Configuration

If using custom certificates, place them in:
- Certificate: `/etc/nginx/ssl/cert.pem`
- Private Key: `/etc/nginx/ssl/key.pem`

Update `nginx/nginx.conf` accordingly.

## Monitoring and Logs

### Application Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Backend only
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Container Health

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats

# Inspect specific container
docker inspect casting_backend
```

### Database Monitoring

```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d casting_db

# Check connections
SELECT * FROM pg_stat_activity;

# Database size
SELECT pg_size_pretty(pg_database_size('casting_db'));
```

## Backup and Restore

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/castingbot"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
docker exec casting_db pg_dump -U postgres casting_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Uploads backup
docker cp casting_backend:/usr/src/app/uploads $BACKUP_DIR/uploads_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and add to cron:

```bash
chmod +x backup.sh
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Restore from Backup

```bash
# Restore database
gunzip < db_backup.sql.gz | docker exec -i casting_db psql -U postgres casting_db

# Restore uploads
docker cp uploads_backup casting_backend:/usr/src/app/uploads
```

## Troubleshooting

### Common Issues

#### 1. Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check if port is in use
sudo netstat -tulpn | grep :3000

# Rebuild container
docker-compose -f docker-compose.prod.yml up -d --build backend
```

#### 2. Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec backend npx prisma db pull

# Check DATABASE_URL in backend/.env
```

#### 3. Nginx 502 Bad Gateway

```bash
# Check backend is running
docker-compose -f docker-compose.prod.yml ps backend

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Test backend directly
curl http://localhost:3000/api/health
```

#### 4. Frontend Not Loading

```bash
# Check nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Rebuild frontend
docker-compose -f docker-compose.prod.yml up -d --build frontend

# Check static files
docker-compose -f docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html
```

#### 5. Superadmin Login Failed

```bash
# Re-run seeder
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed

# Check admin in database
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d casting_db -c "SELECT * FROM \"Admin\";"

# Reset password manually
docker-compose -f docker-compose.prod.yml exec backend node -e "const bcrypt = require('bcrypt'); bcrypt.hash('newpassword', 10).then(console.log);"
```

### Performance Optimization

#### 1. Enable Gzip Compression

Already configured in nginx.conf.

#### 2. Database Optimization

```sql
-- Analyze tables
ANALYZE;

-- Vacuum database
VACUUM ANALYZE;

-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

#### 3. Container Resource Limits

Add to docker-compose.prod.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          memory: 512M
```

### Security Checklist

- [ ] All `.env` files configured with strong passwords
- [ ] SSL/TLS certificates installed and auto-renewing
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Database not exposed to public internet
- [ ] Regular backups scheduled
- [ ] Superadmin password changed from default
- [ ] JWT_SECRET is strong and unique
- [ ] Docker images updated regularly
- [ ] Application logs monitored
- [ ] Rate limiting enabled in Nginx

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Update Dependencies

```bash
# Backend
cd backend
npm update
npm audit fix

# Frontend
cd frontend
npm update
npm audit fix

# Rebuild containers
docker-compose -f docker-compose.prod.yml up -d --build
```

## Support

For issues and questions:
- Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
- Review this documentation
- Check GitHub issues
- Contact system administrator

---

**Last Updated:** 2026-02-06

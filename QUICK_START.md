# Quick Start Guide - Production Deployment

This guide will help you deploy CastingBot to production in under 10 minutes.

## Prerequisites

- Docker and Docker Compose installed
- Domain name with DNS access
- Server with SSH access (minimum 2GB RAM)

## Step 1: Clone and Configure (2 minutes)

```bash
# Clone repository
git clone <your-repo-url>
cd CastingBot

# Copy environment file (all configuration is centralized here)
cp .env.example .env

# Edit configuration
nano .env
```

**Required Configuration:**

All environment variables are in the root `.env` file:

```env
# PostgreSQL Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_strong_db_password
POSTGRES_DB=casting_db

# Backend Configuration
BOT_TOKEN=your_telegram_bot_token
JWT_SECRET=your_strong_jwt_secret
PORT=3000

# Superadmin Seeder
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_strong_admin_password

# Frontend Configuration
VITE_API_URL=https://api.yourdomain.com
VITE_UPLOADS_URL=https://api.yourdomain.com/uploads

# Application Environment
NODE_ENV=production
```

**Note:** No need to create separate `.env` files in `backend/` or `frontend/` directories.

## Step 2: Update Domain Names (1 minute)

Edit `nginx/conf.d/default.conf` and replace:
- `yourdomain.com` → your actual domain
- `api.yourdomain.com` → your API subdomain

## Step 3: Deploy (3 minutes)

### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Windows (PowerShell):
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\deploy.ps1
```

### Manual Deployment:
```bash
# Create directories
mkdir -p nginx/ssl nginx/logs backend/uploads

# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Wait for database (about 10 seconds)
sleep 10

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed superadmin
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

## Step 4: Configure SSL (2 minutes)

### Option A: Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Update docker-compose.prod.yml to mount certificates
# Add under nginx volumes:
#   - /etc/letsencrypt:/etc/letsencrypt:ro

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Option B: Skip SSL (Development Only)

Comment out HTTPS server blocks in `nginx/conf.d/default.conf` and use HTTP only.

## Step 5: Verify Deployment (1 minute)

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Expected output:
# NAME                 STATUS
# casting_backend      Up (healthy)
# casting_db           Up (healthy)
# casting_frontend     Up (healthy)
# casting_nginx        Up (healthy)

# Test endpoints
curl http://localhost/health        # Should return "healthy"
curl http://localhost/api/health    # Should return API health status
```

## Step 6: First Login

1. Open your browser to `https://yourdomain.com`
2. Login with credentials from `.env`:
   - Email: Value of `ADMIN_EMAIL`
   - Password: Value of `ADMIN_PASSWORD`
3. **IMMEDIATELY change the password** after first login

## Common Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Restart a service
docker-compose -f docker-compose.prod.yml restart backend

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Update and redeploy
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build

# Backup database
docker exec casting_db pg_dump -U postgres casting_db > backup.sql

# Access database
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d casting_db
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check if ports are in use
sudo netstat -tulpn | grep -E ':(80|443|3000|5432)'

# Rebuild from scratch
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build
```

### Can't login
```bash
# Re-run seeder
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed

# Check admin exists
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d casting_db -c "SELECT * FROM \"Admin\";"
```

### 502 Bad Gateway
```bash
# Check backend is running
docker-compose -f docker-compose.prod.yml ps backend

# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

## Security Checklist

- [ ] Changed all default passwords
- [ ] SSL/TLS certificates installed
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Superadmin password changed after first login
- [ ] Regular backups scheduled
- [ ] `.env` files not committed to git
- [ ] Strong JWT_SECRET generated
- [ ] Database not exposed to public internet

## Next Steps

- Set up automated backups (see PRODUCTION_DEPLOYMENT.md)
- Configure monitoring and alerts
- Set up log rotation
- Review and adjust rate limits
- Configure additional admin users
- Set up CI/CD pipeline

## Support

For detailed documentation, see:
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Complete deployment guide
- [nginx/README.md](./nginx/README.md) - Nginx configuration guide
- [README.md](./README.md) - Project overview

---

**Deployment Time:** ~10 minutes  
**Difficulty:** Easy  
**Last Updated:** 2026-02-06

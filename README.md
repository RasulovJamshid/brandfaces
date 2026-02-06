# Casting Platform (Bot & Dashboard)

Full Stack Application with Telegram Bot (NestJS) and Admin Dashboard (React).

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Deploy to production in 10 minutes
- **[Production Deployment](./PRODUCTION_DEPLOYMENT.md)** - Complete production deployment guide
- **[Nginx Configuration](./nginx/README.md)** - Reverse proxy and SSL setup
- **[Migration Guide](./MIGRATION_GUIDE.md)** - Migrate from old multi-file .env structure

## Prerequisites
- Docker Desktop installed and running
- Telegram Bot Token (from @BotFather)
- Node.js 20+ (for local development)

## Docker Usage Guide

This project is fully containerized using Docker Compose.

### 1. Configuration

**All environment variables are centralized in the root `.env` file.**

Create the `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# PostgreSQL Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=casting_db

# Backend Configuration
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
JWT_SECRET=supersecretkey
PORT=3000

# Superadmin Seeder
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password123

# Frontend Configuration
VITE_API_URL=http://localhost:3000
VITE_UPLOADS_URL=http://localhost:3000/uploads

# Application Environment
NODE_ENV=development
```

**Note:** No need to create separate `.env` files in `backend/` or `frontend/` directories. All services use the root `.env` file.

### 2. Running the Application
Build and start all services (Database, Backend, Frontend):

```bash
docker-compose up -d --build
```

- **Backend** will be available at `http://localhost:3000`
- **Frontend** will be available at `http://localhost:5173`
- **Database** will be accessible on port `5432`

### 3. Database Setup (Migrations)
After starting the containers for the first time, you need to apply database migrations. Run this command inside the backend container:

```bash
docker exec -it casting_backend npx prisma migrate dev --name init
```

To see the logs of the migration or backend service:
```bash
docker logs -f casting_backend
```

### 4. Stopping the Application
To stop all services:
```bash
docker-compose down
```

### 5. Managing Data
The database data is persisted in a Docker volume `postgres_data`. To reset the database completely:
```bash
docker-compose down -v
```

## Production Deployment

For production deployment with Nginx reverse proxy, SSL/TLS, and optimized Docker images:

### Quick Deploy
```bash
# Linux/Mac
chmod +x deploy.sh
./deploy.sh

# Windows PowerShell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\deploy.ps1
```

### Manual Production Deploy
```bash
# 1. Configure environment
cp .env.example .env
cp backend/.env.example backend/.env
# Edit .env files with production values

# 2. Update domain names in nginx/conf.d/default.conf

# 3. Deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Run migrations and seed
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed

# 5. Configure SSL (see PRODUCTION_DEPLOYMENT.md)
```

**Production Features:**
- ✅ Nginx reverse proxy with SSL/TLS support
- ✅ Optimized multi-stage Docker builds
- ✅ Rate limiting and security headers
- ✅ Health checks and auto-restart
- ✅ Gzip compression and caching
- ✅ Automated superadmin seeding

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for complete guide.

## Manual Setup (Non-Docker)
If you prefer to run locally without Docker for the apps:

1. **Configure Environment**: Copy `.env.example` to `.env` and update `DATABASE_URL` to use `localhost` instead of `postgres`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/casting_db?schema=public"
   ```

2. **Database**: Use `docker-compose up -d postgres`.

3. **Backend**:
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

4. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

**Note:** Backend and Frontend will read environment variables from the root `.env` file.

## Superadmin User

The application includes an automated superadmin seeder that creates the initial administrator account.

### Configuration

Set these environment variables in the root `.env` file:
```env
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="password123"
```

### Running the Seeder

**Development:**
```bash
docker exec -it casting_backend npx prisma db seed
```

**Production:**
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

**Local (non-Docker):**
```bash
cd backend
npx prisma db seed
```

### Features
- ✅ Idempotent - won't create duplicates
- ✅ Creates SUPER_ADMIN role
- ✅ Password automatically hashed with bcrypt
- ✅ Configurable via environment variables

**Security Note:** Change the superadmin password immediately after first login in production!

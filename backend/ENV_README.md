# Backend Environment Configuration

## ⚠️ Important Notice

**Environment variables for this backend service are configured in the root `.env` file.**

## Configuration Location

```
CastingBot/
└── .env  ← Configure all environment variables here
```

**Do NOT create a `backend/.env` file when using Docker.**

## Required Variables

The backend service requires these variables from the root `.env` file:

```env
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/casting_db?schema=public

# Authentication
JWT_SECRET=your_jwt_secret_here

# Telegram Bot
BOT_TOKEN=your_telegram_bot_token

# Superadmin Seeder
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password

# Application
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

## How It Works

Docker Compose automatically passes environment variables from the root `.env` file to the backend container:

```yaml
# docker-compose.yml
backend:
  environment:
    DATABASE_URL: ${DATABASE_URL}
    JWT_SECRET: ${JWT_SECRET}
    BOT_TOKEN: ${BOT_TOKEN}
    # ... etc
```

## Local Development (Without Docker)

If running the backend locally without Docker:

1. Create a `backend/.env` file (only for local development)
2. Copy values from `backend/.env.example`
3. Update `DATABASE_URL` to use `localhost` instead of `postgres`

```bash
cd backend
cp .env.example .env
# Edit .env with your local configuration
npm install
npm run start:dev
```

## Verification

Check that environment variables are available in the container:

```bash
# View all environment variables
docker-compose exec backend env

# Check specific variables
docker-compose exec backend env | grep -E "DATABASE_URL|BOT_TOKEN|JWT_SECRET"
```

## Documentation

- [Root README.md](../README.md) - Main project documentation
- [.env.example](../.env.example) - Environment variable template
- [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) - Migration from old structure

---

**Configuration Method:** Centralized (root `.env` file)  
**Last Updated:** 2026-02-06

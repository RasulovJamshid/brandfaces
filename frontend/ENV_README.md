# Frontend Environment Configuration

## ⚠️ Important Notice

**Environment variables for this frontend service are configured in the root `.env` file.**

## Configuration Location

```
CastingBot/
└── .env  ← Configure all environment variables here
```

**Do NOT create a `frontend/.env` file when using Docker.**

## Required Variables

The frontend service requires these variables from the root `.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_UPLOADS_URL=http://localhost:3000/uploads
```

## How It Works

### Development Mode

Docker Compose passes environment variables from the root `.env` file to the frontend container:

```yaml
# docker-compose.yml
frontend:
  environment:
    VITE_API_URL: ${VITE_API_URL}
    VITE_UPLOADS_URL: ${VITE_UPLOADS_URL}
```

### Production Mode

For production builds, environment variables are passed as build arguments:

```yaml
# docker-compose.prod.yml
frontend:
  build:
    args:
      VITE_API_URL: ${VITE_API_URL}
      VITE_UPLOADS_URL: ${VITE_UPLOADS_URL}
```

These are embedded into the static build at build time.

## Environment-Specific Values

### Development
```env
VITE_API_URL=http://localhost:3000
VITE_UPLOADS_URL=http://localhost:3000/uploads
```

### Production
```env
VITE_API_URL=https://api.yourdomain.com
VITE_UPLOADS_URL=https://api.yourdomain.com/uploads
```

## Local Development (Without Docker)

If running the frontend locally without Docker:

1. Create a `frontend/.env` file (only for local development)
2. Add your environment variables:

```bash
cd frontend
echo "VITE_API_URL=http://localhost:3000" > .env
echo "VITE_UPLOADS_URL=http://localhost:3000/uploads" >> .env
npm install
npm run dev
```

## Verification

### Development Container

Check environment variables in the running container:

```bash
docker-compose exec frontend env | grep VITE_
```

### Production Build

Verify variables were embedded in the build:

```bash
# Check build args were passed
docker-compose -f docker-compose.prod.yml config | grep -A 5 "args:"

# Check built files
docker-compose -f docker-compose.prod.yml exec frontend cat /usr/share/nginx/html/index.html | grep -o "VITE_API_URL"
```

## Troubleshooting

### Frontend can't connect to API

1. **Check VITE_API_URL is set:**
   ```bash
   grep VITE_API_URL ../.env
   ```

2. **Verify it's accessible from browser:**
   - Open browser console
   - Check Network tab for API requests
   - Verify the URL being used

3. **Rebuild if needed:**
   ```bash
   docker-compose down
   docker-compose up -d --build frontend
   ```

### Environment variables not updating

For Vite, environment variables are embedded at **build time**, not runtime.

**Solution:** Rebuild the frontend:
```bash
docker-compose up -d --build frontend
```

## Important Notes

⚠️ **Vite Environment Variables:**
- Must be prefixed with `VITE_` to be exposed to the client
- Are embedded at build time (not runtime)
- Require rebuild when changed

⚠️ **Security:**
- Never put sensitive data in `VITE_*` variables
- These values are visible in the browser
- Only use for public configuration (API URLs, etc.)

## Documentation

- [Root README.md](../README.md) - Main project documentation
- [.env.example](../.env.example) - Environment variable template
- [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) - Migration from old structure
- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html) - Official Vite docs

---

**Configuration Method:** Centralized (root `.env` file)  
**Last Updated:** 2026-02-06

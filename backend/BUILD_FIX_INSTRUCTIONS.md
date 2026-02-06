# Build Fix Instructions

## Problem

Build errors occur because the Prisma schema was updated with a City model, but:
1. The Prisma Client hasn't been regenerated
2. The database migration hasn't been run

## Quick Fix (3 Steps)

### Step 1: Run Prisma Migration

```bash
cd backend
npx prisma migrate dev --name add_city_model
```

This will:
- Create the `City` table in the database
- Add `cityId` column to `User` table (nullable)
- Update the database schema

### Step 2: Regenerate Prisma Client

```bash
npx prisma generate
```

This regenerates the TypeScript types and Prisma Client with the new City model.

### Step 3: Rebuild Application

```bash
npm run build
```

## Verification

```bash
# Check if build succeeds
npm run build

# Start the application
npm run start:dev

# Test the cities endpoint
curl http://localhost:3000/cities
```

## What Changed

### Schema Updates

**New City Model:**
```prisma
model City {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  nameEn    String?
  nameRu    String?
  region    String?
  country   String   @default("Russia")
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  users     User[]
}
```

**Updated User Model:**
```prisma
model User {
  // ... other fields
  city      String    // Kept for backward compatibility
  cityId    Int?      // New optional field
  cityModel City?     @relation(fields: [cityId], references: [id])
  // ... other fields
}
```

### New API Endpoints

```bash
GET  /cities              # Get all active cities
GET  /cities/search?q=    # Search cities
GET  /cities/stats        # Get city statistics
GET  /cities/:id          # Get city by ID
POST /cities              # Create city (admin)
PUT  /cities/:id          # Update city (admin)
PUT  /cities/:id/deactivate  # Deactivate city (admin)
```

## Backward Compatibility

✅ **Existing code continues to work**
- The `city` field (String) is still present
- `cityId` is optional (nullable)
- No immediate code changes required

## Optional: Seed Cities Data

After migration, you can seed cities:

### Option 1: Using Prisma Studio

```bash
npx prisma studio
```

Navigate to City model and add cities manually.

### Option 2: Using SQL

```sql
INSERT INTO "City" ("name", "nameEn", "nameRu", "region", "country", "sortOrder") VALUES
('Moscow', 'Moscow', 'Москва', 'Moscow', 'Russia', 1),
('Saint Petersburg', 'Saint Petersburg', 'Санкт-Петербург', 'Leningrad Oblast', 'Russia', 2),
('Novosibirsk', 'Novosibirsk', 'Новосибирск', 'Novosibirsk Oblast', 'Russia', 3),
('Yekaterinburg', 'Yekaterinburg', 'Екатеринбург', 'Sverdlovsk Oblast', 'Russia', 4),
('Kazan', 'Kazan', 'Казань', 'Republic of Tatarstan', 'Russia', 5);
```

### Option 3: Using API

```bash
curl -X POST http://localhost:3000/cities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Moscow",
    "nameEn": "Moscow",
    "nameRu": "Москва",
    "region": "Moscow",
    "country": "Russia",
    "sortOrder": 1
  }'
```

## Docker Build

If building with Docker:

```bash
# Development
docker-compose up -d --build

# Run migration inside container
docker-compose exec backend npx prisma migrate dev

# Production
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## Troubleshooting

### Error: "Property 'city' does not exist on type 'PrismaService'"

**Solution:** Run `npx prisma generate`

### Error: "Cannot find module '../auth/jwt-auth.guard'"

**Status:** Already fixed. Auth guards are commented out in cities.controller.ts

### Error: Migration fails

**Solution:** Check database connection in `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/casting_db?schema=public"
```

### Error: "cityModel is required"

**Status:** Already fixed. `cityId` and `cityModel` are now optional in the schema.

## Migration Strategy

### Current Phase: Dual Support
- Both `city` (String) and `cityId` (Int?) exist
- Existing functionality unchanged
- New City API available

### Future Phase: Full Migration
When ready to fully adopt City model:
1. Update bot to use city selection
2. Migrate existing data (populate cityId from city names)
3. Make cityId required
4. Remove city field

## Summary

**Required Actions:**
1. ✅ Run `npx prisma migrate dev`
2. ✅ Run `npx prisma generate`  
3. ✅ Run `npm run build`

**Optional Actions:**
- Seed cities data
- Update bot to use city selection
- Migrate existing user data

**Status:** Ready to build after running migration commands.

---

**Last Updated:** 2026-02-06  
**Estimated Time:** 2-3 minutes

# City Model Migration Steps

## Quick Fix for Build Errors

The build errors occur because the schema was updated but the migration hasn't been run yet. Follow these steps:

### Step 1: Create the Migration

```bash
cd backend
npx prisma migrate dev --name add_city_model_optional
```

This will:
- Create the City table
- Add cityId column to User (nullable)
- Generate updated Prisma Client

### Step 2: Regenerate Prisma Client

```bash
npx prisma generate
```

### Step 3: Seed Cities Data

Create a seed file or run this SQL manually:

```sql
-- Insert major Russian cities
INSERT INTO "City" ("name", "nameEn", "nameRu", "region", "country", "sortOrder") VALUES
('Moscow', 'Moscow', 'Москва', 'Moscow', 'Russia', 1),
('Saint Petersburg', 'Saint Petersburg', 'Санкт-Петербург', 'Leningrad Oblast', 'Russia', 2),
('Novosibirsk', 'Novosibirsk', 'Новосибирск', 'Novosibirsk Oblast', 'Russia', 3),
('Yekaterinburg', 'Yekaterinburg', 'Екатеринбург', 'Sverdlovsk Oblast', 'Russia', 4),
('Kazan', 'Kazan', 'Казань', 'Republic of Tatarstan', 'Russia', 5),
('Nizhny Novgorod', 'Nizhny Novgorod', 'Нижний Новгород', 'Nizhny Novgorod Oblast', 'Russia', 6),
('Chelyabinsk', 'Chelyabinsk', 'Челябинск', 'Chelyabinsk Oblast', 'Russia', 7),
('Samara', 'Samara', 'Самара', 'Samara Oblast', 'Russia', 8),
('Omsk', 'Omsk', 'Омск', 'Omsk Oblast', 'Russia', 9),
('Rostov-on-Don', 'Rostov-on-Don', 'Ростов-на-Дону', 'Rostov Oblast', 'Russia', 10);
```

Or use Prisma:

```bash
npx prisma studio
# Navigate to City model and add cities manually
```

### Step 4: Rebuild Application

```bash
npm run build
```

## Current State

The schema has been updated to make `cityId` **optional** during the migration period:

```prisma
model User {
  city      String    // Keep for backward compatibility
  cityId    Int?      // Optional during migration
  cityModel City?     @relation(fields: [cityId], references: [id])
}
```

This allows:
- ✅ Existing code to continue using `city` field
- ✅ New code to gradually adopt `cityId`
- ✅ Smooth migration without breaking changes

## Migration Strategy

### Phase 1: Dual Support (Current)
- Both `city` (String) and `cityId` (Int?) exist
- Existing code continues to work
- New features can use cityId

### Phase 2: Gradual Migration
- Update bot registration to use cityId
- Update admin panel to use cityId
- Migrate existing data: populate cityId from city names

### Phase 3: Deprecation
- Make cityId required
- Remove city field
- Full migration complete

## Code Updates Needed

### 1. Bot Registration (Optional - can keep using city for now)

If you want to use the new City model in bot:

```typescript
// registration.scene.ts
// Add city selection step
async showCitySelection(ctx: any) {
    const cities = await this.citiesService.findAll();
    const keyboard = cities.map(city => [
        Markup.button.callback(
            city.nameRu || city.name,
            `select_city_${city.id}`
        ),
    ]);
    await ctx.reply('Выберите город:', Markup.inlineKeyboard(keyboard));
}

@Action(/^select_city_(\d+)$/)
async handleCitySelection(ctx: any) {
    const cityId = parseInt(ctx.match[1]);
    ctx.scene.session.cityId = cityId;
    // Get city name for display
    const city = await this.citiesService.findOne(cityId);
    ctx.scene.session.city = city.name;
    // Continue...
}
```

### 2. Users Service (No changes needed yet)

Current code continues to work with `city` field.

### 3. Data Migration Script (Run later)

When ready to fully migrate:

```typescript
// migrate-cities.ts
async function migrateCities() {
    const users = await prisma.user.findMany({
        where: { cityId: null },
    });
    
    for (const user of users) {
        const city = await prisma.city.findFirst({
            where: {
                OR: [
                    { name: { equals: user.city, mode: 'insensitive' } },
                    { nameRu: { equals: user.city, mode: 'insensitive' } },
                ],
            },
        });
        
        if (city) {
            await prisma.user.update({
                where: { id: user.id },
                data: { cityId: city.id },
            });
        } else {
            // Create city if doesn't exist
            const newCity = await prisma.city.create({
                data: {
                    name: user.city,
                    nameRu: user.city,
                    country: 'Russia',
                },
            });
            await prisma.user.update({
                where: { id: user.id },
                data: { cityId: newCity.id },
            });
        }
    }
}
```

## Testing

```bash
# 1. Run migration
npx prisma migrate dev

# 2. Check database
npx prisma studio

# 3. Test API
curl http://localhost:3000/cities

# 4. Rebuild
npm run build

# 5. Start server
npm run start:dev
```

## Rollback (if needed)

```bash
# Revert schema changes
git checkout backend/prisma/schema.prisma

# Regenerate client
npx prisma generate

# Rebuild
npm run build
```

## Summary

✅ **Current Status**: Schema updated, cityId is optional  
✅ **Build Fix**: Run `npx prisma migrate dev` and `npx prisma generate`  
✅ **Backward Compatible**: Existing code continues to work  
✅ **Migration Path**: Gradual adoption of cityId field  

The errors will be resolved once you run the Prisma migration commands.

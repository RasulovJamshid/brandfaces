-- Migration: Add City Model for Optimal Usage
-- This migration creates a separate City table and migrates existing data

-- Step 1: Create City table
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "nameRu" TEXT,
    "region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Russia',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create indexes for performance
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");
CREATE INDEX "City_nameEn_idx" ON "City"("nameEn");
CREATE INDEX "City_nameRu_idx" ON "City"("nameRu");
CREATE INDEX "City_country_idx" ON "City"("country");
CREATE INDEX "City_isActive_idx" ON "City"("isActive");

-- Step 3: Populate with common Russian cities
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
('Rostov-on-Don', 'Rostov-on-Don', 'Ростов-на-Дону', 'Rostov Oblast', 'Russia', 10),
('Ufa', 'Ufa', 'Уфа', 'Republic of Bashkortostan', 'Russia', 11),
('Krasnoyarsk', 'Krasnoyarsk', 'Красноярск', 'Krasnoyarsk Krai', 'Russia', 12),
('Voronezh', 'Voronezh', 'Воронеж', 'Voronezh Oblast', 'Russia', 13),
('Perm', 'Perm', 'Пермь', 'Perm Krai', 'Russia', 14),
('Volgograd', 'Volgograd', 'Волгоград', 'Volgograd Oblast', 'Russia', 15),
('Krasnodar', 'Krasnodar', 'Краснодар', 'Krasnodar Krai', 'Russia', 16),
('Saratov', 'Saratov', 'Саратов', 'Saratov Oblast', 'Russia', 17),
('Tyumen', 'Tyumen', 'Тюмень', 'Tyumen Oblast', 'Russia', 18),
('Tolyatti', 'Tolyatti', 'Тольятти', 'Samara Oblast', 'Russia', 19),
('Izhevsk', 'Izhevsk', 'Ижевск', 'Udmurt Republic', 'Russia', 20);

-- Step 4: Migrate existing user data
-- First, insert any unique cities from User table that don't exist in City table
INSERT INTO "City" ("name", "nameEn", "nameRu", "country", "isActive")
SELECT DISTINCT 
    TRIM("city") as name,
    TRIM("city") as nameEn,
    TRIM("city") as nameRu,
    'Russia' as country,
    true as isActive
FROM "User"
WHERE TRIM("city") NOT IN (SELECT "name" FROM "City")
AND "city" IS NOT NULL
AND TRIM("city") != '';

-- Step 5: Add cityId column to User table
ALTER TABLE "User" ADD COLUMN "cityId" INTEGER;

-- Step 6: Populate cityId based on existing city names (case-insensitive match)
UPDATE "User" u
SET "cityId" = c."id"
FROM "City" c
WHERE LOWER(TRIM(u."city")) = LOWER(c."name");

-- Step 7: Make cityId NOT NULL after data migration
-- (Run this after verifying all users have cityId)
-- ALTER TABLE "User" ALTER COLUMN "cityId" SET NOT NULL;

-- Step 8: Add foreign key constraint
ALTER TABLE "User" ADD CONSTRAINT "User_cityId_fkey" 
    FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 9: Create index on User.cityId for faster queries
CREATE INDEX "User_cityId_idx" ON "User"("cityId");

-- Step 10: (Optional) Drop old city column after verification
-- ALTER TABLE "User" DROP COLUMN "city";

-- Note: Keep the old "city" column temporarily for data verification
-- You can drop it later after confirming all data is migrated correctly

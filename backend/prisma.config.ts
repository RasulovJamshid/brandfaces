import { defineConfig } from "prisma/config";

const dbUrl = process.env["DATABASE_URL"] || "postgresql://dummy:dummy@localhost:5432/dummy";

console.log("Prisma Config Loading check:");
console.log("DATABASE_URL provided:", !!process.env["DATABASE_URL"]);
console.log("Using URL:", dbUrl);

const config = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node prisma/seed.ts",
  },
  datasource: {
    url: dbUrl,
  },
});

export default config;

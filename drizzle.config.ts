import { defineConfig } from 'drizzle-kit'
import { existsSync } from 'fs'

if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
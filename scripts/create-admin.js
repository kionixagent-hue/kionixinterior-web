/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS CLI script,
   not part of the Next.js app bundle; runs directly via `node` on Node 20 in prod. */
const { existsSync } = require('fs')
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

const postgres = require('postgres')
const { randomBytes, scryptSync } = require('crypto')

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('Usage: npm run admin:create -- <email> <password>')
  process.exit(1)
}

// ponytail: duplicates src/lib/auth/password.ts's hashPassword (that file is TS,
// this script is plain JS for Node-20 portability) — keep both in sync if the
// hashing scheme ever changes.
function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(pw, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL)
  const passwordHash = hashPassword(password)
  await sql`insert into admin_users (email, password_hash) values (${email}, ${passwordHash})`
  console.log(`Admin user created: ${email}`)
  await sql.end()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})

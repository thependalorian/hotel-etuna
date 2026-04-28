/**
 * Migration runner - use Drizzle instead of Prisma.
 * Run: npm run db:push   (sync schema to DB)
 * Or:  npm run db:generate && npm run db:migrate  (generate and run migrations)
 */
console.log('Use: npm run db:push (to sync Drizzle schema to database)');
console.log('Or:  npm run db:generate && npm run db:migrate (for migration files)');
process.exit(0);

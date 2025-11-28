// Run Prisma migrations on Railway PostgreSQL
const { execSync } = require('child_process');

// Set Railway DATABASE_URL temporarily
process.env.DATABASE_URL = 'postgresql://postgres:EHpbiIZtTBInIfWRYhyCiNiKkeOAJFSS@postgres.railway.internal:5432/railway?schema=public';

console.log('🚀 Running Prisma migrations on Railway PostgreSQL...');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Push schema to Railway database
  console.log('📋 Pushing schema to Railway database...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('✅ Migration completed! Tables should now be visible in Railway dashboard.');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
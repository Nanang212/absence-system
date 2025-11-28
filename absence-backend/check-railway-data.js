// Check attendance data in Railway PostgreSQL
const { PrismaClient } = require('@prisma/client');

async function checkData(databaseUrl) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    console.log('📡 Connecting to Railway PostgreSQL...');
    
    // Check if Attendance table exists and has data
    const attendanceCount = await prisma.attendance.count();
    console.log(`📊 Total attendance records: ${attendanceCount}`);
    
    if (attendanceCount > 0) {
      const records = await prisma.attendance.findMany({
        orderBy: { timestamp: 'desc' }
      });
      
      console.log('\n📋 Attendance records:');
      records.forEach((record, i) => {
        console.log(`${i+1}. ${record.email} - ${record.type} - ${record.timestamp}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Railway External DATABASE_URL
const RAILWAY_EXTERNAL_URL = 'postgresql://postgres:EHpbiIZtTBInIfWRYhyCiNiKkeOAJFSS@hopper.proxy.rlwy.net:56904/railway?schema=public';

console.log('� Checking data in Railway PostgreSQL...');

// Check data in Railway
checkData(RAILWAY_EXTERNAL_URL);
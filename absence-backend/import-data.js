// Import attendance data to Railway PostgreSQL
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Railway PostgreSQL connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      // Railway PostgreSQL DATABASE_PUBLIC_URL
      url: "postgresql://postgres:EHpbiIZtTBInIfWRYhyCiNiKkeOAJFSS@hopper.proxy.rlwy.net:56904/railway?schema=public"
    }
  }
});

async function importData() {
  try {
    console.log('📡 Connecting to Railway PostgreSQL...');
    
    // Read exported data
    const jsonData = JSON.parse(fs.readFileSync('attendance_export.json', 'utf8'));
    
    console.log(`📊 Importing ${jsonData.length} attendance records...`);

    for (const attendance of jsonData) {
      try {
        await prisma.attendance.create({
          data: {
            email: attendance.email,
            type: attendance.type,
            timestamp: new Date(attendance.timestamp),
            notes: attendance.notes,
            latitude: attendance.latitude,
            longitude: attendance.longitude
          }
        });
        console.log(`✅ Imported: ${attendance.email} - ${attendance.type} - ${attendance.timestamp}`);
      } catch (error) {
        console.log(`⚠️ Skipped duplicate: ${attendance.email} - ${attendance.type} - ${attendance.timestamp}`);
      }
    }

    console.log('🎉 Import completed!');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
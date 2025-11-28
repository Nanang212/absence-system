// Export attendance data from local database to SQL format
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:admin@localhost:5432/absence?schema=public"
    }
  }
});

async function exportData() {
  try {
    console.log('🔍 Fetching attendance data from local database...');
    
    const attendances = await prisma.attendance.findMany({
      orderBy: { timestamp: 'asc' }
    });

    console.log(`📊 Found ${attendances.length} attendance records`);

    if (attendances.length === 0) {
      console.log('ℹ️ No attendance data to export');
      return;
    }

    // Generate SQL INSERT statements
    let sqlContent = '-- Attendance Data Export\n';
    sqlContent += '-- Generated on: ' + new Date().toISOString() + '\n\n';
    
    for (const attendance of attendances) {
      const values = [
        `'${attendance.email}'`,
        `'${attendance.type}'`,
        `'${attendance.timestamp.toISOString()}'`,
        attendance.notes ? `'${attendance.notes.replace(/'/g, "''")}'` : 'NULL',
        attendance.latitude || 'NULL',
        attendance.longitude || 'NULL',
        attendance.createdAt ? `'${attendance.createdAt.toISOString()}'` : `'${new Date().toISOString()}'`,
        attendance.updatedAt ? `'${attendance.updatedAt.toISOString()}'` : `'${new Date().toISOString()}'`
      ];

      sqlContent += `INSERT INTO "Attendance" ("email", "type", "timestamp", "notes", "latitude", "longitude", "createdAt", "updatedAt") VALUES (${values.join(', ')});\n`;
    }

    // Write to file
    fs.writeFileSync('attendance_export.sql', sqlContent);
    
    console.log('✅ Export completed!');
    console.log('📄 File: attendance_export.sql');
    console.log(`📝 ${attendances.length} records exported`);

    // Also create JSON backup
    fs.writeFileSync('attendance_export.json', JSON.stringify(attendances, null, 2));
    console.log('📄 JSON backup: attendance_export.json');

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
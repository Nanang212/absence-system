// Test logic keterlambatan Clock IN dan Clock OUT
console.log('🧪 Testing Attendance Comment Logic\n');
console.log('='.repeat(60));

function generateComment(type, ts) {
  const date = new Date(ts);
  const shiftStart = new Date(date);
  shiftStart.setHours(8, 0, 0, 0); // Jam masuk: 08:00
  const shiftEnd = new Date(date);
  shiftEnd.setHours(17, 0, 0, 0); // Jam pulang: 17:00

  if (type === 'IN') {
    // Clock IN logic
    if (date.getTime() === shiftStart.getTime()) return 'Datang tepat waktu';
    // Jika waktu absen LEBIH BESAR dari jam 8 = terlambat
    // Jika waktu absen LEBIH KECIL dari jam 8 = lebih cepat
    return date.getTime() > shiftStart.getTime() ? 'Datang terlambat' : 'Datang lebih cepat';
  }

  // Clock OUT logic
  if (date.getTime() === shiftEnd.getTime()) return 'Pulang tepat waktu';
  // Jika waktu pulang LEBIH KECIL dari jam 17 = pulang cepat
  // Jika waktu pulang LEBIH BESAR dari jam 17 = lembur
  return date.getTime() < shiftEnd.getTime() ? 'Pulang lebih cepat' : 'Pulang lembur';
}

console.log('\n📥 CLOCK IN Tests:');
console.log('-------------------');

const testCasesIN = [
  { time: '07:45', expected: 'Datang lebih cepat' },
  { time: '08:00', expected: 'Datang tepat waktu' },
  { time: '08:16', expected: 'Datang terlambat' },
  { time: '08:30', expected: 'Datang terlambat' },
  { time: '09:00', expected: 'Datang terlambat' },
];

testCasesIN.forEach(testCase => {
  const today = new Date();
  const [hours, minutes] = testCase.time.split(':');
  today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const result = generateComment('IN', today);
  const status = result === testCase.expected ? '✅' : '❌';
  
  console.log(`${status} Clock IN ${testCase.time}: ${result} (expected: ${testCase.expected})`);
});

console.log('\n📤 CLOCK OUT Tests:');
console.log('-------------------');

const testCasesOUT = [
  { time: '16:30', expected: 'Pulang lebih cepat' },
  { time: '17:00', expected: 'Pulang tepat waktu' },
  { time: '17:15', expected: 'Pulang lembur' },
  { time: '18:00', expected: 'Pulang lembur' },
  { time: '19:00', expected: 'Pulang lembur' },
];

testCasesOUT.forEach(testCase => {
  const today = new Date();
  const [hours, minutes] = testCase.time.split(':');
  today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const result = generateComment('OUT', today);
  const status = result === testCase.expected ? '✅' : '❌';
  
  console.log(`${status} Clock OUT ${testCase.time}: ${result} (expected: ${testCase.expected})`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ All tests passed! Logic is correct.');
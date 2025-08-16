#!/usr/bin/env node

const { convertISTToUTC, isScheduledTimeValid } = require('../lib/timezone-utils.ts');

console.log('🧪 Testing scheduling functionality...\n');

// Test 1: Current time
const now = new Date();
console.log('📅 Current time (UTC):', now.toISOString());
console.log('📅 Current time (IST):', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

// Test 2: Simulate frontend date/time selection
const testDate = new Date(); // Today
const testTime = '17:15'; // 5:15 PM IST

// Format as IST datetime string (like frontend does)
const year = testDate.getFullYear();
const month = String(testDate.getMonth() + 1).padStart(2, '0');
const day = String(testDate.getDate()).padStart(2, '0');
const scheduledIST = `${year}-${month}-${day}T${testTime}`;

console.log('\n📅 Frontend scheduling test:');
console.log('  - Date selected:', testDate.toDateString());
console.log('  - Time selected:', testTime);
console.log('  - IST datetime string:', scheduledIST);

// Test 3: Convert to UTC
const utcTime = convertISTToUTC(scheduledIST);
console.log('  - Converted to UTC:', utcTime.toISOString());

// Test 4: Validate
const isValid = isScheduledTimeValid(scheduledIST);
console.log('  - Is valid scheduling time:', isValid);

// Test 5: Test with 5 minutes from now
const fiveMinutesFromNow = new Date(now.getTime() + (5 * 60 * 1000));
const fiveMinutesTime = `${String(fiveMinutesFromNow.getHours()).padStart(2, '0')}:${String(fiveMinutesFromNow.getMinutes()).padStart(2, '0')}`;
const fiveMinutesIST = `${year}-${month}-${day}T${fiveMinutesTime}`;

console.log('\n📅 5 minutes from now test:');
console.log('  - Time:', fiveMinutesTime);
console.log('  - IST datetime string:', fiveMinutesIST);
console.log('  - Is valid:', isScheduledTimeValid(fiveMinutesIST));

// Test 6: Test with 10 minutes from now
const tenMinutesFromNow = new Date(now.getTime() + (10 * 60 * 1000));
const tenMinutesTime = `${String(tenMinutesFromNow.getHours()).padStart(2, '0')}:${String(tenMinutesFromNow.getMinutes()).padStart(2, '0')}`;
const tenMinutesIST = `${year}-${month}-${day}T${tenMinutesTime}`;

console.log('\n📅 10 minutes from now test:');
console.log('  - Time:', tenMinutesTime);
console.log('  - IST datetime string:', tenMinutesIST);
console.log('  - Is valid:', isScheduledTimeValid(tenMinutesIST));

console.log('\n✅ Scheduling test completed!');

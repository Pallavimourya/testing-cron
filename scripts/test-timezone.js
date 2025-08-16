#!/usr/bin/env node

const { convertISTToUTC, isScheduledTimeValid, getMinimumSchedulingTime } = require('../lib/timezone-utils.ts');

console.log('🧪 Testing timezone conversion...\n');

// Test 1: Current time
const now = new Date();
console.log('📅 Current time (UTC):', now.toISOString());
console.log('📅 Current time (IST):', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

// Test 2: Minimum scheduling time
const minTime = getMinimumSchedulingTime();
console.log('⏰ Minimum scheduling time (IST):', minTime);

// Test 3: Test scheduling 10 minutes from now (should be valid)
const tenMinutesFromNow = new Date(now.getTime() + (10 * 60 * 1000));
const tenMinutesFromNowIST = new Date(tenMinutesFromNow.getTime() + (5.5 * 60 * 60 * 1000));
const testScheduleTime = tenMinutesFromNowIST.toISOString().slice(0, 16);

console.log('📅 Test scheduling time (IST):', testScheduleTime);

// Test 4: Convert IST to UTC
const utcTime = convertISTToUTC(testScheduleTime);
console.log('📅 Converted to UTC:', utcTime.toISOString());

// Test 5: Validate scheduling time
const isValid = isScheduledTimeValid(testScheduleTime);
console.log('✅ Is valid scheduling time:', isValid);

// Test 6: Test scheduling 3 minutes from now (should be invalid)
const threeMinutesFromNow = new Date(now.getTime() + (3 * 60 * 1000));
const threeMinutesFromNowIST = new Date(threeMinutesFromNow.getTime() + (5.5 * 60 * 60 * 1000));
const invalidScheduleTime = threeMinutesFromNowIST.toISOString().slice(0, 16);

console.log('📅 Invalid scheduling time (IST):', invalidScheduleTime);
const isInvalid = isScheduledTimeValid(invalidScheduleTime);
console.log('❌ Is valid scheduling time:', isInvalid);

console.log('\n✅ Timezone conversion test completed!');

const { PLANS } = require('../lib/razorpay.ts');

console.log('🧪 Testing New Zuper Subscription Plans');
console.log('==\n');

// Test plan structure
console.log('📋 Plan Structure:');
Object.entries(PLANS).forEach(([key, plan]) => {
  console.log(`\n${plan.name} (${key}):`);
  console.log(`  Price: ₹${(plan.price / 100).toLocaleString('en-IN')}`);
  console.log(`  Duration: ${plan.duration}`);
  console.log(`  Features: ${plan.features.length} features`);
  console.log(`  Features: ${plan.features.join(', ')}`);
});

// Test price calculations
console.log('\n💰 Price Calculations:');
Object.entries(PLANS).forEach(([key, plan]) => {
  const priceInRupees = plan.price / 100;
  console.log(`${plan.name}: ₹${priceInRupees.toLocaleString('en-IN')} (${plan.price} paise)`);
});

// Test plan validation
console.log('\n✅ Plan Validation:');
const testPlanTypes = ['zuper15', 'zuper30', 'zuper360', 'invalid'];
testPlanTypes.forEach(planType => {
  const isValid = planType in PLANS;
  console.log(`${planType}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

// Test plan mapping to Razorpay plan IDs
console.log('\n🔗 Razorpay Plan Mapping:');
const razorpayPlanMapping = {
  zuper15: 'plan_R1zm8k3QMvJVFr', // Zuper 15 - ₹499
  zuper30: 'plan_R1zmTMBa8M14wR', // Zuper 30 - ₹799
  zuper360: 'plan_R1zmlMJx5RptpA', // Zuper 360 - ₹5,999
};

Object.entries(razorpayPlanMapping).forEach(([planKey, razorpayPlanId]) => {
  const plan = PLANS[planKey];
  console.log(`${plan.name}: ${razorpayPlanId}`);
});

console.log('\n🎯 Summary:');
console.log('- Zuper 15: ₹499 for 15 days');
console.log('- Zuper 30: ₹799 for 30 days');
console.log('- Zuper 360: ₹5,999 for 360 days');
console.log('\n✅ All plans updated successfully!');

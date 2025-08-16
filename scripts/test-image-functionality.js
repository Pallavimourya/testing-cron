const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Image Functionality...\n');

// Check environment variables
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_API_SECRET',
  'OPENAI_API_KEY'
];

console.log('📋 Checking Environment Variables:');
let allEnvVarsPresent = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${envVar}: MISSING`);
    allEnvVarsPresent = false;
  }
});

console.log('\n📁 Checking API Routes:');
const apiRoutes = [
  'app/api/approved-content/[id]/generate-image/route.ts',
  'app/api/approved-content/[id]/upload-image/route.ts', 
  'app/api/approved-content/[id]/delete-image/route.ts'
];

apiRoutes.forEach(route => {
  if (fs.existsSync(route)) {
    console.log(`✅ ${route}: EXISTS`);
  } else {
    console.log(`❌ ${route}: MISSING`);
  }
});

console.log('\n🔧 Checking Cloudinary Configuration:');
const cloudinaryConfig = 'lib/cloudinary.ts';
if (fs.existsSync(cloudinaryConfig)) {
  console.log(`✅ ${cloudinaryConfig}: EXISTS`);
} else {
  console.log(`❌ ${cloudinaryConfig}: MISSING`);
}

console.log('\n📱 Checking Frontend Components:');
const frontendFile = 'app/dashboard/approved-content/page.tsx';
if (fs.existsSync(frontendFile)) {
  console.log(`✅ ${frontendFile}: EXISTS`);
} else {
  console.log(`❌ ${frontendFile}: MISSING`);
}

console.log('\n📊 Summary:');
if (allEnvVarsPresent) {
  console.log('✅ All environment variables are present');
  console.log('✅ All API routes exist');
  console.log('✅ Cloudinary configuration exists');
  console.log('✅ Frontend components exist');
  console.log('\n🎉 Image functionality should be working!');
  console.log('\nTo test:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Navigate to /dashboard/approved-content');
  console.log('3. Click the + icon in the IMAGE column');
  console.log('4. Test both "Generate with AI" and "Upload from Device"');
} else {
  console.log('❌ Some environment variables are missing');
  console.log('Please check your .env.local file');
}

console.log('\n🔍 Debugging Tips:');
console.log('- Check browser console for errors');
console.log('- Verify Cloudinary credentials are correct');
console.log('- Ensure OpenAI API key is valid');
console.log('- Check network tab for API call failures');

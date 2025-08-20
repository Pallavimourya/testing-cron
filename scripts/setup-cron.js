#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up auto-post cron job...');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found. Creating one...');
  fs.writeFileSync(envPath, `# Auto-post Configuration
AUTO_POST_URL=http://localhost:3000/api/cron/auto-post
CRON_SCHEDULE=*/5 * * * *
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database Configuration
MONGODB_URI=your-mongodb-uri-here

# LinkedIn Configuration
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Other Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
`);
  console.log('✅ Created .env file with default configuration');
  console.log('📝 Please update the .env file with your actual configuration values');
}

// Check if cron dependencies are installed
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const hasCronDeps = packageJson.dependencies && 
    (packageJson.dependencies['node-cron'] || packageJson.dependencies['cron']);
  
  if (!hasCronDeps) {
    console.log('⚠️  Cron dependencies not found. Installing...');
    console.log('📦 Run: npm install node-cron');
  } else {
    console.log('✅ Cron dependencies are installed');
  }
}

console.log('\n📋 Setup Instructions:');
console.log('1. Update your .env file with correct configuration');
console.log('2. Install dependencies: npm install');
console.log('3. Start your Next.js app: npm run dev');
console.log('4. In a separate terminal, start the cron job: npm run cron');
console.log('\n🌐 For production deployment:');
console.log('- Vercel: The vercel.json file will handle cron jobs automatically');
console.log('- Other platforms: Use the cron-job.js script or set up a system cron job');
console.log('\n🔧 Manual testing:');
console.log('- Test auto-post: curl http://localhost:3000/api/cron/auto-post');
console.log('- Check status: curl http://localhost:3000/api/cron/status');

console.log('\n✅ Setup complete!');

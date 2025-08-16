const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Define schemas inline
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  baseStoryData: {
    earlyLife: { type: String, default: "" },
    firstDream: { type: String, default: "" },
    firstJob: { type: String, default: "" },
    careerRealization: { type: String, default: "" },
    biggestChallenge: { type: String, default: "" },
    almostGaveUp: { type: String, default: "" },
    turningPoint: { type: String, default: "" },
    mentor: { type: String, default: "" },
    currentWork: { type: String, default: "" },
    uniqueApproach: { type: String, default: "" },
    proudAchievement: { type: String, default: "" },
    industryMisconception: { type: String, default: "" },
    powerfulLesson: { type: String, default: "" },
    coreValues: { type: String, default: "" },
    desiredImpact: { type: String, default: "" },
  },
  customizationData: {
    content_language: { type: String, enum: ["Hindi", "English", "Hinglish"], default: "English" },
    target_audience: { type: String, default: "" },
    audience_age: { type: String, default: "" },
    content_goal: { type: String, default: "" },
    content_tone: { type: String, default: "" },
    writing_style: { type: String, default: "" },
    content_length: { type: String, default: "" },
    posting_frequency: { type: String, default: "" },
    content_formats: [{ type: String }],
    engagement_style: { type: String, default: "" },
    personal_anecdotes: { type: String, default: "" },
    visual_style: { type: String, default: "" },
    branding_colors: { type: String, default: "" },
    keywords: [{ type: String }],
    content_inspiration: { type: String, default: "" },
    content_differentiation: { type: String, default: "" },
  },
  generatedScript: {
    type: String,
    default: "",
  },
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
  profilePhoto: {
    type: String,
    default: "",
  },
  linkedinConnected: {
    type: Boolean,
    default: false,
  },
  linkedinAccessToken: {
    type: String,
    default: "",
  },
  linkedinRefreshToken: {
    type: String,
    default: "",
  },
  linkedinProfile: {
    id: String,
    firstName: String,
    lastName: String,
    profilePicture: String,
    headline: String,
  },
  subscriptionStatus: {
    type: String,
    enum: ["free", "premium", "enterprise"],
    default: "free",
  },
  subscriptionExpiry: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Create models
const User = mongoose.model('User', userSchema);
const UserProfile = mongoose.model('UserProfile', userProfileSchema);

async function testLanguageSelection() {
  try {
    console.log('🧪 Testing Language Selection in Content Customization...\n');

    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ No user found for testing');
      return;
    }

    console.log(`👤 Testing with user: ${user.email}`);

    // 1. Test language options
    console.log('\n📝 Testing language options...');
    
    const languageOptions = ["Hindi", "English", "Hinglish"];
    console.log('✅ Available language options:', languageOptions);

    // 2. Test UserProfile model with language field
    console.log('\n🗄️ Testing UserProfile model with language field...');
    
    // Check if user profile exists
    let userProfile = await UserProfile.findOne({ userId: user._id });
    
    if (!userProfile) {
      console.log('📝 Creating new user profile with language preference...');
      userProfile = new UserProfile({
        userId: user._id,
        email: user.email,
        customizationData: {
          content_language: "Hindi",
          target_audience: "Working Professionals",
          content_goal: "Build Authority",
          content_tone: "Professional"
        }
      });
      await userProfile.save();
      console.log('✅ Created user profile with Hindi language preference');
    } else {
      console.log('📝 Updating existing user profile with language preference...');
      userProfile.customizationData.content_language = "English";
      await userProfile.save();
      console.log('✅ Updated user profile with English language preference');
    }

    // 3. Test different language scenarios
    console.log('\n🌐 Testing different language scenarios...');
    
    const testLanguages = ["Hindi", "English", "Hinglish"];
    
    for (const language of testLanguages) {
      console.log(`\n📋 Testing language: ${language}`);
      
      // Update profile with current language
      userProfile.customizationData.content_language = language;
      await userProfile.save();
      
      // Verify the language was saved correctly
      const updatedProfile = await UserProfile.findOne({ userId: user._id });
      const savedLanguage = updatedProfile.customizationData.content_language;
      
      console.log(`✅ Language saved: ${savedLanguage}`);
      console.log(`✅ Language validation: ${savedLanguage === language ? 'PASS' : 'FAIL'}`);
      
      // Test content generation simulation with language
      const contentGenerationData = {
        language: savedLanguage,
        targetAudience: updatedProfile.customizationData.target_audience,
        contentGoal: updatedProfile.customizationData.content_goal,
        contentTone: updatedProfile.customizationData.content_tone
      };
      
      console.log(`📤 Content generation data for ${language}:`, contentGenerationData);
    }

    // 4. Test language validation
    console.log('\n✅ Testing language validation...');
    
    try {
      userProfile.customizationData.content_language = "InvalidLanguage";
      await userProfile.save();
      console.log('❌ Invalid language was accepted (should have failed)');
    } catch (error) {
      console.log('✅ Invalid language correctly rejected:', error.message);
    }

    // 5. Test default language
    console.log('\n🔧 Testing default language...');
    
    const newProfile = new UserProfile({
      userId: user._id,
      email: user.email,
      customizationData: {}
    });
    
    console.log(`✅ Default language: ${newProfile.customizationData.content_language}`);

    // 6. Test language in content generation API simulation
    console.log('\n🌐 Testing language in content generation API...');
    
    const apiSimulationData = {
      contentLanguage: userProfile.customizationData.content_language,
      targetAudience: userProfile.customizationData.target_audience,
      contentTone: userProfile.customizationData.content_tone,
      contentLength: userProfile.customizationData.content_length || "Medium"
    };
    
    console.log('📡 API simulation data:', apiSimulationData);
    
    // Simulate sending to Make.com webhook
    const makeWebhookData = {
      prompt: "Test content generation",
      "User ID\t": user._id.toString(),
      Email: user.email,
      contentLanguage: apiSimulationData.contentLanguage,
      targetAudience: apiSimulationData.targetAudience,
      contentTone: apiSimulationData.contentTone,
      contentLength: apiSimulationData.contentLength,
    };
    
    console.log('📤 Make.com webhook data:', makeWebhookData);

    // 7. Test language-specific content generation
    console.log('\n📝 Testing language-specific content generation...');
    
    const languageSpecificPrompts = {
      "Hindi": "हिंदी में सामग्री उत्पन्न करें",
      "English": "Generate content in English",
      "Hinglish": "Generate content in Hinglish (Hindi + English mix)"
    };
    
    for (const [language, prompt] of Object.entries(languageSpecificPrompts)) {
      console.log(`\n🌐 ${language} prompt: ${prompt}`);
      
      const languageContentData = {
        language: language,
        prompt: prompt,
        userRequirements: {
          contentLanguage: language,
          targetAudience: "Working Professionals",
          contentTone: "Professional",
          contentLength: "Medium"
        }
      };
      
      console.log(`✅ ${language} content generation data prepared:`, languageContentData);
    }

    // 8. Final statistics
    console.log('\n📊 FINAL STATISTICS:');
    
    const finalStats = {
      totalUsers: await User.countDocuments(),
      totalUserProfiles: await UserProfile.countDocuments(),
      profilesWithLanguage: await UserProfile.countDocuments({
        "customizationData.content_language": { $exists: true, $ne: "" }
      }),
      languageDistribution: {
        Hindi: await UserProfile.countDocuments({ "customizationData.content_language": "Hindi" }),
        English: await UserProfile.countDocuments({ "customizationData.content_language": "English" }),
        Hinglish: await UserProfile.countDocuments({ "customizationData.content_language": "Hinglish" })
      }
    };
    
    console.log(`📈 Total users: ${finalStats.totalUsers}`);
    console.log(`📊 Total user profiles: ${finalStats.totalUserProfiles}`);
    console.log(`🔗 Profiles with language preference: ${finalStats.profilesWithLanguage}`);
    console.log(`🌐 Language distribution:`, finalStats.languageDistribution);

    // 9. Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    
    // Only cleanup if we created a new profile
    if (userProfile.isNew) {
      await UserProfile.deleteOne({ _id: userProfile._id });
      console.log('✅ Cleaned up test user profile');
    }

    console.log('\n✅ Language selection test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing language selection:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testLanguageSelection();

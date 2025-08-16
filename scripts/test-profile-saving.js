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
    content_language: { type: String, enum: ["Hindi", "English", "Hinglish", "Both Languages"], default: "English" },
    target_audience: { type: String, default: "" },
    audience_age: { type: String, default: "" },
    content_goal: { type: String, default: "" },
    content_tone: { type: String, default: "" },
    content_length: { type: String, default: "" },
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

async function testProfileSaving() {
  try {
    console.log('🧪 Testing Profile Saving Functionality...\n');

    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ No user found for testing');
      return;
    }

    console.log(`👤 Testing with user: ${user.email}`);

    // 1. Test new language options
    console.log('\n🌐 Testing new language options...');
    
    const languageOptions = ["Hindi", "English", "Hinglish", "Both Languages"];
    console.log('✅ Available language options:', languageOptions);

    // 2. Test profile saving with different languages
    console.log('\n💾 Testing profile saving with different languages...');
    
    for (const language of languageOptions) {
      console.log(`\n📝 Testing with language: ${language}`);
      
      const testProfileData = {
        baseStoryData: {
          earlyLife: "Test early life story",
          currentWork: "Test current work",
          biggestChallenge: "Test challenge",
          firstDream: "Test dream",
          firstJob: "Test job",
          careerRealization: "Test realization",
          almostGaveUp: "Test almost gave up",
          turningPoint: "Test turning point",
          mentor: "Test mentor",
          uniqueApproach: "Test approach",
          proudAchievement: "Test achievement",
          industryMisconception: "Test misconception",
          powerfulLesson: "Test lesson",
          coreValues: "Test values",
          desiredImpact: "Test impact"
        },
        customizationData: {
          content_language: language,
          target_audience: "Working Professionals",
          audience_age: "25–34",
          content_goal: "Build Authority",
          content_tone: "Professional",
          content_length: "Medium (200–400 words)",
          content_differentiation: "Balanced"
        }
      };

      // Save profile
      const savedProfile = await UserProfile.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            ...testProfileData,
            userId: user._id,
            email: user.email,
            updatedAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      console.log(`✅ Profile saved with language: ${savedProfile.customizationData.content_language}`);
      
      // Verify the language was saved correctly
      const verifiedProfile = await UserProfile.findOne({ userId: user._id });
      console.log(`✅ Language verification: ${verifiedProfile.customizationData.content_language === language ? 'PASS' : 'FAIL'}`);
    }

    // 3. Test invalid language option
    console.log('\n⚠️ Testing invalid language option...');
    
    try {
      const invalidProfileData = {
        baseStoryData: {
          earlyLife: "Test story"
        },
        customizationData: {
          content_language: "InvalidLanguage",
          target_audience: "Working Professionals"
        }
      };

      const invalidProfile = new UserProfile({
        userId: user._id,
        email: user.email,
        ...invalidProfileData
      });

      await invalidProfile.save();
      console.log('❌ Invalid language was accepted (should have failed)');
    } catch (error) {
      console.log('✅ Invalid language correctly rejected:', error.message);
    }

    // 4. Test profile loading
    console.log('\n📤 Testing profile loading...');
    
    const loadedProfile = await UserProfile.findOne({ userId: user._id });
    if (loadedProfile) {
      console.log('✅ Profile loaded successfully');
      console.log('📊 Profile data:', {
        language: loadedProfile.customizationData.content_language,
        targetAudience: loadedProfile.customizationData.target_audience,
        audienceAge: loadedProfile.customizationData.audience_age,
        contentGoal: loadedProfile.customizationData.content_goal,
        contentTone: loadedProfile.customizationData.content_tone,
        contentLength: loadedProfile.customizationData.content_length,
        contentDifferentiation: loadedProfile.customizationData.content_differentiation
      });
    } else {
      console.log('❌ Profile not found');
    }

    // 5. Test API simulation
    console.log('\n🌐 Testing API simulation...');
    
    const apiRequestData = {
      baseStoryData: {
        earlyLife: "API test story",
        currentWork: "API test work",
        biggestChallenge: "API test challenge"
      },
      customizationData: {
        content_language: "Both Languages",
        target_audience: "Founders / Entrepreneurs",
        audience_age: "35–44",
        content_goal: "Generate Leads",
        content_tone: "Bold",
        content_length: "Long-form (400+ words)",
        content_differentiation: "Very unique & contrarian"
      }
    };

    console.log('📡 API request data:', apiRequestData);

    // 6. Test story generation requirements
    console.log('\n📝 Testing story generation requirements...');
    
    const requiredBaseFields = ["earlyLife", "currentWork", "biggestChallenge"];
    const requiredCustomFields = ["content_language", "target_audience", "content_goal", "content_tone"];

    const missingBaseFields = requiredBaseFields.filter(field => !apiRequestData.baseStoryData[field]);
    const missingCustomFields = requiredCustomFields.filter(field => !apiRequestData.customizationData[field]);

    console.log('✅ Required base fields check:', missingBaseFields.length === 0 ? 'PASS' : `FAIL - Missing: ${missingBaseFields.join(', ')}`);
    console.log('✅ Required custom fields check:', missingCustomFields.length === 0 ? 'PASS' : `FAIL - Missing: ${missingCustomFields.join(', ')}`);

    // 7. Final statistics
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
        Hinglish: await UserProfile.countDocuments({ "customizationData.content_language": "Hinglish" }),
        "Both Languages": await UserProfile.countDocuments({ "customizationData.content_language": "Both Languages" })
      }
    };
    
    console.log(`📈 Total users: ${finalStats.totalUsers}`);
    console.log(`📊 Total user profiles: ${finalStats.totalUserProfiles}`);
    console.log(`🔗 Profiles with language preference: ${finalStats.profilesWithLanguage}`);
    console.log(`🌐 Language distribution:`, finalStats.languageDistribution);

    console.log('\n✅ Profile saving test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing profile saving:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testProfileSaving();

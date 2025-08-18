# Make.com Integration Plan for Topic Generation

## 🎯 **Current Issues to Solve:**

1. **❌ Duplicate topics showing** - approved topics 2-2 bar show ho rahe hain
2. **❌ Same topics generating** - har bar same topics aa rahe hain  
3. **❌ Story integration missing** - har story se new topics generate nahi ho rahe

## 🤖 **Make.com Scenario Requirements:**

### **Scenario 1: Auto Topic Generation**
**Trigger:** User clicks "Generate Auto Topics" button

**Input Data:**
\`\`\`json
{
  "userId": "user_id_here",
  "email": "user@example.com", 
  "storyId": "story_id_here",
  "baseStoryData": {
    "name": "Alex Rivera",
    "industry": "Marketing", 
    "experience": "5 years",
    "achievement": "Increased sales by 200%",
    "challenge": "Overcame market downturn",
    "learning": "Customer-centric approach",
    "goal": "Build authority in marketing"
  },
  "customizationData": {
    "tone": "professional",
    "audience": "professionals", 
    "focus": "career journey"
  },
  "type": "auto_generation"
}
\`\`\`

**Expected Output:**
\`\`\`json
{
  "topics": [
    "Alex Rivera's Journey from Childhood Dreams to Marketing Success",
    "The Campaign That Changed Everything for Alex Rivera",
    "How Alex Rivera Learned to Read Customer Minds",
    "The Marketing Trend Alex Rivera is Betting On",
    "Why Data-Driven Decisions Aren't Always Right",
    "The Moment Alex Rivera Realized His True Potential",
    "How Alex Rivera Built His Professional Network from Scratch",
    "The Innovation That Will Transform Marketing Industry",
    "What Alex Rivera Learned from His Biggest Failure",
    "Why Alex Rivera is Passionate About Marketing"
  ],
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00Z",
    "storyId": "story_id_here",
    "totalTopics": 10,
    "source": "auto_generation"
  }
}
\`\`\`

### **Scenario 2: Manual Topic Generation**
**Trigger:** User enters manual prompt

**Input Data:**
\`\`\`json
{
  "userId": "user_id_here",
  "email": "user@example.com",
  "storyId": "story_id_here", 
  "baseStoryData": { /* same as above */ },
  "customizationData": { /* same as above */ },
  "userPrompt": "Generate topics about leadership in marketing",
  "category": "Leadership",
  "difficulty": "Intermediate", 
  "contentType": "LinkedIn Post",
  "type": "manual_generation"
}
\`\`\`

**Expected Output:**
\`\`\`json
{
  "topics": [
    "How Alex Rivera Leads Marketing Teams to Success",
    "The Leadership Lesson That Changed Alex Rivera's Career",
    "Why Alex Rivera Believes in Servant Leadership",
    "How Alex Rivera Develops Future Marketing Leaders",
    "The Leadership Challenge That Made Alex Rivera Stronger",
    "What Alex Rivera Learned from Great Leaders",
    "How Alex Rivera Builds Trust in Marketing Teams",
    "The Leadership Skill That Opened New Doors for Alex Rivera",
    "Why Alex Rivera Thinks Leadership is About Empathy",
    "How Alex Rivera Creates a Culture of Innovation"
  ],
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00Z",
    "storyId": "story_id_here",
    "userPrompt": "Generate topics about leadership in marketing",
    "category": "Leadership",
    "difficulty": "Intermediate",
    "contentType": "LinkedIn Post",
    "totalTopics": 10,
    "source": "manual_generation"
  }
}
\`\`\`

## 🔧 **Make.com Scenario Setup:**

### **Step 1: Webhook Trigger**
- **Module:** Webhook
- **Method:** POST
- **URL:** Your webhook URL
- **Authentication:** Bearer token

### **Step 2: Data Processing**
- **Module:** JSON Parser
- **Action:** Parse incoming JSON data
- **Extract:** userId, storyId, baseStoryData, customizationData, userPrompt (if manual)

### **Step 3: AI Integration**
- **Module:** OpenAI
- **Model:** GPT-3.5-turbo
- **Temperature:** 0.8 (for creativity)
- **Max Tokens:** 500
- **Prompt:** Dynamic prompt based on input data

### **Step 4: Response Formatting**
- **Module:** JSON Builder
- **Action:** Format response with topics and metadata
- **Return:** Structured JSON response

### **Step 5: Error Handling**
- **Module:** Router
- **Conditions:** Success/Error paths
- **Fallback:** Default topic generation if AI fails

## 📋 **Make.com Scenario Template:**

\`\`\`javascript
// Webhook Input
const input = {
  userId: data.userId,
  email: data.email,
  storyId: data.storyId,
  baseStoryData: data.baseStoryData,
  customizationData: data.customizationData,
  userPrompt: data.userPrompt || null,
  category: data.category || null,
  difficulty: data.difficulty || null,
  contentType: data.contentType || null,
  type: data.type
}

// Dynamic Prompt Generation
let prompt = `Based on this professional profile, generate 10 unique and engaging LinkedIn content topics. Each topic should be different and creative.

**Professional Profile:**
- Name: ${input.baseStoryData.name || "Professional"}
- Industry: ${input.baseStoryData.industry || "business"}
- Experience: ${input.baseStoryData.experience || "several years"}
- Achievement: ${input.baseStoryData.achievement || "significant accomplishments"}
- Challenge: ${input.baseStoryData.challenge || "overcoming obstacles"}
- Learning: ${input.baseStoryData.learning || "key lessons learned"}
- Goal: ${input.baseStoryData.goal || "professional growth"}

**Content Preferences:**
- Tone: ${input.customizationData.tone || "professional"}
- Target Audience: ${input.customizationData.audience || "professionals"}
- Focus Area: ${input.customizationData.focus || "career journey"}`

if (input.userPrompt) {
  prompt += `\n\n**User Request:** ${input.userPrompt}
**Category:** ${input.category}
**Difficulty:** ${input.difficulty}
**Content Type:** ${input.contentType}`
}

prompt += `

**Requirements:**
1. Generate 10 unique topics
2. Each topic should be engaging and shareable
3. Topics should be relevant to the person's background
4. Mix of personal stories, professional insights, and industry perspectives
5. Topics should encourage engagement and discussion
6. Make each topic specific and actionable
7. Ensure variety and avoid repetition
8. Personalize with the person's name where appropriate

Return only the topic titles, one per line, without numbering.`

// OpenAI Call
const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: prompt }],
  max_tokens: 500,
  temperature: 0.8
})

// Parse and Format Response
const topics = response.choices[0].message.content
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .slice(0, 10)

// Return Formatted Response
return {
  topics: topics,
  metadata: {
    generatedAt: new Date().toISOString(),
    storyId: input.storyId,
    userPrompt: input.userPrompt,
    category: input.category,
    difficulty: input.difficulty,
    contentType: input.contentType,
    totalTopics: topics.length,
    source: input.type
  }
}
\`\`\`

## 🚀 **Benefits of Make.com Integration:**

1. **✅ No Duplicates:** Each generation is unique
2. **✅ Story-Specific:** Different topics for different stories
3. **✅ AI-Powered:** ChatGPT generates creative topics
4. **✅ Scalable:** Can handle multiple users simultaneously
5. **✅ Reliable:** Fallback mechanisms for errors
6. **✅ Customizable:** Easy to modify prompts and logic

## 📞 **Next Steps:**

1. **Create Make.com scenario** using the template above
2. **Test with sample data** to ensure proper functionality
3. **Update API endpoints** to use Make.com webhooks
4. **Implement fallback** to local generation if Make.com fails
5. **Monitor and optimize** based on user feedback

**Would you like me to help you set up this Make.com scenario?** 🤖

# Topic Content Generation - Make.com Scenario Setup

## Overview
This scenario generates content for approved topics by combining:
- **Approved Topic** from Topic Bank
- **Base Story** (user's personal story)
- **Customization** (user preferences and settings)

## Scenario Flow

### 1. Webhook Trigger
- **Module**: Custom Webhook
- **URL**: Your webhook URL
- **Method**: POST
- **Data Structure**:
\`\`\`json
{
  "topicId": "topic-123456",
  "topicTitle": "AI in Business",
  "userId": "user_id",
  "userEmail": "user@example.com",
  "baseStory": {
    "earlyLife": "...",
    "firstDream": "...",
    "careerRealization": "...",
    "biggestChallenge": "...",
    "turningPoint": "...",
    "currentWork": "...",
    "finalStory": "..."
  },
  "customization": {
    "target_audience": "professionals",
    "content_tone": "professional",
    "writing_style": "conversational",
    "content_length": "medium",
    "keywords": ["AI", "business", "innovation"]
  },
  "userProfile": {
    "industry": "Technology",
    "jobTitle": "Product Manager",
    "company": "Tech Corp"
  }
}
\`\`\`

### 2. Data Parser
- **Module**: JSON Parser
- **Map**: All incoming data fields
- **Purpose**: Extract and organize data for content generation

### 3. OpenAI Content Generation
- **Module**: OpenAI
- **Action**: Create Chat Completion
- **Model**: GPT-4
- **Prompt Template**:
\`\`\`
You are a professional content creator for LinkedIn. Generate engaging content based on the following:

TOPIC: {{1.topicTitle}}

USER'S STORY BACKGROUND:
- Early Life: {{1.baseStory.earlyLife}}
- Career Journey: {{1.baseStory.careerRealization}}
- Biggest Challenge: {{1.baseStory.biggestChallenge}}
- Turning Point: {{1.baseStory.turningPoint}}
- Current Work: {{1.baseStory.currentWork}}
- Final Story: {{1.baseStory.finalStory}}

CUSTOMIZATION PREFERENCES:
- Target Audience: {{1.customization.target_audience}}
- Content Tone: {{1.customization.content_tone}}
- Writing Style: {{1.customization.writing_style}}
- Content Length: {{1.customization.content_length}}
- Keywords: {{1.customization.keywords}}

USER PROFILE:
- Industry: {{1.userProfile.industry}}
- Job Title: {{1.userProfile.jobTitle}}
- Company: {{1.userProfile.company}}

INSTRUCTIONS:
1. Create a LinkedIn post that combines the topic with the user's personal story
2. Use the user's story elements to make the content authentic and relatable
3. Follow the specified tone and writing style
4. Include relevant hashtags based on the keywords
5. Keep the content within the specified length
6. Make it engaging and professional
7. Include a call-to-action that aligns with the user's goals

Format the response as:
CONTENT: [main content]
HASHTAGS: [hashtag1, hashtag2, hashtag3]
KEY_POINTS: [point1, point2, point3]
\`\`\`

### 4. Content Processing
- **Module**: Text Parser
- **Extract**:
  - Main content from "CONTENT:" section
  - Hashtags from "HASHTAGS:" section
  - Key points from "KEY_POINTS:" section

### 5. Image Generation (Optional)
- **Module**: DALL-E or similar
- **Prompt**: Generate a professional image related to the topic
- **Style**: Professional, business-focused

### 6. Send Back to Application
- **Module**: HTTP
- **Method**: POST
- **URL**: `https://your-domain.com/api/topics/content-webhook`
- **Headers**:
  - Content-Type: application/json
  - x-make-api-key: your-api-key
- **Body**:
\`\`\`json
{
  "topicId": "{{1.topicId}}",
  "content": "{{5.content}}",
  "hashtags": ["{{5.hashtag1}}", "{{5.hashtag2}}"],
  "keyPoints": ["{{5.point1}}", "{{5.point2}}"],
  "imageUrl": "{{6.imageUrl}}",
  "status": "generated"
}
\`\`\`

## Environment Variables
Add to your `.env.local`:
\`\`\`
MAKE_TOPIC_CONTENT_WEBHOOK_URL=https://hook.eu2.make.com/your-webhook-url
MAKE_API_KEY=your-secure-api-key
\`\`\`

## Error Handling
- Add error handling modules
- Set up retry logic for API failures
- Log errors for debugging

## Testing
1. Create a test topic in your application
2. Trigger content generation
3. Check the Make.com execution logs
4. Verify content is saved in your database

## Monitoring
- Monitor execution success rates
- Track content quality metrics
- Set up alerts for failures

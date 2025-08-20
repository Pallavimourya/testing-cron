/**
 * Make.com Scenario Setup Guide
 *
 * This file provides instructions for setting up the Make.com scenario
 * for automatic content generation and posting.
 */

/**
 * Step 1: Create a new scenario in Make.com
 * - Go to Make.com and create a new scenario
 * - Name it "LinkZup - LinkedIn Content Generator"
 */

/**
 * Step 2: Add a Webhook trigger
 * - Add a "Custom webhook" trigger as the first module
 * - Save the webhook URL provided by Make.com
 * - Add this URL to your .env.local file as MAKE_WEBHOOK_URL
 */

/**
 * Step 3: Parse the webhook data
 * - Add a "JSON Parse" module after the webhook
 * - Map the Data field to the webhook's data
 * - This will parse the user profile and requirements
 */

/**
 * Step 4: Add OpenAI module for content generation
 * - Add an "OpenAI" module
 * - Select "Create chat completion" action
 * - Use GPT-4 or GPT-3.5-Turbo model
 * - Create a prompt template like this:
 */
const promptTemplate = `
Generate a LinkedIn post for a user with the following profile:

Industry: {{1.profileData.mcqResponses.industry}}
Content tone: {{1.profileData.mcqResponses.tone}}
Target audience: {{1.profileData.targetAudience}}
Content goals: {{1.profileData.mcqResponses.primaryGoal}}

User's audio description: {{1.profileData.audioResponses[0].transcription}}

Create a professional LinkedIn post that is engaging and aligned with their industry.
Include relevant hashtags.
Format the post properly for LinkedIn with line breaks.
Keep the post between 150-300 words.
`

/**
 * Step 5: Format the generated content
 * - Add a "Text parser" module
 * - Extract the title and main content from the OpenAI response
 * - Format hashtags as an array
 */

/**
 * Step 6: Send content back to your application
 * - Add an "HTTP" module with POST method
 * - URL: https://your-domain.com/api/make-webhook
 * - Headers:
 *   - Content-Type: application/json
 *   - x-make-api-key: your-make-api-key (from .env)
 * - Body (JSON):
 */
const webhookPayload = {
  userId: "{{1.userId}}",
  platform: "linkedin",
  contentType: "text",
  title: "{{5.title}}",
  content: "{{5.content}}",
  hashtags: ["{{5.hashtags}}"],
  makeComId: "{{1.$execution.id}}",
}

/**
 * Step 7: Schedule the scenario
 * - Set the scenario to run on a schedule based on user preferences
 * - For example, if user selected "daily", schedule it to run daily
 */

/**
 * Step 8: Test the scenario
 * - Run the scenario manually first to test
 * - Check your application dashboard for the generated content
 */

/**
 * Step 9: Set up error handling
 * - Add error handling modules to notify you of failures
 * - Consider adding retry logic for API failures
 */

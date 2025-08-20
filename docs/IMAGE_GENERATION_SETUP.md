# Image Generation Setup Guide

## Quick Setup

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Existing variables (you should already have these)
OPENAI_API_KEY=your_openai_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# New variable for SDXL (optional but recommended)
REPLICATE_API_TOKEN=your_replicate_token_here
```

### 2. Get Replicate API Token (Optional)

1. Go to [replicate.com](https://replicate.com)
2. Sign up for a free account
3. Go to your account settings
4. Copy your API token
5. Add it to your `.env.local` file

### 3. Test the Implementation

#### Option A: Use the Web Interface
1. Start your development server: `npm run dev`
2. Go to: `http://localhost:3000/test-image-generation`
3. Try different generation methods

#### Option B: Use the Test Script
1. Run the test script: `node scripts/test-image-generation.js`
2. Check the generated reports in `scripts/` folder

## API Usage Examples

### Basic DALL-E Generation
```javascript
const response = await fetch('/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "leadership strategies",
    content: "Your content here...",
    style: "professional",
    theme: "business",
    generationMethod: "dalle"
  })
})
```

### SDXL Generation (Better Infographics)
```javascript
const response = await fetch('/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "digital transformation",
    content: "Your content here...",
    style: "professional",
    theme: "technology",
    generationMethod: "sdxl"
  })
})
```

### Hybrid Generation (Best Results)
```javascript
const response = await fetch('/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "team collaboration",
    content: "Your content here...",
    style: "minimal",
    theme: "leadership",
    generationMethod: "hybrid"
  })
})
```

## Troubleshooting

### DALL-E Issues
- **Error:** "Failed to generate image with DALL-E"
- **Solution:** Check your `OPENAI_API_KEY` and ensure you have credits

### SDXL Issues
- **Error:** "Replicate API token not configured"
- **Solution:** Add `REPLICATE_API_TOKEN` to your environment variables

### Cloudinary Issues
- **Error:** "Failed to save generated image"
- **Solution:** Check your Cloudinary credentials

### Rate Limiting
- **Error:** Generation times out or fails
- **Solution:** Wait a few seconds between requests

## Cost Considerations

- **DALL-E 3:** ~$0.04 per image
- **SDXL via Replicate:** ~$0.02-0.05 per image
- **Hybrid:** SDXL cost + Cloudinary processing

## Next Steps

1. Test all three methods to see which works best for your use case
2. Consider implementing the HTML-to-Image template system for even better results
3. Add image caching to reduce API costs
4. Create brand-specific template libraries

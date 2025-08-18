# External Cron Setup Guide

## Overview
Since Vercel Hobby accounts are limited to daily cron jobs, we're using external cron services to run our auto-posting functionality every minute.

## Environment Variables Required

Add these environment variables to your Vercel project:

```bash
# External Cron Security
EXTERNAL_CRON_SECRET=your-super-secure-random-secret-here
CRON_JOB_TOKEN=another-secure-token-for-cron-job-org

# LinkedIn API (if not already set)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Database (if not already set)
MONGODB_URI=your-mongodb-connection-string
```

## External Cron Service Setup

### Option 1: cron-job.org (Recommended - Free)

1. Go to [cron-job.org](https://cron-job.org)
2. Create a free account
3. Add a new cron job with these settings:
   - **URL**: `https://your-domain.vercel.app/api/cron/external-auto-post`
   - **Schedule**: Every minute (`* * * * *`)
   - **Request Method**: GET
   - **Headers**:
     - `Authorization`: `Bearer your-super-secure-random-secret-here`
     - `X-Cron-Job-Token`: `another-secure-token-for-cron-job-org`
   - **Timeout**: 300 seconds
   - **Retry on failure**: Yes (3 retries)

### Option 2: EasyCron (Free tier available)

1. Go to [EasyCron](https://www.easycron.com)
2. Create a free account
3. Add a new cron job:
   - **URL**: `https://your-domain.vercel.app/api/cron/external-auto-post`
   - **Schedule**: Every minute
   - **Method**: GET
   - **Headers**: Same as above

### Option 3: GitHub Actions (Free for public repos)

Create `.github/workflows/cron.yml`:

```yaml
name: Auto Post Cron

on:
  schedule:
    - cron: '* * * * *'  # Every minute
  workflow_dispatch:  # Manual trigger

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Auto Post
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.EXTERNAL_CRON_SECRET }}" \
            -H "X-Cron-Job-Token: ${{ secrets.CRON_JOB_TOKEN }}" \
            https://your-domain.vercel.app/api/cron/external-auto-post
```

## Security Features

The external cron route includes multiple security measures:

1. **Authorization Header**: Requires `Bearer` token
2. **User-Agent Check**: Validates requests from known cron services
3. **Custom Token**: Additional `X-Cron-Job-Token` header
4. **Rate Limiting**: Built-in 1-minute cooldown between runs

## Testing

You can test the cron endpoint manually:

```bash
curl -X GET \
  -H "Authorization: Bearer your-super-secure-random-secret-here" \
  -H "X-Cron-Job-Token: another-secure-token-for-cron-job-org" \
  https://your-domain.vercel.app/api/cron/external-auto-post
```

## Monitoring

The endpoint returns detailed information about:
- Number of posts processed
- Success/error counts
- Timestamps
- Next run time

## Troubleshooting

1. **401 Unauthorized**: Check your environment variables
2. **Timeout errors**: Increase timeout in cron service settings
3. **Database errors**: Verify MongoDB connection
4. **LinkedIn errors**: Check user access tokens

## Migration from Vercel Cron

1. ✅ Remove cron configuration from `vercel.json`
2. ✅ Set up external cron service
3. ✅ Add environment variables
4. ✅ Test the endpoint
5. ✅ Monitor for 24-48 hours

## Cost Comparison

- **Vercel Pro**: $20/month for unlimited cron jobs
- **External Services**: Free tiers available
- **GitHub Actions**: Free for public repos

## Recommended Setup

For production, we recommend:
1. **Primary**: cron-job.org (reliable, free)
2. **Backup**: GitHub Actions (if using GitHub)
3. **Monitoring**: Set up alerts for failures

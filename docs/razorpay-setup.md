# Razorpay Payment Integration Setup

This document outlines the complete setup and configuration for the Razorpay payment integration in the LinkZup application.

## Environment Variables Required

Add the following environment variables to your `.env.local` file:

\`\`\`bash
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Public key for client-side (must be prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
\`\`\`

## Razorpay Dashboard Setup

1. **Create Razorpay Account**: Sign up at [razorpay.com](https://razorpay.com)
2. **Get API Keys**: 
   - Go to Settings → API Keys
   - Generate a new key pair
   - Copy the Key ID and Key Secret

3. **Configure Webhooks**:
   - Go to Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/payments/webhook`
   - Select events: `payment.captured`, `payment.failed`
   - Copy the webhook secret

## Plan Configuration

The application supports three subscription plans:

### Starter Plan
- Price: ₹999/month
- Features: Basic content generation and analytics

### Professional Plan  
- Price: ₹1,999/month
- Features: Advanced features and priority support

### Enterprise Plan
- Price: ₹2,999/month
- Features: Unlimited access and premium support

## API Routes

The following API routes handle payment processing:

- `POST /api/payments/create-order` - Creates a new payment order
- `POST /api/payments/verify` - Verifies payment signature and updates subscription
- `GET /api/payments/history` - Retrieves payment history
- `POST /api/payments/webhook` - Handles Razorpay webhooks

## Payment Flow

1. **Order Creation**: User selects a plan → System creates Razorpay order
2. **Payment Processing**: User completes payment via Razorpay checkout
3. **Payment Verification**: System verifies payment signature
4. **Subscription Activation**: User subscription is activated for 30 days
5. **Webhook Processing**: Razorpay sends webhook for additional verification

## Security Features

- **Signature Verification**: All payments are verified using HMAC SHA256
- **Webhook Verification**: Webhooks are verified using webhook secret
- **Server-side Processing**: Sensitive operations only on server-side
- **Environment Variables**: API keys stored securely in environment variables

## Testing

### Test Mode
- Use Razorpay test mode for development
- Test cards available in Razorpay documentation
- Test webhook events can be triggered from dashboard

### Production Mode
- Switch to live mode in Razorpay dashboard
- Update environment variables with live keys
- Ensure webhook URL is publicly accessible

## Error Handling

The integration includes comprehensive error handling:

- Invalid payment signatures
- Missing payment details
- Database connection issues
- Webhook verification failures
- User authentication errors

## Monitoring

Monitor payment processing through:

- Razorpay Dashboard
- Application logs
- Database payment records
- Webhook delivery status

## Troubleshooting

### Common Issues

1. **Payment Verification Fails**
   - Check environment variables
   - Verify signature calculation
   - Ensure correct order ID

2. **Webhook Not Received**
   - Verify webhook URL is accessible
   - Check webhook secret configuration
   - Monitor webhook delivery in Razorpay dashboard

3. **Subscription Not Updated**
   - Check database connection
   - Verify User model fields
   - Review payment record status

### Debug Steps

1. Check application logs for errors
2. Verify environment variables are set
3. Test API endpoints individually
4. Monitor Razorpay dashboard for payment status
5. Check database for payment records

## Support

For issues with:
- **Razorpay Integration**: Check Razorpay documentation
- **Application Code**: Review this documentation
- **Environment Setup**: Verify all environment variables
- **Payment Processing**: Check Razorpay dashboard and logs

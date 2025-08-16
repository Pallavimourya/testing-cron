# Zuper Subscription Plans Update Summary

## Overview
Updated the application to use the new Zuper subscription plans as provided by Razorpay:

1. **Zuper 15** - ₹499.00 (15 days)
2. **Zuper 30** - ₹799.00 (30 days) 
3. **Zuper 360** - ₹5,999.00 (360 days)

## Changes Made

### 1. Updated Plan Configuration (`lib/razorpay.ts`)
- Changed `PlanType` from `"starter" | "professional" | "enterprise"` to `"zuper15" | "zuper30" | "zuper360"`
- Updated `PLANS` object with new plan details:
  - **Zuper 15**: ₹499 (49,900 paise) for 15 days
  - **Zuper 30**: ₹799 (79,900 paise) for 30 days
  - **Zuper 360**: ₹5,999 (599,900 paise) for 360 days
- Updated features for each plan tier

### 2. Updated Pricing Page (`app/pricing/PricingClientPage.tsx`)
- Updated plan names, prices, and durations
- Updated plan type definitions in state management
- Updated feature lists to match new plan structure

### 3. Updated Plans Popup (`components/PlansPopup.tsx`)
- Updated plans array with new Zuper plan names
- Updated plan IDs and descriptions
- Maintained popular plan designation for Zuper 30

### 4. Updated Billing Page (`app/dashboard/billing/page.tsx`)
- Updated plans object with new Zuper plan details
- Updated type definitions for plan selection
- Updated payment handling functions
- Updated upgrade button handlers

### 5. Updated Linkezup Page (`app/linkezup/page.tsx`)
- Updated pricing plans array with new Zuper plans
- Updated prices, durations, and features
- Maintained plan popularity settings

## Razorpay Plan Mapping
The application now maps to the following Razorpay plan IDs:
- `zuper15` → `plan_R1zm8k3QMvJVFr` (Zuper 15 - ₹499)
- `zuper30` → `plan_R1zmTMBa8M14wR` (Zuper 30 - ₹799)
- `zuper360` → `plan_R1zmlMJx5RptpA` (Zuper 360 - ₹5,999)

## Plan Features

### Zuper 15 (₹499/15 days)
- Profile Optimization
- Basic Content Strategy
- Weekly Post Creation (2 posts)
- Engagement Monitoring
- Basic Analytics Report
- Email Support

### Zuper 30 (₹799/30 days)
- Everything in Zuper 15
- Advanced Profile Optimization
- Weekly Post Creation (4 posts)
- Network Growth Strategy
- Engagement Management
- Detailed Analytics Report
- Priority Email Support
- Monthly Strategy Call

### Zuper 360 (₹5,999/360 days)
- Everything in Zuper 30
- Premium Profile Optimization
- Weekly Post Creation (6 posts)
- Advanced Network Growth
- Thought Leadership Strategy
- Competitor Analysis
- Custom Analytics Dashboard
- 24/7 Priority Support
- Weekly Strategy Calls
- Content Calendar Management
- Annual Strategy Planning
- Priority Onboarding

## Testing
Created test script (`scripts/test-new-plans.js`) to verify:
- Plan structure and pricing
- Plan validation
- Razorpay plan mapping
- Feature lists

## Files Modified
1. `lib/razorpay.ts` - Core plan configuration
2. `app/pricing/PricingClientPage.tsx` - Pricing page display
3. `components/PlansPopup.tsx` - Plans popup component
4. `app/dashboard/billing/page.tsx` - Billing page
5. `app/linkezup/page.tsx` - Linkezup page pricing
6. `scripts/test-new-plans.js` - Test script (new)

## Next Steps
1. Test the payment flow with the new plans
2. Verify Razorpay webhook handling with new plan IDs
3. Update any remaining hardcoded plan references
4. Test subscription management with new durations

## Notes
- All prices are in paise for Razorpay compatibility
- Plan durations are now in days instead of months
- Zuper 30 is marked as the "Most Popular" plan
- All existing payment and subscription logic remains compatible

# Onboarding & Gamification Deployment Guide

This document outlines the steps to deploy the new onboarding flow and gamification system.

## Database Migrations

Run these migrations in order on your production Supabase instance:

1. **023_gamification_infrastructure.sql** - Creates event tracking, badges, and user_badges tables
2. **024-onboarding-profile-fields.sql** - Adds avatar, onboarding status, and Goodreads import tracking
3. **025-create-storage-buckets.sql** - Creates storage buckets for avatars and CSV imports

### How to Run Migrations

**Option 1: Supabase Dashboard**
1. Go to SQL Editor in Supabase Dashboard
2. Copy each migration file content
3. Execute in order

**Option 2: Supabase CLI**
```bash
supabase db push
```

## Environment Variables

Ensure these are set in Vercel:

- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., https://pagepass.app)
- `GOOGLE_BOOKS_API_KEY` - For retail price lookup (optional but recommended)
- `RESEND_API_KEY` - For import completion emails

## Storage Buckets

The migrations create two buckets:

1. **avatars** (public) - User profile photos
2. **imports** (private) - Goodreads CSV uploads

Verify they were created in Supabase Dashboard → Storage.

## Post-Deployment Tasks

### 1. Award Founder's Circle Badges

Manually insert Founder's Circle badges for the 18 beta testers:

```sql
-- Get the Founder's Circle badge ID
SELECT id FROM badges WHERE slug = 'founders_circle';

-- Award to beta testers (replace user_ids with actual IDs)
INSERT INTO user_badges (user_id, badge_id, earned_at, is_displayed, metadata)
VALUES
  ('user-id-1', 'badge-id-here', NOW(), true, '{"beta_tester": true}'),
  ('user-id-2', 'badge-id-here', NOW(), true, '{"beta_tester": true}')
  -- ... repeat for all 18 beta testers
ON CONFLICT (user_id, badge_id) DO NOTHING;
```

### 2. Backfill Retail Prices

Run the retail price backfill for existing books:

```bash
# From Next.js console or create a one-time API route
node -e "require('./lib/gamification/retail-price').backfillRetailPrices(1000)"
```

Or create a temporary API route:

```typescript
// app/api/admin/backfill-prices/route.ts
import { backfillRetailPrices } from '@/lib/gamification/retail-price'
import { NextResponse } from 'next/server'

export async function POST() {
  const result = await backfillRetailPrices(1000)
  return NextResponse.json(result)
}
```

Then call: `POST /api/admin/backfill-prices`

### 3. Test Onboarding Flow

1. Create a test user account
2. Go through all 4 onboarding steps
3. Verify:
   - Avatar selection works
   - Profile + contact preferences save
   - Goodreads import uploads and processes
   - Welcome screen shows correct content
   - Invite link flow works

### 4. Test Email Confirmation

1. Sign up with a new email
2. Verify confirmation email is sent
3. Try a restricted action (e.g., borrow a book) before confirming
4. Should see "Please confirm your email" message
5. Confirm email and retry action - should work

## Features Enabled

### Gamification System
- ✅ Event tracking for all user activities
- ✅ 27 achievement badges across 6 categories
- ✅ Auto-badge evaluation after each event
- ✅ Retail price tracking for "value shared" calculations

### Onboarding Flow
- ✅ New auth screen with Login/Join tabs
- ✅ Step 1: Avatar selection (upload or preset)
- ✅ Step 2: Profile + contact preferences
- ✅ Step 3: Goodreads import (async processing)
- ✅ Step 4: Welcome message (contextual based on invite)
- ✅ Progress indicator
- ✅ Invite link persistence through signup

### Email Confirmation
- ✅ Restricted actions until email confirmed
- ✅ Clear error messages
- ✅ Resend confirmation email functionality

## Future Enhancements (Post-Beta)

- Badge UI display on profile
- Stats dashboards
- Monthly "Top Lender/Borrower" cron job
- Wrapped annual summaries
- Platform-wide stats display

## Troubleshooting

### Avatars not uploading
- Check storage bucket permissions in Supabase
- Verify `avatars` bucket is public
- Check RLS policies allow user uploads

### Goodreads import failing
- Check `imports` storage bucket exists
- Verify API route is accessible
- Check Supabase logs for errors
- Ensure user has permission to insert into `goodreads_imports` table

### Badges not awarding
- Check `user_events` table is logging events
- Verify badge trigger conditions in `badges` table
- Check console logs for badge evaluation errors
- Ensure RLS policies allow service role to insert user_badges

## Rollback Plan

If issues arise:

1. Onboarding can be bypassed by setting `onboarding_completed = true` manually
2. Gamification events are logged passively - disabling doesn't break core flows
3. To disable badge evaluation, comment out `evaluateBadges()` call in `lib/gamification/events.ts`

## Support

For questions or issues, contact the development team.

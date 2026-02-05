# Analytics & Admin Panel Setup

## Step 1: Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
cat supabase-analytics-schema.sql
```

This creates:
- `analytics_events` table for tracking user actions
- `admin_settings` table for global settings (ads toggle, etc.)
- Helper functions for DAU/WAU/MAU
- RLS policies

## Step 2: Make Yourself an Admin

In Supabase SQL editor, run:

```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

Replace with your actual email address.

## Step 3: PostHog Setup

1. Create account at https://posthog.com (already done!)
2. Get your Project API Key from Settings
3. Add to `.env.local`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Step 4: Install Dependencies

```bash
npm install
```

This will install `posthog-js` that was added to package.json.

## Step 5: Access Admin Panel

Navigate to `/admin` in your app. You should see:
- Analytics dashboard (DAU, WAU, MAU, stickiness)
- Book/circle/user stats
- **Ad toggle** to turn affiliate links on/off globally

## How to Track Events

In your components:

```typescript
import { trackEvent } from '@/lib/analytics'

// Track a book being added
trackEvent.bookAdded(bookId, 'scan', [circleId])

// Track a borrow request
trackEvent.borrowRequested(bookId, ownerId, circleId)

// Track affiliate link click
trackEvent.affiliateLinkClicked(bookId, 'bookshop', 'book_page')
```

Events are tracked in both:
1. **Supabase** (`analytics_events` table) - for your own queries
2. **PostHog** - for dashboards, funnels, cohorts, session recordings

## Admin Panel Features

### Ad Controls
Toggle affiliate links on/off globally. When disabled:
- No "Buy This Book" links appear
- Cleaner UI for testing or if you want to disable monetization

### Analytics Dashboard
- **Users:** Total, DAU, WAU, MAU
- **Stickiness:** DAU/MAU ratio (target 40%+)
- **Books:** Total, borrowed, added this week
- **Circles:** Total, active in last 30 days
- **Revenue:** Affiliate link clicks

## What Gets Tracked

Essential events (see `lib/analytics.ts`):
- `user_signup` - New user registration
- `book_added` - Book added (manual/scan/import)
- `circle_created` - New circle
- `circle_joined` - Joined existing circle
- `borrow_requested` - Borrow request sent
- `borrow_accepted` - Owner approved
- `borrow_declined` - Owner declined
- `queue_joined` - Joined wait queue
- `queue_passed` - Passed on book offer
- `queue_accepted` - Accepted book offer
- `handoff_ready` - Marked ready to pass on
- `handoff_confirmed` - Book handed to next person
- `affiliate_link_clicked` - Clicked buy link
- `premium_upgrade` - Upgraded to premium (future)

## Querying Analytics

Example SQL queries:

```sql
-- Books added per day (last 7 days)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as books_added
FROM analytics_events
WHERE event_type = 'book_added'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Most active users
SELECT 
  user_id,
  profiles.email,
  COUNT(*) as total_events
FROM analytics_events
JOIN profiles ON profiles.id = analytics_events.user_id
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, profiles.email
ORDER BY total_events DESC
LIMIT 10;

-- Conversion funnel
SELECT 
  event_type,
  COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
WHERE event_type IN ('user_signup', 'book_added', 'borrow_requested', 'borrow_accepted')
GROUP BY event_type;
```

## Next Steps

Once you have data flowing:
1. Check PostHog dashboard for insights
2. Set up cohort retention analysis
3. Create funnels (signup → add book → borrow)
4. Monitor DAU/MAU stickiness weekly
5. Track affiliate revenue

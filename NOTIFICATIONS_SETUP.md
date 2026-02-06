# Notification System Setup Guide

## 🎉 What's Been Built

Complete notification system with:
- ✅ **In-App Notifications** - Bell icon with unread badge
- ✅ **Notification Center** - Full page with all notifications
- ✅ **Email Notifications** - Infrastructure ready (needs email service)
- ✅ **Automated Checks** - Cron jobs for due dates & pass reminders
- ⏳ **Push Notifications** - Ready to add after PWA conversion

---

## 📋 Database Setup (REQUIRED)

Run this SQL in Supabase SQL Editor:

```sql
-- Copy the ENTIRE contents of notifications-migration.sql and run it
```

This creates:
- `notifications` table (stores all notifications)
- `notification_preferences` table (user email preferences)
- Helper functions for creating/managing notifications
- RLS policies for security
- Automated cleanup (30-day retention)

---

## 🔔 Features

### In-App Bell Icon
**Location:** Dashboard header (next to user menu)

**Features:**
- Real-time unread count badge
- Dropdown shows last 10 notifications
- Click notification to navigate
- Mark as read/unread
- Delete notifications
- "Mark all as read" button
- Polls for new notifications every 30 seconds

### Full Notifications Page
**URL:** `/notifications`

**Features:**
- All notifications (up to 100)
- Filter: All / Unread
- Same mark as read/delete functionality
- Better formatting for longer messages
- Full timestamps

### Notification Types

1. **📚 Book Ready** - Your turn in queue
   - Link: `/dashboard/offers`
   - Email: Yes (by default)

2. **⏰ Pass Reminder** - 24h before auto-timeout
   - Link: `/dashboard/offers`
   - Email: Yes (by default)

3. **📅 Book Due Soon** - 2 days before due date
   - Link: `/dashboard/borrowed`
   - Email: Yes (by default)

4. **↩️ Book Returned** - Someone returned your book
   - Link: `/library`
   - Email: Yes (by default)

5. **🎉 Invite Accepted** - Someone used your invite
   - Link: `/admin/signup-analytics`
   - Email: Yes (by default)

6. **✨ New Book in Circle** - Member added book
   - Link: `/circles/[id]`
   - Email: No (by default)

---

## 🤖 Automated Notifications

### Cron Job Schedule

**Check Notifications:** Every 6 hours
- Scans for books needing pass reminders
- Scans for books due in 2 days
- Creates notifications automatically

**Location:** `/api/cron/check-notifications`

**Vercel Config:** `vercel.json`
```json
{
  "path": "/api/cron/check-notifications",
  "schedule": "0 */6 * * *"
}
```

### Manual Triggers

Notifications are also triggered by:
- Queue system (when book becomes ready)
- Return flow (when book returned)
- Invite system (when someone signs up)
- Book creation (when added to circle)

---

## 📧 Email Notifications (Coming Next)

### Current Status
- ✅ Database tracks `emailed` status
- ✅ User preferences table created
- ✅ Email triggers identified in code
- ⏳ Email service integration needed

### To Complete Email:

**Option 1: Resend (Recommended)**
```bash
npm install resend
```

Create `/app/api/send-email/route.ts`:
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { to, subject, html } = await request.json()
  
  await resend.emails.send({
    from: 'Book Circles <notifications@bookcircles.app>',
    to,
    subject,
    html
  })
}
```

**Option 2: Supabase Auth Emails**
- Use Supabase's built-in email templates
- Limited customization
- Free tier included

**Option 3: SendGrid**
- More features, templates
- Requires API key + setup

### Email Templates Needed
1. Book Ready
2. Pass Reminder
3. Book Due Soon
4. Book Returned
5. Invite Accepted

---

## 🔧 Environment Variables

Add to `.env.local` and Vercel:

```bash
# Cron job security
CRON_SECRET=your-random-secret-here

# Email service (when ready)
RESEND_API_KEY=re_xxxxx
# OR
SENDGRID_API_KEY=SG.xxxxx
```

**To generate CRON_SECRET:**
```bash
openssl rand -base64 32
```

Then add to Vercel:
1. Dashboard → Settings → Environment Variables
2. Add `CRON_SECRET` with the value
3. Redeploy

---

## 🎯 Usage Examples

### Creating Notifications Programmatically

```typescript
import { notifyBookReady } from '@/lib/notifications'

// When book becomes available in queue
await notifyBookReady(
  userId,
  bookId,
  "The Great Gatsby"
)
```

### Available Helper Functions

```typescript
// In lib/notifications.ts

notifyBookReady(userId, bookId, bookTitle)
notifyPassReminder(userId, bookId, bookTitle, hoursRemaining)
notifyBookDueSoon(userId, bookId, bookTitle, daysUntilDue)
notifyBookReturned(userId, bookId, bookTitle, borrowerName)
notifyInviteAccepted(userId, inviteeEmail)
notifyNewBook(userId, bookId, bookTitle, author, circleId, circleName, addedBy)
```

### Direct Notification Creation

```typescript
import { createNotification } from '@/lib/notifications'

await createNotification({
  userId: 'uuid',
  type: 'book_ready',
  title: 'Custom Title',
  message: 'Custom message',
  link: '/custom/link',
  data: { customField: 'value' },
  sendEmail: true
})
```

---

## 🧪 Testing

### Test In-App Notifications

1. Log in to the app
2. Look for 🔔 bell icon in dashboard header
3. No notifications yet? Create a test one:

**Via API (in browser console):**
```javascript
await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'book_ready',
    title: 'Test Notification',
    message: 'This is a test!',
    link: '/dashboard'
  })
})
```

Refresh page → bell should show "1" badge

### Test Cron Job Locally

```bash
curl http://localhost:3000/api/cron/check-notifications \
  -H "Authorization: Bearer your-cron-secret"
```

### Test Full Flow

1. **Book Ready:**
   - Join a queue
   - Have owner pass the book to you
   - Should get notification

2. **Pass Reminder:**
   - Wait 24 hours (or manually trigger cron)
   - Should get reminder to accept/pass

3. **Book Due Soon:**
   - Borrow a book
   - Wait until 2 days before due
   - Should get reminder

---

## 🎨 Customization

### Change Notification Icons

Edit `getNotificationIcon()` in:
- `app/components/NotificationBell.tsx`
- `app/notifications/NotificationsList.tsx`

### Change Poll Interval

Edit `NotificationBell.tsx`:
```typescript
// Current: 30 seconds
const interval = setInterval(fetchNotifications, 30000)

// Change to 60 seconds:
const interval = setInterval(fetchNotifications, 60000)
```

### Change Notification Retention

Edit `notifications-migration.sql`:
```sql
-- Current: 30 days
DELETE FROM notifications
WHERE created_at < NOW() - INTERVAL '30 days';

-- Change to 60 days:
DELETE FROM notifications
WHERE created_at < NOW() - INTERVAL '60 days';
```

### Add New Notification Type

1. Add type to `lib/notifications.ts`:
```typescript
type NotificationType = 
  | 'book_ready' 
  | 'your_new_type'
```

2. Create helper function:
```typescript
export async function notifyYourNewType(...) {
  return createNotification({
    userId,
    type: 'your_new_type',
    title: 'Your Title',
    message: 'Your message',
    ...
  })
}
```

3. Add icon mapping in components
4. Call the function where needed

---

## 🚀 Next Steps

### Immediate (Required)
1. ✅ Run `notifications-migration.sql` in Supabase
2. ✅ Add `CRON_SECRET` to Vercel environment variables
3. ✅ Test bell icon appears in dashboard
4. ✅ Create test notification to verify it works

### Short Term (Email)
1. Choose email service (Resend recommended)
2. Create email templates
3. Implement email sending in `lib/notifications.ts`
4. Test email delivery
5. Add unsubscribe functionality

### Medium Term (Enhancement)
1. User notification preferences page
2. Email digest option (daily summary)
3. Notification sound (optional)
4. Desktop notification permission request

### Long Term (After PWA)
1. Browser push notifications
2. Mobile push (iOS/Android)
3. Push notification preferences
4. Rich notifications with images

---

## 📊 Analytics

Track notification effectiveness:
- Open rate (clicked vs shown)
- Mark as read rate
- Delete rate by type
- Email open rate (when implemented)

Add to PostHog:
```typescript
analytics.track('notification_opened', {
  notificationId,
  type,
  timeToOpen: milliseconds
})
```

---

## ❓ FAQ

**Q: Why no notifications showing up?**
A: Make sure you ran the database migration. Check browser console for errors.

**Q: Bell icon not showing?**
A: Check that you're logged in and on the dashboard. The bell only shows for authenticated users.

**Q: Can users turn off notifications?**
A: Yes! The `notification_preferences` table is ready. Just need to build the UI for it.

**Q: How do I test the cron job?**
A: Locally, call the endpoint with the CRON_SECRET. In production, wait or trigger manually via Vercel dashboard.

**Q: Notifications not clearing when marked as read?**
A: Check browser console for API errors. Verify RLS policies are set correctly.

**Q: Can I delete all notifications at once?**
A: Not yet - but you can add a "Clear all" button that calls DELETE on all user notifications.

---

## 🎊 Success!

You now have a complete notification system! Users will:
- See real-time updates in the bell icon
- Get reminded about books due & queue offers
- Stay engaged with your platform

**Next:** Add email notifications for even better engagement!

**After PWA:** Add push notifications for mobile users!

---

**Last Updated:** February 6, 2026  
**Status:** Phase 1 Complete (In-App) ✅

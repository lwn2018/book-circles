# Phase 1 Analytics - Setup Guide

## 🎉 What's Been Built

You now have three major analytics features ready for launch:

### 1. Signup Tracking & Invites ✅
- Unique invite codes for every user
- Tracks who invited whom (referral chains)
- Signup source tracking (direct vs invite)
- Admin dashboard showing top referrers
- User-facing invite generator page

### 2. Queue Analytics ✅
- Pass rate % (how often people decline books)
- Pass reasons breakdown (too busy, not interested, etc.)
- Average wait time in queue
- Accept vs pass comparison
- Books with active queues count

### 3. Idle Books Detection ✅
- Find books that have never been borrowed
- Filter to books 30+ days old
- Show idle days per book
- Identify problem books (90+ days idle)
- Owner and circle information

---

## 🚀 Setup Steps

### Step 1: Run Database Migration

**⚠️ IMPORTANT: Run this in Supabase SQL Editor first!**

Copy the contents of `signup-tracking-migration.sql` and run it in your Supabase project's SQL Editor. This will:
- Add `signup_source`, `invited_by`, `invite_code` columns to profiles
- Create `invites` table
- Set up indexes and RLS policies
- Create invite code generation function

### Step 2: Deploy to Vercel

The code is already pushed to your repo. Vercel will auto-deploy. Wait for deployment to complete.

### Step 3: Test the Features

**Test Signup Tracking:**
1. Go to `/invite` while logged in
2. Click "Generate New Invite Link"
3. Copy the invite link
4. Open in incognito/private window
5. Sign up using that invite link
6. Check Admin Dashboard → Signup Analytics to see the referral

**Test Queue Analytics:**
1. Go to Admin Dashboard
2. Click "Queue Analytics"
3. See pass rates, wait times, and pass reasons
4. Try different date ranges

**Test Idle Books:**
1. Go to Admin Dashboard
2. Click "Idle Books"
3. See books that have never been borrowed
4. Look for books 60+ or 90+ days idle

---

## 📊 Where to Find Everything

### For Users:
- **Generate Invites:** `/invite` or Dashboard → "✉️ Invite Friends"
- **View Their Invites:** `/invite` page shows all invite links

### For Admins:
- **Main Dashboard:** `/admin`
- **Signup Analytics:** `/admin/signup-analytics`
  - Signup sources breakdown
  - Top 10 referrers
  - Recent signups table
- **Queue Analytics:** `/admin/queue-analytics`
  - Pass rate, wait times, accept vs pass
  - Pass reasons breakdown
  - Date range filtering
- **Idle Books:** `/admin/idle-books`
  - Books 30+ days old, never borrowed
  - Idle days tracking
  - Owner and circle info

---

## 🎯 Key Metrics Explained

### Signup Tracking:
- **Direct:** Users who signed up without an invite code
- **Invite:** Users who signed up via invite link
- **Top Referrers:** Users who have invited the most people

### Queue Analytics:
- **Pass Rate:** % of times users decline when offered a book
  - Target: <30% is healthy
  - >50% suggests matching problems
- **Average Wait Time:** Days between joining queue and getting book
  - Target: <14 days ideal
- **Pass Reasons:** Why people decline
  - "Too busy" = timing issue
  - "Not interested anymore" = lost interest
  - "Read it elsewhere" = found another copy
  - "Other" = various reasons

### Idle Books:
- **30-60 days:** New-ish, may just need time
- **60-90 days:** Consider promoting to circles
- **90+ days:** Problem books - wrong audience or poor match
- **Actions:** Owner could add to different circles, improve description, or remove

---

## 💡 How to Use These Insights

### Week 1 Post-Launch:
1. **Check Signup Sources Daily**
   - Are invites working?
   - Which referrers are most active?
   - Celebrate top referrers!

2. **Monitor Queue Pass Rate**
   - If >40%, investigate pass reasons
   - May need better book matching
   - Consider prompting users for preferences

3. **Ignore Idle Books**
   - Too early to have meaningful data
   - Check after 30 days post-launch

### Month 1 Post-Launch:
1. **Referral Campaigns**
   - Reach out to top 5 referrers
   - Thank them, ask for feedback
   - Encourage more invites

2. **Queue Optimization**
   - Look at pass reasons trends
   - If "not interested" is high, improve book descriptions
   - If "too busy" is high, extend offer windows

3. **First Idle Books Review**
   - Contact owners of 60+ day idle books
   - Suggest adding to more circles
   - Consider featuring idle books

### Month 2-3:
1. **Referral Incentives** (Future feature)
   - Could offer premium features for successful referrals
   - Gamify invite competition

2. **Queue Health Dashboard**
   - Track pass rate trends
   - Set up alerts if pass rate >40%

3. **Idle Book Interventions**
   - Auto-suggest circles for idle books
   - "Featured available books" section
   - Owner notifications

---

## 🔧 Technical Details

### Database Schema Changes:
```sql
profiles:
  + signup_source TEXT (direct, invite, etc.)
  + invited_by UUID (references profiles)
  + invite_code TEXT (unique)

invites:
  - id UUID
  - code TEXT (unique, 8 chars)
  - created_by UUID (references profiles)
  - uses_remaining INTEGER (-1 = unlimited)
  - created_at TIMESTAMP
  - expires_at TIMESTAMP (optional)
  - metadata JSONB
```

### API Endpoints:
- `POST /api/invite/generate` - Create new invite
- `GET /api/invite/validate?code=X` - Check if invite is valid
- `POST /api/invite/use` - Decrement invite uses
- `GET /api/admin/queue-stats?start=X&end=Y` - Queue analytics
- `GET /api/admin/idle-books` - List idle books

### Pages:
- `/invite` - User invite generator
- `/admin/signup-analytics` - Admin signup tracking
- `/admin/queue-analytics` - Admin queue metrics
- `/admin/idle-books` - Admin idle books list

---

## 📈 Next Steps

### Immediate (Week 1):
- [ ] Run database migration
- [ ] Test invite system with a friend
- [ ] Check that analytics appear after first real signups
- [ ] Verify queue stats show real data after first passes

### Week 2-4:
- [ ] Add invite link to marketing materials
- [ ] Share top referrer stats in community (if you have one)
- [ ] Monitor pass rate trends
- [ ] Set up weekly check-ins on idle books

### Month 2+:
- [ ] Add per-user metrics (books per user, circles per user)
- [ ] Week 1 retention tracking
- [ ] Cohort analysis by signup month
- [ ] Power user segments (5+ books, 3+ circles)

---

## ❓ FAQ

**Q: Can I customize invite codes?**
A: Not currently - they're auto-generated 8-character codes. Could add custom codes as a future feature.

**Q: Do invite links expire?**
A: No - they're unlimited use and never expire by default. Admins can manually set expiration if needed.

**Q: What counts as a "pass" in queue analytics?**
A: When a user is offered a book (next in queue) and clicks "Pass" instead of "Accept".

**Q: Why are idle books only 30+ days?**
A: Books need time to circulate. 30 days gives reasonable time for discovery and borrowing.

**Q: Can users see their own referral stats?**
A: Not yet - this is admin-only. Could add a "My Referrals" page for users in the future.

**Q: What if pass rate is really high (60%+)?**
A: Investigate pass reasons. May need:
- Better book descriptions
- More granular preferences
- Longer offer windows
- Different matching algorithm

---

## 🎊 Success!

You now have three powerful analytics features:
1. **Know where users come from** (signup tracking)
2. **Measure queue health** (pass rates, wait times)
3. **Find problem books** (idle detection)

These are the foundation for data-driven growth and optimization!

**Last Updated:** 2026-02-06

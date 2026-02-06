# Analytics Implementation Status

## What's Already Working ✅

### Admin Dashboard
- Date range picker (7d, 30d, 90d, month, all time, custom)
- Real-time metrics: DAU, WAU, MAU, Stickiness
- Total counts: Users, Books, Circles
- Range-filtered: New users, Books added, Books borrowed, Active circles
- Affiliate click tracking
- Ad toggle control

### Database Schema
- `analytics_events` table for event tracking
- `admin_settings` table for feature flags
- Helper functions: `get_dau()`, `get_wau()`, `get_mau()`

### PostHog Integration
- Client-side tracking configured
- Events: page views, affiliate clicks, book actions
- User identification

---

## Priority for April Launch 🎯

### 1. User Signup Tracking (High Priority)
**What:** Track where users come from and who invited them

**Implementation:**
- Add `signup_source` and `invited_by` to profiles table
- Track invite links with unique codes
- Dashboard: signup sources breakdown, top referrers

**Time:** ~1 hour

---

### 2. Queue Analytics Dashboard (High Priority)
**What:** Visualize queue performance metrics

**Implementation:**
- Query existing `passes` table for pass/accept rates
- Calculate average wait times from queue position changes
- Dashboard section showing queue health

**Time:** ~45 minutes

---

### 3. Per-User Activity Metrics (Medium Priority)
**What:** Show distribution of power users vs casual users

**Implementation:**
- Query for books per user distribution
- Circles per user distribution
- Borrows per user per month
- Admin dashboard: user segments chart

**Time:** ~30 minutes

---

### 4. Idle Book Detection (Low Priority, Easy Win)
**What:** Find books that have never been borrowed

**Implementation:**
- Query books table for status = 'available' AND created_at > 30 days
- Check if book ever had a loan record
- Admin dashboard: idle books count + list

**Time:** ~20 minutes

---

### 5. Week 1 Retention (Medium Priority)
**What:** % of users who return within 7 days of signup

**Implementation:**
- Query analytics_events for activity in first 7 days after profile creation
- Dashboard: retention funnel visualization

**Time:** ~45 minutes

---

## What's NOT Needed Yet ⏸️

### Phase 2-4 Metrics (Post-Launch)
These can wait until after April launch:
- Cohort retention analysis
- Deep feature usage analytics
- Session tracking
- Premium conversion metrics
- NPS surveys

### Why Wait?
- Need real users to generate meaningful data
- Can iterate based on what questions emerge
- Focus launch effort on core product experience

---

## Recommended Build Order

**This Week (Pre-Launch):**
1. User signup tracking + invite system ✅ Must have
2. Queue analytics dashboard ✅ Must have
3. Idle book detection ✅ Easy win

**Week 1 Post-Launch:**
4. Per-user activity metrics (see power user emergence)
5. Week 1 retention tracking (understand onboarding success)

**Month 1 Post-Launch:**
6. Feature usage deep dive (barcode, Goodreads import)
7. Circle activity patterns (size, engagement)
8. Borrowing flow optimization (request → accept timing)

**Month 2-3:**
9. Retention cohorts
10. Power user segments
11. Affiliate revenue system (if showing promise)

**Month 4-5 (Premium Prep):**
12. Usage distribution for tier gating
13. Monetization signals
14. Premium feature scoping based on data

---

## Quick Questions Before Building

1. **Signup tracking:** Do you want to track marketing sources (social, email, etc.) or just invite chains?

2. **Queue analytics:** What's your success target? (e.g., "Pass rate under 30% is healthy"?)

3. **Referral system:** Do you want a formal referral program with rewards, or just tracking?

4. **Affiliate links:** Want to build the full "Buy This Book" feature now, or wait until you see book activity patterns?

5. **Public roadmap:** Should I create a user-facing version of the roadmap (what features are coming) separate from this analytics roadmap?

---

**Ready to start building?** Let me know which items from the priority list you want me to tackle first! 🚀

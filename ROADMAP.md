# Book Circles - Analytics & Feature Roadmap

**Target Launch:** April 2026

---

## Phase 1: Essential - Track From Day 1 (April Launch)

### User Acquisition
- [ ] Total signups
- [ ] Signups by week/month
- [ ] Signup source (invite link, direct, etc.)
- [ ] User who invited them (referral tracking)

**Status:** ⚠️ Partial - We have total users, need signup tracking & sources

### Core Engagement
- [x] Daily Active Users (DAU) ✅
- [x] Weekly Active Users (WAU) ✅
- [x] Monthly Active Users (MAU) ✅
- [x] DAU/MAU ratio (stickiness - target 40%+) ✅

**Status:** ✅ Complete

### Circle Activity
- [x] Total circles ✅
- [x] Active circles (had activity in last 30 days) ✅
- [ ] Circles created per user
- [ ] Average circle size
- [ ] Circle invites sent vs accepted

**Status:** ⚠️ Partial - Basic metrics exist, need detailed tracking

### Book Activity
- [x] Total books in system ✅
- [x] Books currently on loan ✅
- [x] Books added (by date range) ✅
- [ ] Books added per user
- [ ] Books sitting idle (never borrowed)

**Status:** ⚠️ Partial - Counts exist, need per-user and idle tracking

### Borrowing Flow
- [ ] Borrow requests sent
- [ ] Borrow requests accepted vs declined
- [ ] Average time from request to approval
- [ ] Books borrowed per user per month

**Status:** ❌ Not implemented - Need full borrow request tracking

### Queue System
- [ ] Queue joins
- [x] Pass rate (% who pass when it's their turn) - Data exists in passes table
- [ ] Accept rate (% who accept)
- [ ] Average wait time in queue

**Status:** ⚠️ Partial - System works, needs analytics dashboard

---

## Phase 2: Important - Add Within First 3 Months

### Retention
- [ ] Week 1 retention (% who return after signup week)
- [ ] Week 4 retention (% still active after month 1)
- [ ] Cohort retention by signup month
- [ ] Churn rate

**Status:** ❌ Not implemented

### Feature Usage
- [ ] Barcode scanner usage rate
- [ ] Goodreads import usage rate
- [x] Books added: manual vs scan vs import - Partial data via event tracking
- [ ] Mobile vs desktop usage

**Status:** ⚠️ Partial - Some events tracked, need full feature analytics

### Handoff Flow
- [ ] "Ready to Pass On" clicks
- [ ] Time from "ready" to handoff confirmed
- [ ] Pass-along success rate (book went A→B→C vs A→B→A)
- [ ] Average handoff coordination time

**Status:** ❌ Not implemented - Need handoff event tracking

### Power Users
- [ ] Users with 5+ books added
- [ ] Users in 3+ circles
- [ ] Users who borrow 2+ books/month
- [ ] Users who complete full handoff cycle

**Status:** ❌ Not implemented - Need segmentation queries

### Affiliate Revenue
- [x] Affiliate link clicks ✅
- [ ] Click-through rate by placement
- [ ] Purchases (if trackable)
- [ ] Revenue per user per month
- [ ] Bookshop.org vs Amazon split

**Status:** ⚠️ Partial - Click tracking exists, need full affiliate system

---

## Phase 3: Premium Prep - Add Month 4-5 (Before Premium Launch)

### Usage Patterns (For Premium Gating)
- [ ] Distribution: Users by # of circles (1, 2, 3, 4, 5+)
- [ ] Distribution: Users by # of books (0-10, 11-25, 26-50, 51-100, 100+)
- [ ] Distribution: Users by borrows per month
- [ ] Power user segment size (% of users hitting limits)

**Status:** ❌ Not implemented

### Engagement Depth
- [ ] Sessions per user per week
- [ ] Time spent per session
- [ ] Features used per session
- [ ] Repeat usage rate (come back next day)

**Status:** ❌ Not implemented - Need session tracking

### Social/Viral
- [ ] Invites sent per user
- [ ] Invite acceptance rate
- [ ] Circles per user over time
- [ ] Network effects (do bigger circles create more activity?)

**Status:** ❌ Not implemented

### Monetization Signals
- [ ] Users hitting free tier limits
- [ ] Feature requests in feedback
- [ ] Survey: "Would you pay $X for Y feature?"
- [ ] Affiliate revenue per power user

**Status:** ❌ Not implemented

---

## Phase 4: Optimization - Add After Premium Launch

### Premium Conversion
- [ ] Free to paid conversion rate
- [ ] Time to conversion (days from signup)
- [ ] Conversion by user segment (power users vs casual)
- [ ] Monthly vs annual plan split

**Status:** ❌ Not implemented - Premium not built yet

### Premium Feature Usage
- [ ] Which premium features get used most
- [ ] Feature usage by premium users
- [ ] Premium churn rate
- [ ] Lifetime value (LTV) of premium users

**Status:** ❌ Not implemented - Premium not built yet

### Revenue Analytics
- [ ] Monthly Recurring Revenue (MRR)
- [ ] Average Revenue Per User (ARPU)
- [ ] Customer Acquisition Cost (CAC) - if paid marketing
- [ ] LTV:CAC ratio

**Status:** ❌ Not implemented - Premium not built yet

### Product Health
- [ ] Net Promoter Score (NPS) survey
- [ ] Feature satisfaction ratings
- [ ] Bug reports per user
- [ ] Support ticket volume

**Status:** ❌ Not implemented

---

## Current State Summary

### ✅ Already Built
- PostHog integration for event tracking
- Admin dashboard with date range filtering
- Core engagement metrics (DAU, WAU, MAU, stickiness)
- Basic book/circle/user counts
- Affiliate click tracking (partial)
- Analytics events table in database

### 🚧 In Progress / Partial
- Book activity tracking (have counts, need details)
- Circle activity tracking (have basics, need depth)
- Feature usage events (some tracked, not all)
- Queue analytics (system works, dashboard incomplete)

### ❌ Priority Gaps for April Launch
1. **User signup tracking** - Source, referrer, invite chain
2. **Queue analytics dashboard** - Pass/accept rates, wait times
3. **Per-user metrics** - Books per user, circles per user
4. **Borrowing flow tracking** - Request → accept → return cycle
5. **Idle book detection** - Books never borrowed

---

## Next Steps

**For April Launch (Must Have):**
1. User signup source tracking
2. Queue system analytics
3. Per-user activity metrics
4. Basic retention tracking (Week 1)

**Quick Wins (Can add fast):**
5. Idle book report
6. Power user segments
7. Circle size distribution

**After Launch:**
8. Full retention cohorts
9. Feature usage deep dive
10. Affiliate revenue system

---

## Notes

- PostHog provides free tier for event tracking (1M events/month)
- Current DB schema supports most Phase 1 metrics
- Some Phase 2+ metrics may need additional tables
- Premium features (Phase 4) need payment system integration (Stripe?)

**Last Updated:** 2026-02-06

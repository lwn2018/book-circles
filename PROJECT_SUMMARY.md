# Book Circles - Project Summary
**Status:** Pre-Launch Development (Design + Polish Phase)  
**Launch Timeline:** ~1 month  
**Live URL:** https://book-circles.vercel.app

---

## What We Built

### Core Concept
A community book-sharing platform where users form circles, share their personal libraries, and coordinate book exchanges with two-party handoff confirmations.

---

## ✅ Completed Features

### 1. **Circle Management**
- Create and join circles via invite codes
- View all books owned by circle members
- See book availability status in real-time
- Hide/show books per circle (privacy controls)
- Leave circles from settings

### 2. **Book Library Management**
- Add books manually (title, author, ISBN, cover)
- Google Books API integration (search-as-you-type with auto-populate)
- Import from Goodreads CSV
- Book covers with automatic fallback to color-coded placeholders
- Status tracking: Available, Borrowed, In Transit, Off Shelf

### 3. **Borrowing & Queue System**
- Request to borrow books from circle members
- Automatic queue management (FIFO)
- Queue positions visible to users
- "Pass" on offers with reason tracking
- 14-day loan periods with due dates
- Borrow history tracking

### 4. **Two-Party Handoff Confirmation**
- When user returns/passes a book → handoff initiated
- Both parties must confirm physical exchange
- Book status: Available → In Transit → Borrowed
- Contact preferences (email/phone/none) shared for coordination
- **Batch handoff:** Confirm multiple books at once between same people
- Activity logging for audit trail

### 5. **Gift Feature**
- Books can be marked "gift on borrow"
- When borrowed, ownership transfers permanently
- Ownership history tracked
- Queue notified when gift status changes
- Visual indicators throughout UI

### 6. **Off Shelf Status**
- Mark books temporarily unavailable (lent outside circle, reading, etc.)
- Removes from circulation without deleting
- Can re-shelf when ready

### 7. **Purchase Tracking**
- Buy links (Amazon, Indigo, local bookstores)
- Click tracking for affiliate revenue potential
- Smart buy button logic (hide when borrowed/off shelf)

### 8. **Soft Reminders**
- Weekly reminders for overdue books
- Action buttons: "Still reading" (extend 7 days), "Return it"
- Non-intrusive (once per week max)
- Tracks last reminder sent

### 9. **Search & Discovery**
- Global search across all accessible books
- Filter by circle
- Real-time search with debouncing

### 10. **Notifications System**
- In-app notifications
- Types: book ready, handoff requests, queue updates, reminders
- Mark as read, mark all as read
- Action buttons inline (still reading, confirm handoff)

### 11. **User Profiles & Settings**
- Contact preferences for handoffs
- Default browse view (card/list)
- Circle membership management

### 12. **Security & Privacy**
- Row-level security (RLS) on all tables
- Users only see books in their circles
- Book visibility controls per circle
- Secure handoff confirmations

---

## 🗄️ Technical Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components with Tailwind
- **State Management:** React hooks + Server Actions

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **API:** Next.js API Routes + Server Actions
- **RLS:** PostgreSQL Row Level Security

### Infrastructure
- **Hosting:** Vercel (production)
- **Database:** Supabase Cloud
- **Analytics:** PostHog (recently added)
- **Version Control:** Git + GitHub

### External Integrations
- **Google Books API:** Book metadata & covers
- **Open Library API:** Cover art fallback
- **Goodreads:** Import via CSV export

---

## 📊 Database Schema

**Core Tables:**
- `books` - Book catalog with metadata
- `profiles` - User profiles
- `circles` - Book sharing circles
- `circle_members` - Circle membership
- `book_circle_visibility` - Per-circle book visibility
- `book_queue` - Request queue for each book
- `borrow_history` - Loan tracking
- `handoff_confirmations` - Two-party handoff flow
- `notifications` - In-app notification system
- `ownership_history` - Gift transfer tracking
- `activity_ledger` - Action logging (handoffs, gifts, etc.)
- `purchase_clicks` - Affiliate link tracking

**21+ Migrations Deployed** (all successfully applied to production)

---

## 🎯 User Flows

### Adding a Book
1. Click "Add Book" (modal or page)
2. Type title → Google Books suggestions appear
3. Select book → auto-fills author, ISBN, cover
4. Save → book visible in all user's circles by default

### Borrowing a Book
1. Browse circle → see available books
2. Click "Borrow" on desired book
3. Added to queue (or borrowed immediately if no queue)
4. Notification when book ready
5. Handoff confirmation with current owner
6. Both parties confirm physical exchange
7. Book status updates, due date set (14 days)

### Returning a Book
1. Click "Return" from My Shelf
2. Choose next person in queue (or mark available)
3. If passing to someone: handoff initiated
4. Both parties confirm physical exchange
5. Book transferred, queue updated

### Gifting a Book
1. Toggle "Gift on Borrow" from book options
2. Next borrower becomes permanent owner
3. Book transfers ownership after handoff confirmation
4. Original owner loses book from library

---

## 🚀 Recent Critical Fixes (Feb 10, 2026)

### 1. **Infinite Recursion RLS Bug** ✅ RESOLVED
- **Problem:** All books disappeared for all users
- **Cause:** RLS policy with correlated subquery caused infinite recursion
- **Fix:** Created SECURITY DEFINER function to break recursion (Migration 021)
- **Result:** All books restored, system stable

### 2. **Book Visibility System** ✅ FIXED
- **Problem:** Books missing visibility entries → invisible to users
- **Fix:** Backfilled missing entries, updated add-book flows to create visibility for all user circles
- **Result:** All 35+ books visible in circles

### 3. **Activity Ledger** ✅ CREATED
- **Problem:** Table referenced in code but never created
- **Fix:** Migration 017.5 created table with batch_id support
- **Result:** Batch handoff logging now working

---

## 📋 Current Status

### ✅ Complete & Production-Ready
- All core features working
- All migrations deployed
- Security hardened (RLS policies fixed)
- Build passing, deployed to production
- No critical bugs

### 🎨 In Progress
- **Design work** (handled by Mathieu)
- UI/UX polish based on design feedback

### 📝 Outstanding (Optional/Future)
- Mobile UI polish (button sizes, spacing, touch targets)
- Privacy Policy & Terms of Service (legal docs)
- Activity feed UI (display activity_ledger entries)
- Grouped notifications for batch operations
- Enhanced analytics dashboards

---

## 🔧 Technical Debt: NONE

All critical issues resolved. Codebase is clean, migrations are organized, and infrastructure is stable.

---

## 💡 Feature Ideas (Not Implemented)

These were discussed or could be considered:

- **Reading challenges/goals** (gamification)
- **Book reviews/ratings** within circles
- **Circle chat/messaging**
- **Calendar integration** for handoff scheduling
- **Mobile app** (currently PWA-capable web app)
- **Multi-language support**
- **Book recommendations** based on circle activity
- **Circle analytics** (most popular books, active members)
- **Waiting list notifications** (position updates)
- **Photo upload** for custom book covers

---

## 📊 Metrics & Analytics

**Current Setup:**
- PostHog integrated (added Feb 11, 2026)
- Purchase click tracking (database)
- Borrow history tracking
- Activity ledger (handoffs, gifts)

**Available Metrics:**
- Books per circle
- Borrow rates
- Queue lengths
- Handoff confirmation times
- Gift transfer frequency
- Purchase click-through rates

---

## 🎯 Recommendations for Launch

### Must-Have Before Launch:
1. ✅ Core features (DONE)
2. ✅ Security & RLS (DONE)
3. 🎨 Design polish (IN PROGRESS)
4. 📄 Privacy Policy + Terms of Service (TODO)
5. 🧪 Beta testing with real users (RECOMMENDED)

### Nice-to-Have:
- Mobile UI refinements
- Activity feed display
- Enhanced onboarding flow
- Tutorial/help documentation

### Growth/Marketing Ready:
- Affiliate links ready (Amazon, Indigo, local)
- Analytics tracking in place (PostHog)
- Viral loop: invite codes + circle growth
- SEO-friendly URLs and meta tags

---

## 🛠️ How to Make Changes

### For Developers:
- **Repo:** `book-circles` (private GitHub)
- **Deploy:** `vercel --prod` (auto-deploys on push to main)
- **Database:** Supabase dashboard (SQL Editor for migrations)
- **Logs:** Vercel dashboard + Supabase logs

### For Non-Developers:
- **Content changes:** Ask developer to update
- **Feature requests:** Document requirements → developer implements
- **Bug reports:** Share steps to reproduce + screenshots

---

## 📞 Contact & Support

**Current Maintainer:** Michaela (AI assistant)  
**Project Owner:** Mathieu (Leading With Nice)  
**Infrastructure:** Vercel + Supabase

---

## ⏱️ Development Timeline

- **Initial build:** ~2 weeks (core features)
- **Iterations:** ~1 week (handoffs, gifts, polish)
- **Bug fixes:** 1 day (RLS recursion crisis)
- **Total dev time:** ~3 weeks
- **Launch target:** ~1 month from now

---

**Last Updated:** February 11, 2026  
**Version:** Pre-Launch (Design Phase)

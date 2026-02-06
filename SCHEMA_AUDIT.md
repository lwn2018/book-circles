# PagePass Schema Audit - Current State

**Date:** 2026-02-06  
**Purpose:** Audit existing schema before implementing data tracking infrastructure

---

## Table 1: `borrow_history`

### Current Schema (Inferred from Code)
```sql
borrow_history (
  id uuid PRIMARY KEY,
  book_id uuid REFERENCES books(id),
  borrower_id uuid REFERENCES profiles(id),
  due_date timestamptz,
  returned_at timestamptz,
  created_at timestamptz DEFAULT now()
)
```

### What's Missing (Required by Spec)
- ❌ **`lent_by`** - Who handed the book over (could be owner or previous borrower)
- ❌ **`borrowed_from_user_id`** - Same as lent_by, needed to distinguish pagepasses
- ❌ **`journey_id`** - Link to book_journeys table
- ❌ **`circle_id`** - Which circle this borrow happened in
- ❌ **`is_pagepass`** - Boolean flag for direct handoffs vs returns to owner

**Recommendation:** Add these columns. They're essential for journey tracking and pass-along analytics.

---

## Table 2: `books`

### Current Schema (Inferred from Queries)
```sql
books (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  author text,
  isbn text,
  cover_url text,
  status text,
  owner_id uuid REFERENCES profiles(id),
  current_borrower_id uuid REFERENCES profiles(id),
  circle_id uuid,  -- DEPRECATED per migration-library-model.sql
  borrowed_in_circle_id uuid REFERENCES circles(id),
  next_recipient uuid REFERENCES profiles(id),
  ready_for_pass_on_date timestamptz,
  owner_recall_active boolean DEFAULT false,
  borrowed_at timestamptz,
  due_date timestamptz,
  created_at timestamptz DEFAULT now()
)
```

### What's Missing (Required by Spec - Step 5)
- ❌ **`genres`** text[] - From Google Books categories
- ❌ **`description`** text - Book synopsis
- ❌ **`page_count`** integer - Page count
- ❌ **`published_date`** text - Publication date
- ❌ **`publisher`** text - Publisher name
- ❌ **`language`** text - Language code (default 'en')
- ❌ **`google_books_id`** text - Google Books ID for future lookups

**Recommendation:** Add all these columns. They're needed for publisher insights and analytics.

---

## Table 3: `analytics_events`

### Current Schema (Confirmed from supabase-analytics-schema.sql)
```sql
analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
)

-- Indexes:
- idx_analytics_user (user_id)
- idx_analytics_type (event_type)
- idx_analytics_created (created_at)
- idx_analytics_user_created (user_id, created_at)
```

### Assessment
✅ **Can be used as activity ledger!**

This table already has the flexible schema we need (event_type + jsonb payload). No need to create a separate `activity_ledger` table.

**Action:** Use `analytics_events` for all activity logging from the spec. Just need to:
1. Add new event types (book_borrowed, book_pagepassed, queue_joined, etc.)
2. Populate event_data with the required metadata
3. Add logging calls to API routes

---

## Table 4: `book_queue`

### Current Schema (Partial from supabase-queue-schema.sql)
```sql
book_queue (
  id uuid PRIMARY KEY,
  book_id uuid REFERENCES books(id),
  user_id uuid REFERENCES profiles(id),
  position integer,
  pass_count integer DEFAULT 0,
  last_pass_reason text,
  last_pass_date timestamptz,
  joined_queue_at timestamptz,  -- inferred from lib/queue-actions.ts
  created_at timestamptz DEFAULT now()
)

-- Indexes:
- idx_book_queue_book_position (book_id, position)
```

### Assessment
✅ **Already has everything needed for queue tracking**

The spec's queue events (queue_joined, queue_left) can be logged to `analytics_events`.

---

## Table 5: `book_circle_visibility`

### Current Schema (Confirmed from migration-library-model.sql)
```sql
book_circle_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(book_id, circle_id)
)

-- Indexes:
- idx_book_circle_visibility_book (book_id)
- idx_book_circle_visibility_circle (circle_id)
```

### Assessment
✅ **Exactly as expected**

This is used for opt-out visibility model. No changes needed.

---

## NEW TABLES REQUIRED

### Table 6: `book_journeys` (Required by Spec - Step 3)

**Status:** ❌ DOES NOT EXIST

**Purpose:** Track full lifecycle of a book from when it leaves owner until it returns.

```sql
CREATE TABLE book_journeys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id uuid REFERENCES books(id) NOT NULL,
  owner_id uuid REFERENCES profiles(id) NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  total_hops integer DEFAULT 0,
  circles_visited uuid[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed'))
);
```

**Action:** Create this table (Step 3)

---

### Table 7: `purchase_clicks` (Required by Spec - Step 4)

**Status:** ❌ DOES NOT EXIST

**Purpose:** Track every "Buy on Amazon" click with rich context.

```sql
CREATE TABLE purchase_clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  book_id uuid REFERENCES books(id),
  isbn text,
  book_title text NOT NULL,
  book_author text,
  click_context text NOT NULL CHECK (click_context IN (
    'unavailable_to_borrow',
    'post_read_buy_own_copy',
    'browsing_recommendation',
    'gift_purchase'
  )),
  previously_borrowed boolean DEFAULT false,
  circle_id uuid REFERENCES circles(id),
  search_query text,
  affiliate_tag text DEFAULT 'pagepass-20',
  affiliate_url text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

**Action:** Create this table (Step 4)

---

## SUMMARY

### ✅ What Exists and is Good
1. **`analytics_events`** - Perfect for activity ledger (flexible jsonb schema)
2. **`book_queue`** - All columns needed for queue tracking
3. **`book_circle_visibility`** - Visibility model in place

### ⚠️ What Exists but Needs Enhancement
1. **`books`** - Missing metadata columns (genres, description, page_count, etc.)
2. **`borrow_history`** - Missing journey tracking fields (lent_by, journey_id, is_pagepass, circle_id)

### ❌ What's Missing Entirely
1. **`book_journeys`** - New table needed
2. **`purchase_clicks`** - New table needed

---

## IMPLEMENTATION PRIORITY (Recommended Order)

### Phase 1: Quick Wins (No Breaking Changes)
1. ✅ **Add metadata columns to `books`** (Step 5)
   - ALTER TABLE to add genres, description, page_count, etc.
   - Update book creation flow to capture Google Books metadata
2. ✅ **Create `purchase_clicks` table** (Step 4)
   - New table, no impact on existing code
   - Update Amazon link component to log clicks

### Phase 2: Journey Tracking Foundation
3. ✅ **Create `book_journeys` table** (Step 3)
   - New table, no impact on existing code
4. ✅ **Add journey columns to `borrow_history`**
   - ALTER TABLE to add lent_by, journey_id, circle_id, is_pagepass
   - Update borrow/handoff logic to populate these

### Phase 3: Activity Logging
5. ✅ **Add activity logging to existing API routes** (Step 2)
   - Use existing `analytics_events` table
   - Add logActivity() helper function
   - Insert log calls after successful operations
   - This is purely additive, won't break anything

### Phase 4: Analytics Views
6. ✅ **Create aggregation views** (Step 6)
   - After data starts flowing
   - Views for book stats, genre stats, circle stats

---

## NEXT STEPS

**Immediate Action:**
1. Review this audit with stakeholder
2. Get approval to proceed with Phase 1
3. Create migration SQL files for each phase
4. Implement in order (Phase 1 → Phase 2 → Phase 3 → Phase 4)

**Estimated Time:**
- Phase 1: ~2 hours
- Phase 2: ~3 hours
- Phase 3: ~4 hours (most time-consuming, touching many files)
- Phase 4: ~1 hour

**Total: ~10 hours of dev work** (spread over 2-3 days for testing)

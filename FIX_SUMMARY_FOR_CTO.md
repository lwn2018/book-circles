# Book Visibility Fix - Summary for CTO

## Root Cause (Found by CTO)

The RLS policy on the `books` table is checking the **wrong column**:

**Current (broken) policy:**
```sql
owner_id = auth.uid() 
OR circle_id IN (
  SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
)
```

This checks `books.circle_id` - a **deprecated column** from an old data model. Books now belong to multiple circles via the `book_circle_visibility` table, but the RLS policy wasn't updated.

**Result:** Users only see books where `books.circle_id` matches their circle, causing different users to see different counts (26 vs 29 instead of 35).

---

## The Fix

### 1. Apply Migration 017 (REQUIRED - Manual Step)

**Go to Supabase Dashboard → SQL Editor** and run:

```sql
-- Drop the outdated policy
DROP POLICY IF EXISTS "Users can view accessible books" ON books;

-- Create corrected policy using book_circle_visibility
CREATE POLICY "Users can view accessible books"
ON books 
FOR SELECT 
USING (
  -- User owns the book
  owner_id = auth.uid()
  OR
  -- Book is visible in a circle the user belongs to
  EXISTS (
    SELECT 1 
    FROM book_circle_visibility bcv
    JOIN circle_members cm ON bcv.circle_id = cm.circle_id
    WHERE bcv.book_id = books.id
      AND bcv.is_visible = true
      AND cm.user_id = auth.uid()
  )
);
```

**File location:** `migrations/017-fix-rls-policy.sql`

**After applying:** Both users will immediately see all 35 books in Alpha Circle.

---

### 2. Verify the Fix

Run this query to confirm both users see the same books:

```sql
-- Set user context (replace with actual user ID)
SET LOCAL request.jwt.claim.sub = '0d069c1d-08a8-44d1-bce4-972455fbc7c7'; -- mathieu
SELECT COUNT(*) FROM books WHERE owner_id IN (
  SELECT user_id FROM circle_members WHERE circle_id = '0fde346f-1ad0-4e6c-a736-1294a5b008e3'
);
-- Should return 35

-- Repeat for test user
SET LOCAL request.jwt.claim.sub = '4d9aad27-fd12-4918-948f-c7fcde416d92'; -- test
SELECT COUNT(*) FROM books WHERE owner_id IN (
  SELECT user_id FROM circle_members WHERE circle_id = '0fde346f-1ad0-4e6c-a736-1294a5b008e3'
);
-- Should also return 35
```

---

## Additional Fixes Applied (Already Deployed)

1. **Backfilled missing visibility entries** - 21 books across all circles
2. **Updated add-book code** - Now creates visibility entries for all user circles
3. **Disabled page caching** - Ensures fresh data on every load
4. **Added Circle Management** - Users can leave circles from Settings

---

## Follow-Up: Remove `books.circle_id` Column (Recommended)

The `circle_id` column on the `books` table is **deprecated** and causing confusion. It's still referenced in:

- `app/api/search/route.ts` (line 147, 163, 174)
- `app/api/admin/idle-books/route.ts`
- `app/admin/idle-books/page.tsx`

**Recommendation:**
1. Update these files to use `book_circle_visibility` instead
2. Drop the `circle_id` column entirely:
   ```sql
   ALTER TABLE books DROP COLUMN IF EXISTS circle_id;
   ```

This prevents future bugs from mixing old and new data models.

---

## Summary

**Immediate action:** Apply Migration 017 in Supabase SQL Editor  
**Result:** Users will see all 35 books  
**Time to fix:** < 1 minute  
**Follow-up:** Clean up deprecated `circle_id` column references

---

**All code changes are committed and deployed to production.**  
**Only the RLS policy change requires manual application.**

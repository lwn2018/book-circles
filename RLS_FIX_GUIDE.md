# RLS Fix Guide - Books Table Security

**Issue:** RLS policies on books table were failing, causing all books to disappear.  
**Root Cause:** Policy only checked ONE system (old OR new), but books exist in BOTH.  
**Solution:** Hybrid policy that checks ownership OR old circle_id OR new book_circle_visibility.

---

## 🔒 The Fix (Per CTO)

### Step 1: Run Migration 007

**File:** `migrations/007-fix-rls-hybrid-policy.sql`

This migration:
1. ✅ Backfills book_circle_visibility from old circle_id column
2. ✅ Enables RLS on books table
3. ✅ Drops all conflicting policies
4. ✅ Creates ONE comprehensive policy that checks BOTH systems

**Run this in Supabase SQL Editor:**
```sql
-- Copy/paste the entire contents of 007-fix-rls-hybrid-policy.sql
```

---

## ✅ Testing Steps

### Test 1: Your Own Books
1. Go to "My Library"
2. **Expected:** See all your books
3. **If empty:** RLS is blocking owner check

### Test 2: Circle Books (Old System)
1. Go to a circle
2. Look for books with `circle_id` set (most existing books)
3. **Expected:** See all circle members' books
4. **If empty:** Old system fallback not working

### Test 3: Circle Books (New System)
1. Add a new book via search
2. It should auto-create visibility entries
3. Go to a circle
4. **Expected:** New book appears
5. **If empty:** New system not working

### Test 4: Cindy's Books
1. Go to circle `0fde346f-1ad0-4e6c-a736-1294a5b008e3`
2. **Expected:** See Cindy's 6 books (Testaments, The Nanny, etc.)
3. **If empty:** Visibility entries not working

### Test 5: Security Check
Open browser console and try:
```javascript
// This should FAIL (return 0 or error)
await supabase.from('books').select('*').eq('owner_id', 'SOMEONE_ELSES_USER_ID')
```
**Expected:** No books returned (RLS blocks cross-user access)

---

## 🐛 If Books Still Disappear

### Check RLS Status:
```sql
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'books';
```
Should show: `relrowsecurity = true`

### Check Policies:
```sql
SELECT policyname, cmd, permissive, qual
FROM pg_policies
WHERE tablename = 'books'
ORDER BY policyname;
```
Should show: ONE policy named "Users can view accessible books"

### Check Backfill Worked:
```sql
-- Count visibility entries
SELECT COUNT(*) FROM book_circle_visibility;

-- Count books with circle_id
SELECT COUNT(*) FROM books WHERE circle_id IS NOT NULL;
```
First number should be >= second number.

### Manual Test Query:
```sql
-- Test the EXACT policy logic (replace YOUR_USER_ID)
SELECT 
  b.id,
  b.title,
  b.owner_id,
  b.circle_id,
  CASE 
    WHEN b.owner_id = 'YOUR_USER_ID' THEN 'Owned by you'
    WHEN EXISTS (
      SELECT 1 FROM book_circle_visibility bcv
      JOIN circle_members cm ON bcv.circle_id = cm.circle_id
      WHERE bcv.book_id = b.id
        AND cm.user_id = 'YOUR_USER_ID'
        AND bcv.is_visible = true
    ) THEN 'Visible via NEW system'
    WHEN b.circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = 'YOUR_USER_ID'
    ) THEN 'Visible via OLD system'
    ELSE 'NOT VISIBLE (BUG!)'
  END as visibility_reason
FROM books
LIMIT 20;
```

**All books should show "Owned by you" or "Visible via..."**  
**NONE should show "NOT VISIBLE"**

---

## 🎯 Success Criteria

After running migration 007:
- ✅ All books visible in circles
- ✅ Cindy's books appear in your circle
- ✅ New books from search auto-visible
- ✅ RLS enabled and working
- ✅ Security test fails (can't see other users' books)

**Once all tests pass, RLS is properly secured!** 🔒

---

## 📝 Future Cleanup (Post-Launch)

Once all books have visibility entries and the new system is stable:

1. Remove old `circle_id` fallback from RLS policy
2. Update app queries to ONLY use book_circle_visibility
3. Eventually drop the deprecated `circle_id` column

**But for now, support both systems during transition.**

---

**Status:** Ready to test  
**Risk Level:** Low (backfill is safe, policy is additive)  
**Rollback:** Just disable RLS again if issues (but CTO said don't ship that way)

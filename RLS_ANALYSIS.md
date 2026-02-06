# RLS Policy Analysis - CRITICAL ISSUES FOUND

**Date:** 2026-02-06  
**Status:** 🚨 REQUIRES IMMEDIATE ACTION

---

## 🔴 CRITICAL ISSUES

### C1: Profiles Table - ALL PROFILES VISIBLE TO EVERYONE
**Severity:** CRITICAL  
**Table:** `profiles`  
**Policy:** "Public profiles are viewable by everyone"  
**Issue:** `SELECT ... WHERE true`

**Impact:**
- **ANY visitor** (even unauthenticated) can see ALL user profiles
- Exposes: emails, names, avatars, is_admin status, created_at
- Major privacy violation

**Fix Required:**
```sql
-- Drop the dangerous policy
DROP POLICY "Public profiles are viewable by everyone" ON profiles;

-- Replace with proper policy
CREATE POLICY "Users can view profiles in their circles"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR  -- Can see own profile
    EXISTS (
      SELECT 1 FROM circle_members cm1
      JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
      WHERE cm1.user_id = auth.uid() 
      AND cm2.user_id = profiles.id
    )  -- Can see profiles of people in same circles
  );
```

---

### C2: Circles Table - ALL CIRCLES VISIBLE TO ANY AUTHENTICATED USER
**Severity:** CRITICAL  
**Table:** `circles`  
**Policy:** "Authenticated users can view circles"  
**Issue:** `SELECT ... WHERE auth.uid() IS NOT NULL`

**Impact:**
- Any logged-in user can see ALL circles (names, descriptions, invite codes!)
- Users can see circles they don't belong to
- Exposes private circle information

**Fix Required:**
```sql
-- Drop the dangerous policy
DROP POLICY "Authenticated users can view circles" ON circles;

-- Replace with proper policy
CREATE POLICY "Users can view their own circles"
  ON circles FOR SELECT
  USING (
    owner_id = auth.uid() OR  -- Circle owner
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = circles.id
      AND circle_members.user_id = auth.uid()
    )  -- Circle member
  );
```

---

### C3: Admin Settings - Anyone Can Insert Settings
**Severity:** HIGH  
**Table:** `admin_settings`  
**Policy:** "Admins can insert settings"  
**Issue:** `INSERT ... WITH CHECK null`

**Impact:**
- ANY user can insert admin settings (though might not be able to read them back)
- Could pollute admin settings table
- Potential for DOS attack

**Fix Required:**
```sql
-- Update the policy to actually check for admin
ALTER POLICY "Admins can insert settings" ON admin_settings
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

---

## 🟡 MEDIUM ISSUES

### M1: Analytics Events - No INSERT Check
**Table:** `analytics_events`  
**Policy:** "Users can insert their own analytics events"  
**Issue:** `INSERT ... WITH CHECK null`

**Analysis:** 
- Might be intentional since server-side API sets user_id
- However, client could theoretically insert events for other users
- Recommend adding: `WITH CHECK (user_id = auth.uid())`

**Fix:**
```sql
ALTER POLICY "Users can insert their own analytics events" ON analytics_events
  WITH CHECK (user_id = auth.uid());
```

---

### M2: Books - Multiple UPDATE Policies (Confusing)
**Table:** `books`  
**Policies:** 3 separate UPDATE policies

**Issue:** You have:
1. "Owners can update their books"
2. "Borrowers can update borrowed books"  
3. "Circle members can update books"

**Analysis:**
- Policy #3 is too broad - ANY circle member can update ANY book in the circle
- This means circle members can change ownership, modify book details, etc.
- Should probably restrict to specific columns or remove this policy

**Recommendation:** Review what "Circle members can update books" should actually allow

---

### M3: Book Queue - Anyone Can Insert
**Table:** `book_queue`  
**Policy:** "Users can join queue"  
**Issue:** `INSERT ... WITH CHECK null`

**Fix:**
```sql
ALTER POLICY "Users can join queue" ON book_queue
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM books
      JOIN circle_members ON circle_members.circle_id = books.circle_id
      WHERE books.id = book_queue.book_id
      AND circle_members.user_id = auth.uid()
    )
  );
```

---

### M4: Circle Members - Anyone Can Insert
**Table:** `circle_members`  
**Policy:** "Users can join circles via invite"  
**Issue:** `INSERT ... WITH CHECK null`

**Analysis:**
- Users could add themselves to ANY circle without invite validation
- Invite validation might happen at API level, but RLS should enforce it too

**Recommendation:** Add invite validation or restrict to pending_approval

---

### M5: Notifications - Duplicate Policies
**Table:** `notifications`  
**Issue:** "Users can view their own notifications" appears twice (once for `public`, once for `authenticated`)

**Fix:** Drop one of the duplicates:
```sql
DROP POLICY "Users can read own notifications" ON notifications;
-- Keep only the 'public' role version
```

---

## ✅ GOOD POLICIES

These policies look solid:
- ✅ `book_circle_visibility` - Proper circle membership checks
- ✅ `book_queue` SELECT/UPDATE/DELETE - Good ownership checks
- ✅ `borrow_history` - Proper circle membership check
- ✅ `notification_preferences` - Proper user ownership checks
- ✅ `admin_settings` SELECT/UPDATE - Proper admin checks

---

## IMMEDIATE ACTION REQUIRED

### Priority 1 (Before Launch):
1. **Fix C1 (profiles)** - Currently leaking ALL user data
2. **Fix C2 (circles)** - Currently leaking ALL circle data including invite codes
3. **Fix C3 (admin_settings)** - Prevent non-admins from inserting

### Priority 2 (Before Launch):
4. Fix M1 (analytics_events INSERT)
5. Review M2 (books UPDATE permissions)
6. Fix M3 (book_queue INSERT)
7. Fix M4 (circle_members INSERT)
8. Clean up M5 (duplicate notifications policies)

---

## Test Plan

After fixes, test these scenarios:

### Test 1: Profile Privacy
- [ ] User A cannot see User B's profile (if not in same circle)
- [ ] User A CAN see User B's profile (if in same circle)
- [ ] Unauthenticated user CANNOT see any profiles

### Test 2: Circle Privacy
- [ ] User A cannot see circles they don't belong to
- [ ] User A cannot see invite codes for other circles

### Test 3: Admin Settings
- [ ] Non-admin user CANNOT insert admin settings
- [ ] Non-admin user CANNOT update admin settings
- [ ] Non-admin user can only see ads_enabled setting

### Test 4: Book Updates
- [ ] Circle member CANNOT change book ownership
- [ ] Circle member CANNOT modify critical book fields
- [ ] Owner CAN update their book
- [ ] Borrower CAN update borrowed_until

---

## SQL Script to Fix Critical Issues

```sql
-- =======================
-- CRITICAL FIX #1: PROFILES
-- =======================
DROP POLICY "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Users can view profiles in their circles"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM circle_members cm1
      JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
      WHERE cm1.user_id = auth.uid() 
      AND cm2.user_id = profiles.id
    )
  );

-- =======================
-- CRITICAL FIX #2: CIRCLES
-- =======================
DROP POLICY "Authenticated users can view circles" ON circles;

CREATE POLICY "Users can view their own circles"
  ON circles FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = circles.id
      AND circle_members.user_id = auth.uid()
    )
  );

-- =======================
-- CRITICAL FIX #3: ADMIN SETTINGS
-- =======================
DROP POLICY "Admins can insert settings" ON admin_settings;

CREATE POLICY "Admins can insert settings"
  ON admin_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =======================
-- MEDIUM FIX #1: ANALYTICS
-- =======================
DROP POLICY "Users can insert their own analytics events" ON analytics_events;

CREATE POLICY "Users can insert their own analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =======================
-- CLEANUP: DUPLICATE NOTIFICATIONS
-- =======================
DROP POLICY "Users can read own notifications" ON notifications;
-- Keep only "Users can view their own notifications"

DROP POLICY "Users can update own notifications" ON notifications;
-- Keep only "Users can update their own notifications"
```

---

**Run this SQL in Supabase immediately, then test thoroughly before launch.**

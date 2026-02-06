# RLS Testing Protocol

**Standard Practice:** Always set auth context before testing RLS policies in Supabase SQL Editor.

## Testing RLS Policies in SQL Editor

### Step 1: Set Auth Context (REQUIRED)

```sql
-- Set user ID (replace with actual user UUID)
SET LOCAL request.jwt.claim.sub = '0d069c1d-08a8-44d1-bce4-972455fbc7c7';
SET LOCAL ROLE authenticated;
```

### Step 2: Run Your Query

```sql
-- Now RLS policies apply correctly
SELECT * FROM books;
SELECT * FROM circles;
-- etc.
```

### Step 3: Reset (if testing multiple users)

```sql
RESET ROLE;

-- Set different user
SET LOCAL request.jwt.claim.sub = 'DIFFERENT_USER_ID';
SET LOCAL ROLE authenticated;
```

---

## Why This Matters

**Without auth context:**
- `auth.uid()` returns NULL
- Queries run as unauthenticated user
- RLS blocks most data (correctly)
- Creates false impression that data is missing

**With auth context:**
- Simulates actual logged-in user
- RLS policies evaluate correctly
- See what that user would see in the app

---

## Alternative: Use Table Editor

For admin viewing (bypasses RLS):
1. Dashboard → Table Editor
2. Select table
3. View all rows regardless of RLS

**Note:** This shows ALL data, not filtered by RLS. Use for data verification, not policy testing.

---

## Get User IDs

```sql
-- List all users
SELECT id, email FROM auth.users;

-- Get specific user
SELECT id FROM auth.users WHERE email = 'user@example.com';
```

---

**Last updated:** 2026-02-06  
**Reason:** False alarm from testing without auth context caused books to appear missing

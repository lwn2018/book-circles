# 🚨 URGENT FIX: Books Disappeared

## Problem
All books disappeared for all users (mathieu@yuill.ca, test@yuill.ca, everyone).

## Root Cause
Migration 017 created an RLS policy on the `books` table with **infinite recursion**, causing all user queries to fail with:
```
infinite recursion detected in policy for relation "books"
```

## Solution
Run Migration 019 to fix the RLS policy.

## Steps to Fix (RUN NOW)

### Option 1: Supabase Dashboard (RECOMMENDED)

1. Go to: https://supabase.com/dashboard/project/kuwuymdqtkmljwqppvdz/sql/new
2. Copy the contents of `migrations/019-fix-infinite-recursion-rls.sql`
3. Paste into the SQL editor
4. Click "Run"
5. Refresh the app - books should reappear ✅

### Option 2: Command Line (if you have DB access)

```bash
cd /home/clawdbot/clawd/book-circles
node deploy_019_with_db_url.mjs  # requires DATABASE_URL in .env.local
```

## Verification

After running the migration:

1. **Check the app**: Visit https://book-circles.vercel.app/circles/[circle-id]
2. **Should see**: 35 books in Alpha Circle, 15 in Neighbours
3. **Test with**: mathieu@yuill.ca and test@yuill.ca

Run verification script:
```bash
node test_fixed_query.mjs
```

Expected output:
```
✅ Total books mathieu should see: 35
```

## Technical Details

**The broken policy (Migration 017):**
```sql
EXISTS (
  SELECT 1 
  FROM book_circle_visibility bcv
  JOIN circle_members cm ON bcv.circle_id = cm.circle_id
  WHERE bcv.book_id = books.id  -- ← This creates circular dependency
)
```

**The fixed policy (Migration 019):**
```sql
id IN (
  SELECT bcv.book_id
  FROM book_circle_visibility bcv
  INNER JOIN circle_members cm 
    ON bcv.circle_id = cm.circle_id 
    AND cm.user_id = auth.uid()
  WHERE bcv.is_visible = true
)
```

## Status
- ✅ Fix created: Migration 019
- ⏳ Waiting to deploy: Manual SQL execution required
- 📋 Testing: Simulated fix works (35 books for mathieu)

---
**Created:** 2026-02-10 06:12 UTC
**Priority:** CRITICAL - Blocks all users

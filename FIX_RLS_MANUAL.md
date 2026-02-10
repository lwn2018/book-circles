# Manual RLS Fix - Step by Step

## The Problem
The RLS policy on `books` table has infinite recursion because it references `books.id` in a correlated subquery.

## The Fix
Run these commands **one at a time** and watch for errors:

### Step 1: Connect to database
```bash
ssh root@openclaw.net
export PGHOST="aws-1-ca-central-1.pooler.supabase.com"
export PGPORT="5432"
export PGDATABASE="postgres"
export PGUSER="postgres.kuwuymdqtkmljwqppvdz"
export PGPASSWORD="<your-password>"
```

### Step 2: Check current policies
```bash
psql -c "SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'books';"
```

Expected output:
```
              policyname              
--------------------------------------
 Users can view accessible books
 Users can insert their own books
 Users can update their own books
 (etc...)
```

### Step 3: Drop the broken policy
```bash
psql -c "DROP POLICY IF EXISTS \"Users can view accessible books\" ON books;"
```

Expected output:
```
DROP POLICY
```

If you see an error, STOP and share the error message.

### Step 4: Verify it's gone
```bash
psql -c "SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'books';"
```

"Users can view accessible books" should NOT be in the list.

### Step 5: Create the fixed policy
```bash
psql << 'EOSQL'
CREATE POLICY "Users can view accessible books"
ON books 
FOR SELECT 
USING (
  owner_id = auth.uid()
  OR
  id IN (
    SELECT bcv.book_id
    FROM book_circle_visibility bcv
    INNER JOIN circle_members cm 
      ON bcv.circle_id = cm.circle_id 
      AND cm.user_id = auth.uid()
    WHERE bcv.is_visible = true
  )
);
EOSQL
```

Expected output:
```
CREATE POLICY
```

### Step 6: Verify it worked
```bash
psql -c "SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'books';"
```

"Users can view accessible books" should be back in the list.

### Step 7: Test the app
Visit https://book-circles.vercel.app and check if books appear.

---

## If Step 3 or Step 5 gives an error:
1. Copy the EXACT error message
2. Share it with me
3. Do NOT proceed to the next step

## Alternative: Run the whole migration file
```bash
cd /root/book-circles
./run-migration-psql.sh migrations/019-fix-infinite-recursion-rls.sql
```

This should prompt for the password and show you any errors.

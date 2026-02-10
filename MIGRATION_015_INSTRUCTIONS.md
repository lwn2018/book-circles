# Migration 015: Beta Feedback Table

## How to run this migration:

### Option 1: Supabase Studio (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Click "New Query"
5. Copy the contents of `migrations/015-add-beta-feedback.sql`
6. Paste and click "Run"

### Option 2: psql command line
If you have `psql` installed and database credentials:
```bash
psql "postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" -f migrations/015-add-beta-feedback.sql
```

### Verification
After running, verify the table exists:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'beta_feedback';
```

Should return:
```
 table_name    
---------------
 beta_feedback
```

Check RLS is enabled:
```sql
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'beta_feedback';
```

Should return:
```
    relname     | relrowsecurity 
----------------+----------------
 beta_feedback  | t
```

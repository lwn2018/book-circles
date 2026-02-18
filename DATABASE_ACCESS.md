# Database Access

## IMPORTANT: You have direct database access via psql. USE IT.

**Connection:** Use the Session pooler connection string (in project files or environment).

**Run SQL directly:**


## DO NOT:
- ❌ Use Supabase JS client for DDL (CREATE TABLE, ALTER TABLE, etc.)
- ❌ Ask the human to run SQL for you
- ❌ Wait for permission to run migrations
- ❌ Make excuses about not having access

## Installation & Verification:
- ✅ psql is installed at `/usr/bin/psql`
- ✅ psql is on the exec allowlist
- ✅ You have used it successfully before (check exec-approvals.json)

If you think psql isn't available:
1. Run: `which psql`
2. Run: `psql --version`
3. If genuinely missing: `sudo apt-get install postgresql-client`

**This is solved. Execute your own SQL. No more excuses.**

## Connection String Format:
```
postgresql://postgres.kuwuymdqtkmljwqppvdz:PASSWORD@aws-1-ca-central-1.pooler.supabase.com:6543/postgres
```

Use ${PAGEPASS_DB_PASSWORD} or the password from environment variables.

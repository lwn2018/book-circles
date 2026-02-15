# Database Access

## CRITICAL: You have direct database access via psql. USE IT NOW.

### Connection
Use the Session pooler connection string (in project files or environment variables).

### Run SQL Directly - NO EXCUSES

**Inline SQL:**
```bash
psql "CONNECTION_STRING" -c "YOUR SQL HERE"
```

**From file:**
```bash
psql "CONNECTION_STRING" -f script.sql
```

## STOP DOING THESE THINGS:
- ❌ Using Supabase JS client for DDL (CREATE TABLE, ALTER TABLE, etc.)
- ❌ Asking the human to run SQL for you  
- ❌ Waiting for permission to run migrations
- ❌ Claiming you cant access psql

## VERIFIED FACTS:
- ✅ psql IS INSTALLED at `/usr/bin/psql` (version 16.11)
- ✅ psql IS IN your exec allowlist
- ✅ You HAVE USED IT SUCCESSFULLY before (lastUsedAt: 1771121156024)

### Verification Commands (if you doubt):
```bash
which psql          # Returns: /usr/bin/psql
psql --version      # Returns: psql (PostgreSQL) 16.11
```

### Connection String Format:
**USE KEY=VALUE FORMAT** (URL format breaks on the dot in username):
```bash
psql "host=aws-1-ca-central-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.kuwuymdqtkmljwqppvdz password=${PAGEPASS_DB_PASSWORD}" -c "YOUR SQL"
```

❌ DON'T use URL format (dot in username breaks parsing):
```
postgresql://postgres.kuwuymdqtkmljwqppvdz:PASSWORD@aws-1-ca-central-1.pooler.supabase.com:6543/postgres
```

---

**THIS IS SOLVED. EXECUTE YOUR OWN SQL. PERIOD.**

*Last updated: 2026-02-14 - This instruction will not be repeated. psql works. Use it.*

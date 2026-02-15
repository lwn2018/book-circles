# Database & Exec Access Instructions

## CRITICAL RULES FOR ALL EXEC COMMANDS

### 1. Use FULL PATHS for all commands:
- ✅ `/usr/bin/psql` (not just `psql`)
- ✅ `/usr/bin/git` (not just `git`)
- ✅ `/usr/bin/node` (not just `node`)
- ✅ `/usr/bin/curl` (not just `curl`)

### 2. Use `workdir` parameter instead of `cd`:
- ❌ `cd /path && git status` — BREAKS THE ALLOWLIST
- ✅ Use the `workdir` exec parameter to set working directory

### 3. Full path + workdir = success
This combination works. Don't deviate.

---

## DATABASE ACCESS: Use psql directly!

### Connection
Use the Session pooler connection string (in project files or environment variables).

### Run SQL Directly - NO EXCUSES

**Inline SQL:**
```bash
/usr/bin/psql "CONNECTION_STRING" -c "YOUR SQL HERE"
```

**From file:**
```bash
/usr/bin/psql "CONNECTION_STRING" -f script.sql
```

## STOP DOING THESE THINGS:
- ❌ Using Supabase JS client for DDL (CREATE TABLE, ALTER TABLE, etc.)
- ❌ Asking the human to run SQL for you  
- ❌ Waiting for permission to run migrations
- ❌ Claiming you can't access psql
- ❌ Using `cd` to change directories (use workdir parameter!)
- ❌ Using short command names (use full paths!)

## VERIFIED FACTS:
- ✅ psql IS INSTALLED at `/usr/bin/psql` (version 16.11)
- ✅ git IS INSTALLED at `/usr/bin/git`
- ✅ Both ARE IN your exec allowlist
- ✅ You HAVE USED THEM SUCCESSFULLY

### Connection String Format:
**USE KEY=VALUE FORMAT** (URL format breaks on the dot in username):
```bash
/usr/bin/psql "host=aws-1-ca-central-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.kuwuymdqtkmljwqppvdz password=${PAGEPASS_DB_PASSWORD}" -c "YOUR SQL"
```

---

## GIT COMMANDS

Always use full path and workdir:
```bash
# With workdir parameter set to /home/clawdbot/clawd/book-circles
/usr/bin/git status
/usr/bin/git add -A
/usr/bin/git commit -m "message"
/usr/bin/git push
```

---

**THIS IS SOLVED. USE FULL PATHS. USE WORKDIR. EXECUTE YOUR COMMANDS.**

*Last updated: 2026-02-15*

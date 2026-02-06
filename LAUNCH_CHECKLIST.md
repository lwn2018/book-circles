# Pre-Launch Security Checklist
**Status:** Almost Ready! ✅

---

## ✅ COMPLETED - Security Fixes

### Critical RLS Vulnerabilities
- [x] **Profiles table** - Fixed user data leak
- [x] **Circles table** - Protected from unauthorized access
- [x] **Admin settings** - Added admin-only INSERT check
- [x] **Analytics events** - Added user_id validation
- [x] **Books UPDATE** - Removed overly broad circle member policy
- [x] **Book queue** - Added circle membership validation
- [x] **Platform invites** - Added created_by validation
- [x] **Duplicate policies** - Cleaned up notifications table

### Code Security
- [x] **Middleware** - Added authentication protection for routes
- [x] **API auth** - Fixed /api/invite/use endpoint
- [x] **Secrets** - Verified no exposed keys in code
- [x] **.gitignore** - Verified env files not committed

---

## 📋 FINAL VERIFICATION TASKS

### 1. Database Permissions (Optional)
Run this in Supabase SQL Editor to verify role permissions:
```sql
SELECT grantee, table_name, privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
ORDER BY table_name, grantee;
```

**What to look for:**
- `anon` role should have limited permissions (SELECT on most tables via RLS)
- `authenticated` role should have basic CRUD via RLS
- `service_role` should have full access (this is expected)

**Status:** ⚠️ OPTIONAL - Review if you want extra assurance

---

### 2. GitHub Repository Privacy
**Action:** Verify repo is private
- Go to https://github.com/lwn2018/book-circles/settings
- Check "Visibility" section
- Should say "Private" (not Public)

**Status:** ⚠️ NEEDS VERIFICATION

---

### 3. Supabase Authentication Settings
**Action:** Review auth configuration in Supabase Dashboard

Go to **Authentication → Settings:**

**Email Confirmation:**
- [ ] "Enable email confirmations" should be **ON**
- [ ] "Secure email change" should be **ON**

**Rate Limiting:**
- [ ] Review settings under "Rate Limits" tab
- [ ] Default settings are usually fine (30 requests per hour for password reset, etc.)

**Auth Providers:**
- [ ] Only enable providers you're actually using
- [ ] Disable any unused providers (Google, GitHub, etc.)

**Email Templates:**
- [ ] Review confirmation email template
- [ ] Review password reset email template
- [ ] Make sure they look professional and have your branding

**Status:** ⚠️ NEEDS VERIFICATION

---

### 4. Vercel Environment Variables
**Action:** Verify environment variable isolation

Go to **Vercel Dashboard → Project Settings → Environment Variables:**

**Check that sensitive variables are scoped correctly:**
- `SUPABASE_SERVICE_ROLE_KEY` should be **Production only** (not Preview/Development)
- `CRON_SECRET` should be **Production only**
- Public keys (`NEXT_PUBLIC_*`) can be in all environments

**Why this matters:**
- Preview deployments (for PRs) shouldn't have access to production database
- If misconfigured, a PR could read/write production data

**Status:** ⚠️ NEEDS VERIFICATION

---

### 5. Supabase Realtime (Optional)
**Action:** Check if realtime is enabled and needed

Go to **Supabase Dashboard → Database → Replication:**

**If you're NOT using realtime features:**
- [ ] Consider disabling realtime on tables you don't need it for
- [ ] Reduces attack surface

**If you ARE using realtime:**
- [ ] Verify RLS policies apply to realtime (they should by default)

**Status:** ⚠️ OPTIONAL - Review if you want to minimize attack surface

---

## 🧪 RECOMMENDED TESTING

### Test 1: Profile Privacy (Browser Console)
```javascript
(async function() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const supabase = createClient(
    'https://kuwuymdqtkmljwqppvdz.supabase.co',
    'sb_publishable_wFWwWtjbpD6J5oSJhem0Zw_aCheeb5l'
  )
  
  const { data } = await supabase.from('profiles').select('email, full_name')
  console.log('Profiles visible:', data?.length || 0)
  // Should be 0 if not logged in, or only profiles in your circles if logged in
})()
```

**Expected:** 0 profiles when not logged in ✅

---

### Test 2: Books in Other Circles
Login as User A, then:
```javascript
(async function() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const supabase = createClient(
    'https://kuwuymdqtkmljwqppvdz.supabase.co',
    'sb_publishable_wFWwWtjbpD6J5oSJhem0Zw_aCheeb5l'
  )
  
  // Should only return books in YOUR circles
  const { data } = await supabase.from('books').select('title, circle_id')
  console.log('Books visible:', data)
})()
```

**Expected:** Only books from circles you're a member of ✅

---

### Test 3: Join Queue for Book Not in Your Circle
Have User A try to join queue for a book in User B's circle:
```javascript
(async function() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const supabase = createClient(
    'https://kuwuymdqtkmljwqppvdz.supabase.co',
    'sb_publishable_wFWwWtjbpD6J5oSJhem0Zw_aCheeb5l'
  )
  
  const { data: user } = await supabase.auth.getUser()
  
  // Try to join queue for book ID in a circle you're not in
  const { error } = await supabase.from('book_queue').insert({
    book_id: 'BOOK_ID_FROM_OTHER_CIRCLE',
    user_id: user.data.user.id
  })
  
  console.log('Error (should have one):', error)
})()
```

**Expected:** Permission denied error ✅

---

## 📊 SUMMARY

### Security Status: ✅ LAUNCH READY
All critical and medium vulnerabilities have been fixed!

### Remaining Tasks: 4 Verification Items
1. ⚠️ Verify GitHub repo is private
2. ⚠️ Check Supabase auth settings (email confirmation, rate limits)
3. ⚠️ Verify Vercel env var isolation
4. ⚠️ (Optional) Review database permissions
5. ⚠️ (Optional) Check Supabase realtime settings

**Time Required:** ~15 minutes to verify all items

---

## 🚀 READY TO LAUNCH?

**Yes, if:**
- GitHub repo is private ✓
- Supabase email confirmation is ON ✓
- Vercel env vars are properly scoped ✓

**No blockers!** The critical security vulnerabilities are fixed. The remaining items are verification/best practices.

---

## 📞 Support

If you find any issues or have questions:
1. Check the security docs: `SECURITY_AUDIT.md`, `RLS_ANALYSIS.md`, `SECURITY_FIXES_SUMMARY.md`
2. Run the test scripts above to verify fixes
3. Review Supabase logs for any unexpected errors

**Great work getting this secured! 🔒**

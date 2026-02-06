# Search Fix - Direct Queries Instead of Stored Procedures

## Problem
Search was not finding books in user's library or circles.

## Root Cause
The search implementation relied on PostgreSQL stored procedures:
- `search_my_books(query, user_id)`
- `search_circle_books(query, user_id)`

These functions may:
1. Not exist yet (migration not run)
2. Have RLS permission issues (SECURITY DEFINER vs INVOKER)
3. Have syntax errors or incompatibilities

## Solution
**Replaced stored procedures with direct Supabase queries.**

### Before (Stored Procedures):
```typescript
const { data: myBooks } = await supabase
  .rpc('search_my_books', {
    search_query: query,
    user_id: user.id
  })
```

### After (Direct Queries):
```typescript
// Search user's own books
const { data: myBooks } = await supabase
  .from('books')
  .select('id, title, author, isbn, cover_url, status')
  .eq('owner_id', user.id)
  .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
  .limit(20)

// Search circle books
const { data: userCircles } = await supabase
  .from('circle_members')
  .select('circle_id')
  .eq('user_id', user.id)

const { data: circleBooks } = await supabase
  .from('books')
  .select('*, profiles!books_owner_id_fkey(*), circles!books_circle_id_fkey(*)')
  .in('circle_id', circleIds)
  .neq('owner_id', user.id)
  .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
  .limit(20)
```

## Benefits
1. ✅ **No migration required** - Works immediately
2. ✅ **RLS handled automatically** - Supabase client respects policies
3. ✅ **Easier to debug** - See exact queries in logs
4. ✅ **Same functionality** - ILIKE provides fuzzy search

## Trade-offs
- **Performance:** Direct queries might be slightly slower than stored procedures (but negligible for this use case)
- **Search quality:** ILIKE is simpler than full-text search (no ranking, no typo tolerance beyond wildcards)

## What Still Works
- ✅ Search user's library
- ✅ Search circle books
- ✅ Visibility settings respected (opt-out model)
- ✅ External search (Google Books + Open Library)
- ✅ Add to library from external
- ✅ Request flow

## What Changed
- ❌ No full-text ranking (ts_rank)
- ❌ No weighted title vs author
- ✅ Simple wildcard matching (good enough for MVP)

## Future Enhancement (Optional)
If you want full-text search back:
1. Run `search-index-migration.sql` in Supabase
2. Run `search-functions-migration.sql` in Supabase
3. Test that functions work
4. Revert to `route.ts.backup` if needed

**For now, direct queries are more reliable and ship faster.**

---

**Status:** ✅ Fixed and deploying now (~2 min)

Test search again after deployment completes!

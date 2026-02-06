# Technical Debt & Future Cleanup

## Priority: Medium (Next 6 Weeks)

### 1. Consolidate Book Visibility System

**Issue:** Currently running two parallel systems for book visibility:
1. **Old system:** `books.circle_id` column (direct FK to circles)
2. **New system:** `book_circle_visibility` table (many-to-many, per-circle visibility)

**Why it's debt:**
- Having two systems for the same thing creates confusion
- Developers might query only one system and miss data
- RLS policies must check both, making them complex
- Future features might forget to update both

**Current state:**
- ✅ RLS policy checks both systems (hybrid approach working)
- ✅ Backfill exists to migrate old → new
- ⚠️ Both systems still active and writable

**Cleanup tasks:**

#### Phase 1: Ensure Complete Migration (1-2 days)
```sql
-- Verify all books have visibility entries
SELECT COUNT(*) FROM books 
WHERE circle_id IS NOT NULL 
AND id NOT IN (SELECT book_id FROM book_circle_visibility);
-- Should return 0

-- If any missing, run backfill:
INSERT INTO book_circle_visibility (book_id, circle_id, is_visible)
SELECT id, circle_id, true
FROM books
WHERE circle_id IS NOT NULL
AND id NOT IN (SELECT book_id FROM book_circle_visibility)
ON CONFLICT DO NOTHING;
```

#### Phase 2: Update Application Code (2-3 days)
- Audit all queries that reference `books.circle_id`
- Replace with `book_circle_visibility` lookups
- Update any INSERT/UPDATE logic
- Test all book visibility features

#### Phase 3: Deprecate Old Column (1 day)
```sql
-- Make column nullable if not already
ALTER TABLE books ALTER COLUMN circle_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN books.circle_id IS 'DEPRECATED: Use book_circle_visibility table instead. Will be removed in future migration.';
```

#### Phase 4: Monitor (1-2 weeks)
- Watch for any bugs related to book visibility
- Confirm no queries still rely on `circle_id`

#### Phase 5: Remove Old System (1 day)
```sql
-- Drop the column
ALTER TABLE books DROP COLUMN circle_id;

-- Simplify RLS policy (remove backward compatibility)
DROP POLICY "Users can view accessible books" ON books;
CREATE POLICY "Users can view accessible books"
  ON books FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR id IN (
      SELECT bcv.book_id FROM book_circle_visibility bcv
      JOIN circle_members cm ON bcv.circle_id = cm.circle_id
      WHERE cm.user_id = auth.uid() AND bcv.is_visible = true
    )
  );
```

**Timeline:** ~2-3 weeks total effort, can be done incrementally

---

## Other Potential Tech Debt

*(Add items here as they're identified)*

---

**Last updated:** 2026-02-06  
**Per:** CTO feedback after RLS testing incident

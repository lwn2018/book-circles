# Debug: Borrow Button Not Working

**Symptom:** Button flashes to "Borrowing..." but book doesn't get borrowed.

## Likely Causes

### 1. RLS Policy Blocking UPDATE
The most likely issue: The books table has UPDATE policies that check:
- "Owners can update their books" ✅
- "Borrowers can update borrowed books" ⚠️ **Problem here**
- "Circle members can update books" ⚠️ **Or here**

**Issue:** "Borrowers can update borrowed books" probably checks:
```sql
USING (current_borrower_id = auth.uid())
```

This means you can only UPDATE if you're **already** the borrower. But when borrowing, you're trying to SET yourself as the borrower, which fails the check.

### 2. Missing borrowed_in_circle_id
The books table has a `borrowed_in_circle_id` column that needs to be set when borrowing.

## Immediate Fix

Add better error handling to see what's actually failing:

```typescript
const handleBorrow = async (bookId: string) => {
  setLoading(bookId)
  
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 14)

  const { error } = await supabase
    .from('books')
    .update({
      status: 'borrowed',
      current_borrower_id: userId,
      borrowed_at: new Date().toISOString(),
      due_date: dueDate.toISOString(),
      borrowed_in_circle_id: circleId  // ← Add this!
    })
    .eq('id', bookId)

  if (error) {
    console.error('Borrow error:', error)  // ← Log it!
    alert(`Failed to borrow: ${error.message}`)  // ← Show it!
    setLoading(null)
    return  // ← Stop here!
  }

  // Create borrow history
  await supabase
    .from('borrow_history')
    .insert({
      book_id: bookId,
      borrower_id: userId,
      due_date: dueDate.toISOString()
    })

  setLoading(null)
  router.refresh()
}
```

## Check Console Now

Open browser console (F12) and try to borrow. Look for:
- Any errors (red text)
- The error message content
- Network tab → check if the UPDATE request returns 200 or error

## Expected RLS Fix

If it's the RLS policy issue, we need:

```sql
-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Borrowers can update borrowed books" ON books;

-- Create policy that allows borrowing
CREATE POLICY "Circle members can borrow books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (
    -- Can borrow if book is available and you're in the circle
    status = 'available' AND
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_id = books.circle_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Can only set yourself as borrower
    current_borrower_id = auth.uid()
  );

-- Separate policy for returning books you borrowed
CREATE POLICY "Borrowers can return books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (
    current_borrower_id = auth.uid()
  )
  WITH CHECK (
    -- Can clear borrower to return
    current_borrower_id IS NULL OR current_borrower_id = auth.uid()
  );
```

---

**Next Step:** Run borrow action with console open and report the error message.

const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing Goodreads storage feature...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "feat: Store Goodreads library + Import More feature

Phase 2 & 3 complete:

1. Database storage:
   - New goodreads_library table stores parsed CSV
   - Tracks which books have been imported
   - RLS policies for user-only access

2. API routes:
   - GET /api/goodreads/library - load stored library
   - POST /api/goodreads/library - save parsed CSV
   - PATCH /api/goodreads/library - mark book as imported

3. Import More UX:
   - Shows saved library on return (no re-upload needed)
   - Already imported books shown greyed out with green check
   - Can't select already-imported books
   - Shows count of previously imported books
   
4. Migration 028 ready to run"`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);

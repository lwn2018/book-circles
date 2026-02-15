const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing import fixes...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "fix: Goodreads import - use API route + fix shelf counts

1. Import now uses /api/books/add (bypasses RLS)
2. Fixed shelf counting - exact match instead of includes()
   - 'read' no longer matches 'currently-reading'
   - 'own' now exact matches 'owned' or 'own'"`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);

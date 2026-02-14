const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing Goodreads curation feature...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "feat: Goodreads curation UI with shelf filters and grid layout

- Add Owned/Read/To-Read/All filter pills
- Pre-select 'Owned' books by default
- Grid layout with book cover placeholders
- Selection checkboxes with visual feedback
- Import progress bar with live counter
- Toast notification on completion"`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);

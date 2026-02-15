const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
console.log(execSync(`git -C ${dir} commit -m "fix: Move import page to (app) layout for bottom nav

- Import page now at /app/(app)/library/import
- Bottom nav (Circles/Library/Shelf) now visible
- Added debug logging to stored library loading
- Shows book count in stored library message"`, { encoding: 'utf8' }));
console.log(execSync(`git -C ${dir} push`, { encoding: 'utf8' }));

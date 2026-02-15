const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing curation screen changes...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "feat: Compact curation list + auto-fetch covers on import

Curation screen changes:
- Removed cover images (no API calls during selection)
- Compact list: checkbox | title | author | star rating
- Guidance message for 50+ books (start with 20-30)
- Smaller filter pills for mobile

Import changes:
- /api/books/add now auto-fetches covers from Google Books
- Only fetches for books actually imported (not previewed)
- Falls back gracefully if cover not found"`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);

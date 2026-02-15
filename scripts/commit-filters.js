const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
console.log(execSync(`git -C ${dir} commit -m "feat: Add star rating filter + author search to Goodreads import

- Min rating filter: All, 3+, 4+, 5 stars
- Author search box: case-insensitive partial match
- Author filter on separate line for visibility
- All filters combine (shelf + rating + author)"`, { encoding: 'utf8' }));
console.log(execSync(`git -C ${dir} push`, { encoding: 'utf8' }));

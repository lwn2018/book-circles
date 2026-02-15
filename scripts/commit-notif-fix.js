const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing notification column fix...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "fix: Use correct column names for notifications

- Changed 'link' to 'action_url' (what bell expects)
- Changed 'data' to 'metadata' (consistent naming)
- Notifications should now appear in bell for all users"`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);

const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing notification debug + faster polling...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "fix: Faster bell polling (10s) + notification debug logging

- Reduced poll interval from 30s to 10s
- Added logging to createNotification to debug missing notifications
- Removed metadata field (may not exist in table)"`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);

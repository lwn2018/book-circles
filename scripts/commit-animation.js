const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing animation removal...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "fix: Remove flying book animation, add Done buttons

- Replaced flying book animation with simple success screen
- Added 'Go to My Shelf' and 'Browse Circles' buttons
- No more getting stuck after handoff confirmation"`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);

const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing navigation fix...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "fix: Add navigation buttons after handoff confirmation

Users were stuck on 'Waiting for X to confirm' with no way to leave.
Now shows 'Go to My Shelf' and 'Browse Circles' buttons."`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);

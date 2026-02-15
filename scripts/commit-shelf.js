const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing shelf incoming handoffs...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "feat: Show incoming handoffs on shelf for queue people

- Added 'Incoming Books' section (green) for books coming TO user
- Renamed existing section to 'Pending Handoffs' (yellow) for outgoing
- Queue person can now see when a book is being passed to them
- Both sections link to handoff confirmation page"`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);

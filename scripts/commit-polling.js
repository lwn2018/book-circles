const { execSync } = require('child_process');
const dir = '/home/clawdbot/clawd/book-circles';

console.log('Committing polling fix...');
execSync(`git -C ${dir} add -A`, { stdio: 'inherit' });
const result = execSync(`git -C ${dir} commit -m "feat: Add polling to handoff waiting screen

- Poll every 5 seconds when waiting for other person
- When both confirm, show success screen for BOTH parties
- Created /api/handoff/[id]/status endpoint
- Equal celebration for giver and receiver"`, { encoding: 'utf8' });
console.log(result);
const push = execSync(`git -C ${dir} push`, { encoding: 'utf8' });
console.log(push);
